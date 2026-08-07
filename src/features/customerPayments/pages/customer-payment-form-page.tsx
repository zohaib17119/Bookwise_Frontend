import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { FieldGrid } from "@/components/shared/field-grid";
import { AllocationEditor } from "@/components/documents/allocation-editor";
import { AllocationSummaryCard } from "@/components/documents/allocation-summary-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import {
  useAllocateCustomerPayment,
  useCreateCustomerPayment,
} from "@/features/customerPayments/hooks/use-customer-payments";
import {
  customerPaymentSchema,
  type CustomerPaymentFormInput,
  type CustomerPaymentFormValues,
} from "@/features/customerPayments/schemas/customer-payment.schema";
import { useOpenInvoicesByCustomer } from "@/features/invoices/hooks/use-invoices";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";
import { getAllocatedTotal } from "@/features/shared/utils/document-calculations";
import { toMoneyDecimalString } from "@/features/shared/utils/decimal-string";
import { parseMoney, toMoneyString, validateAllocations } from "@/lib/utils/money";

export function CustomerPaymentFormPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();
  const presetCustomerId = searchParams.get("customerId") ?? "";
  const { company, permissions } = useActiveCompany();
  const customersQuery = useCustomerOptions(companyId);
  const createMutation = useCreateCustomerPayment(companyId);
  const allocateMutation = useAllocateCustomerPayment(companyId);
  const canManage = canManageEntity(permissions, "customer_payments");
  const currencyCode = company?.baseCurrencyCode ?? company?.currencyCode ?? "USD";
  const form = useForm<CustomerPaymentFormInput, undefined, CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      customerId: presetCustomerId,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      amount: "",
      notes: "",
    },
  });
  const formErrors = form.formState.errors;
  const hasFormErrors = Object.keys(formErrors).length > 0 && form.formState.isSubmitted;
  const selectedCustomerId = form.watch("customerId");
  const watchedAmount = form.watch("amount");
  const openInvoicesQuery = useOpenInvoicesByCustomer(companyId, selectedCustomerId || undefined);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const allocationDocuments = useMemo(
    () =>
      (openInvoicesQuery.data ?? []).map((invoice) => ({
        id: invoice.id,
        number: invoice.invoiceNumber || "Invoice",
        documentDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amountDue: invoice.amountDue ?? "0",
      })),
    [openInvoicesQuery.data],
  );
  const allocatedTotal = getAllocatedTotal(
    Object.entries(allocations).map(([documentId, allocatedAmount]) => ({
      documentId,
      allocatedAmount,
    })),
  );
  const unappliedPreview = parseMoney(watchedAmount) - allocatedTotal;

  if (!canManage) {
    return <Alert title="Customer payments are unavailable" description="Your current company membership does not include customer payment management." variant="destructive" />;
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={<Button asChild variant="ghost"><Link to={`/app/company/${companyId}/customer-payments`}>Back to payments</Link></Button>}
          description="Record a customer payment and optionally allocate it against open invoices."
          eyebrow="Receivables"
          title="Record customer payment"
        />
      }
    >
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={form.handleSubmit(async (values) => {
          const validationErrors = validateAllocations({
            paymentAmount: values.amount,
            allocations,
            documents: allocationDocuments,
          });

          if (validationErrors.length) {
            setAllocationError(validationErrors[0]);
            return;
          }

          setAllocationError(null);

          const payment = await createMutation.mutateAsync({
            customerId: values.customerId,
            paymentDate: values.paymentDate,
            paymentMethod: values.paymentMethod,
            referenceNumber: values.referenceNumber || undefined,
            amount: toMoneyDecimalString(values.amount),
            notes: values.notes || undefined,
          });

          const nonZeroAllocations = Object.entries(allocations)
            .filter(([, amount]) => parseMoney(amount) > 0)
            .map(([invoiceId, amount]) => ({
              invoiceId,
              amount: toMoneyDecimalString(amount),
            }));

          if (nonZeroAllocations.length) {
            await allocateMutation.mutateAsync({
              paymentId: payment.id,
              payload: { allocations: nonZeroAllocations },
            });
          }

          navigate(`/app/company/${companyId}/customer-payments/${payment.id}`);
        })}
      >
        <div className="space-y-6">
          {hasFormErrors ? (
            <Alert
              description="Fix the highlighted fields before recording this payment."
              title="Please complete required fields"
              variant="destructive"
            />
          ) : null}
          {createMutation.error ? <Alert title={createMutation.error.message} variant="destructive" /> : null}
          {allocateMutation.error ? <Alert title={allocateMutation.error.message} variant="destructive" /> : null}
          {allocationError ? <Alert title={allocationError} variant="destructive" /> : null}

          <FormSection title="Payment details">
            <FieldGrid>
              <CounterpartySelect
                error={formErrors.customerId?.message}
                label="Customer"
                onChange={(value) => form.setValue("customerId", value, { shouldValidate: true })}
                options={(customersQuery.data ?? []).map((customer) => ({
                  id: customer.id,
                  label: customer.displayName,
                  secondary: customer.customerCode ?? undefined,
                }))}
                placeholder="Select customer"
                value={selectedCustomerId}
              />
              <FormField label="Payment date" error={formErrors.paymentDate?.message}>
                <Input type="date" {...form.register("paymentDate")} />
              </FormField>
              <FormField label="Payment method" error={formErrors.paymentMethod?.message}>
                <Input {...form.register("paymentMethod")} placeholder="Bank Transfer" />
              </FormField>
              <FormField label="Reference number">
                <Input {...form.register("referenceNumber")} placeholder="Bank reference" />
              </FormField>
              <FormField label="Amount" error={formErrors.amount?.message}>
                <Input type="number" step="0.01" {...form.register("amount")} />
              </FormField>
            </FieldGrid>
            <FormField label="Notes">
              <Textarea {...form.register("notes")} placeholder="Internal payment notes" />
            </FormField>
          </FormSection>

          <FormSection title="Invoice allocation" description="Allocate this payment across open invoices if the backend allocation endpoint is available.">
            <AllocationEditor
              allocations={allocations}
              currencyCode={currencyCode}
              documents={allocationDocuments}
              onAllocationChange={(documentId, amount) => {
                setAllocationError(null);
                setAllocations((current) => ({ ...current, [documentId]: amount }));
              }}
            />
          </FormSection>
        </div>

        <div className="space-y-4">
          <AllocationSummaryCard
            allocations={allocationDocuments
              .filter((document) => parseMoney(allocations[document.id] ?? 0) > 0)
              .map((document) => ({
                documentId: document.id,
                documentNumber: document.number,
                amountDue: toMoneyString(document.amountDue),
                allocatedAmount: toMoneyString(allocations[document.id] ?? 0),
              }))}
            currencyCode={currencyCode}
            title="Allocation preview"
            totalAmount={toMoneyString(watchedAmount)}
            unappliedAmount={toMoneyString(unappliedPreview)}
          />
          <div className="surface p-5">
            <p className="text-sm text-muted-foreground">Amount preview</p>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrency(toMoneyString(watchedAmount), currencyCode)}
            </p>
          </div>
          <Button
            className="w-full"
            isLoading={createMutation.isPending || allocateMutation.isPending}
            type="submit"
          >
            Record payment
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
