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
  const form = useForm<CustomerPaymentFormInput, undefined, CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: {
      customerId: presetCustomerId,
      paymentDate: "",
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      amount: undefined,
      notes: "",
    },
  });
  const selectedCustomerId = form.watch("customerId");
  const openInvoicesQuery = useOpenInvoicesByCustomer(companyId, selectedCustomerId || undefined);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const allocationDocuments = useMemo(
    () =>
      (openInvoicesQuery.data ?? [])
        .filter((invoice) => (invoice.amountDue ?? 0) > 0)
        .map((invoice) => ({
          id: invoice.id,
          number: invoice.invoiceNumber || "Invoice",
          documentDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          amountDue: invoice.amountDue ?? 0,
        })),
    [openInvoicesQuery.data],
  );
  const allocatedTotal = getAllocatedTotal(
    Object.entries(allocations).map(([documentId, allocatedAmount]) => ({
      documentId,
      allocatedAmount,
    })),
  );
  const unappliedPreview = Number(form.watch("amount") || 0) - allocatedTotal;

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
          console.log("values",values)
          const payment = await createMutation.mutateAsync({
            customerId: values.customerId,
            paymentDate: values.paymentDate || undefined,
            paymentMethod: values.paymentMethod,
            referenceNumber: values.referenceNumber || undefined,
            amount: values.amount.toString(),
            notes: values.notes || undefined,
          });

          const nonZeroAllocations = Object.entries(allocations)
            .filter(([, amount]) => amount > 0)
            .map(([invoiceId, amount]) => ({ invoiceId, amount }));

          if (nonZeroAllocations.length) {
            await allocateMutation.mutateAsync({
              paymentId: payment.id,
              payload: { allocations: nonZeroAllocations.map((item)=> ({invoiceId : item?.invoiceId, amount: item?.amount.toString()})) },
            });
          }

          navigate(`/app/company/${companyId}/customer-payments/${payment.id}`);
        })}
      >
        <div className="space-y-6">
          {createMutation.error ? <Alert title={createMutation.error.message} variant="destructive" /> : null}
          {allocateMutation.error ? <Alert title={allocateMutation.error.message} variant="destructive" /> : null}

          <FormSection title="Payment details">
            <FieldGrid>
              <CounterpartySelect
                error={form.formState.errors.customerId?.message}
                label="Customer"
                onChange={(value) => form.setValue("customerId", value)}
                options={(customersQuery.data ?? []).map((customer) => ({
                  id: customer.id,
                  label: customer.displayName,
                  secondary: customer.customerCode ?? undefined,
                }))}
                placeholder="Select customer"
                value={selectedCustomerId}
              />
              <FormField label="Payment date">
                <Input type="date" {...form.register("paymentDate")} />
              </FormField>
              <FormField label="Payment method" error={form.formState.errors.paymentMethod?.message}>
                <Input {...form.register("paymentMethod")} placeholder="Bank Transfer" />
              </FormField>
              <FormField label="Reference number">
                <Input {...form.register("referenceNumber")} placeholder="Bank reference" />
              </FormField>
              <FormField label="Amount" error={form.formState.errors.amount?.message}>
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
              currencyCode={company?.baseCurrencyCode ?? company?.currencyCode}
              documents={allocationDocuments}
              onAllocationChange={(documentId, amount) =>
                setAllocations((current) => ({ ...current, [documentId]: amount }))
              }
            />
          </FormSection>
        </div>

        <div className="space-y-4">
          <AllocationSummaryCard
            allocations={allocationDocuments
              .filter((document) => (allocations[document.id] ?? 0) > 0)
              .map((document) => ({
                documentId: document.id,
                documentNumber: document.number,
                amountDue: document.amountDue,
                allocatedAmount: allocations[document.id],
              }))}
            currencyCode={company?.baseCurrencyCode ?? company?.currencyCode}
            title="Allocation preview"
            totalAmount={Number(form.watch("amount") || 0)}
            unappliedAmount={unappliedPreview}
          />
          <div className="surface p-5">
            <p className="text-sm text-muted-foreground">Amount preview</p>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrency(Number(form.watch("amount") || 0), company?.baseCurrencyCode ?? company?.currencyCode ?? "USD")}
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
