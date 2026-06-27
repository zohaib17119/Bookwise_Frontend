import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AllocationEditor } from "@/components/documents/allocation-editor";
import { AllocationSummaryCard } from "@/components/documents/allocation-summary-card";
import { CounterpartySelect } from "@/components/documents/counterparty-select";
import { FieldGrid } from "@/components/shared/field-grid";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useAllocateBillPayment,
  useCreateBillPayment,
} from "@/features/billPayments/hooks/use-bill-payments";
import {
  billPaymentSchema,
  type BillPaymentFormInput,
  type BillPaymentFormValues,
} from "@/features/billPayments/schemas/bill-payment.schema";
import { useOpenBillsByVendor } from "@/features/bills/hooks/use-bills";
import { canManageEntity } from "@/features/permissions/utils/module-permissions";
import { getAllocatedTotal } from "@/features/shared/utils/document-calculations";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import { formatCurrency } from "@/lib/utils/format";

export function BillPaymentFormPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();
  const presetVendorId = searchParams.get("vendorId") ?? "";
  const { company, permissions } = useActiveCompany();
  const vendorsQuery = useVendorOptions(companyId);
  const createMutation = useCreateBillPayment(companyId);
  const allocateMutation = useAllocateBillPayment(companyId);
  const canManage = canManageEntity(permissions, "bill_payments");
  const form = useForm<BillPaymentFormInput, undefined, BillPaymentFormValues>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: {
      vendorId: presetVendorId,
      paymentDate: "",
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      amount: undefined,
      notes: "",
    },
  });
  const selectedVendorId = form.watch("vendorId");
  const openBillsQuery = useOpenBillsByVendor(companyId, selectedVendorId || undefined);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const allocationDocuments = useMemo(
    () =>
      (openBillsQuery.data ?? [])
        .filter((bill) => (bill.amountDue ?? 0) > 0)
        .map((bill) => ({
          id: bill.id,
          number: bill.billNumber || "Bill",
          documentDate: bill.issueDate,
          dueDate: bill.dueDate,
          amountDue: bill.amountDue ?? 0,
        })),
    [openBillsQuery.data],
  );
  const allocatedTotal = getAllocatedTotal(
    Object.entries(allocations).map(([documentId, allocatedAmount]) => ({
      documentId,
      allocatedAmount,
    })),
  );
  const unappliedPreview = Number(form.watch("amount") || 0) - allocatedTotal;

  if (!canManage) {
    return <Alert title="Bill payments are unavailable" description="Your current company membership does not include bill payment management." variant="destructive" />;
  }

  return (
    <PageContainer
      header={
        <PageHeader
          actions={<Button asChild variant="ghost"><Link to={`/app/company/${companyId}/bill-payments`}>Back to bill payments</Link></Button>}
          description="Record a vendor payment and optionally allocate it across open bills."
          eyebrow="Payables"
          title="Record bill payment"
        />
      }
    >
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={form.handleSubmit(async (values) => {
          const payment = await createMutation.mutateAsync({
            vendorId: values.vendorId,
            paymentDate: values.paymentDate || undefined,
            paymentMethod: values.paymentMethod,
            referenceNumber: values.referenceNumber || undefined,
            amount: Number(values.amount),
            notes: values.notes || undefined,
          });

          const nonZeroAllocations = Object.entries(allocations)
            .filter(([, amount]) => amount > 0)
            .map(([billId, amount]) => ({ billId, amount }));

          if (nonZeroAllocations.length) {
            await allocateMutation.mutateAsync({
              paymentId: payment.id,
              payload: { allocations: nonZeroAllocations },
            });
          }

          navigate(`/app/company/${companyId}/bill-payments/${payment.id}`);
        })}
      >
        <div className="space-y-6">
          {createMutation.error ? <Alert title={createMutation.error.message} variant="destructive" /> : null}
          {allocateMutation.error ? <Alert title={allocateMutation.error.message} variant="destructive" /> : null}

          <FormSection title="Payment details">
            <FieldGrid>
              <CounterpartySelect
                error={form.formState.errors.vendorId?.message}
                label="Vendor"
                onChange={(value) => form.setValue("vendorId", value)}
                options={(vendorsQuery.data ?? []).map((vendor) => ({
                  id: vendor.id,
                  label: vendor.displayName,
                  secondary: vendor.vendorCode ?? undefined,
                }))}
                placeholder="Select vendor"
                value={selectedVendorId}
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

          <FormSection title="Bill allocation">
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
          <Button className="w-full" isLoading={createMutation.isPending || allocateMutation.isPending} type="submit">
            Record bill payment
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
