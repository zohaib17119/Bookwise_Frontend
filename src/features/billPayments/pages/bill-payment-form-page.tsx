import { useEffect, useMemo, useRef, useState } from "react";
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
import { toMoneyDecimalString } from "@/features/shared/utils/decimal-string";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import { formatCurrency } from "@/lib/utils/format";
import { parseMoney, toMoneyString, validateAllocations } from "@/lib/utils/money";

export function BillPaymentFormPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();
  const presetVendorId = searchParams.get("vendorId") ?? "";
  const presetBillId = searchParams.get("billId") ?? "";
  const { company, permissions } = useActiveCompany();
  const vendorsQuery = useVendorOptions(companyId);
  const createMutation = useCreateBillPayment(companyId);
  const allocateMutation = useAllocateBillPayment(companyId);
  const canManage = canManageEntity(permissions, "bill_payments");
  const currencyCode = company?.baseCurrencyCode ?? company?.currencyCode ?? "USD";
  const form = useForm<BillPaymentFormInput, undefined, BillPaymentFormValues>({
    resolver: zodResolver(billPaymentSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      vendorId: presetVendorId,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      amount: "",
      notes: "",
    },
  });
  const selectedVendorId = form.watch("vendorId");
  const watchedAmount = form.watch("amount");
  const formErrors = form.formState.errors;
  const hasFormErrors = Object.keys(formErrors).length > 0 && form.formState.isSubmitted;
  const openBillsQuery = useOpenBillsByVendor(companyId, selectedVendorId || undefined);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const previousVendorIdRef = useRef(selectedVendorId);
  const preAllocatedBillIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (presetVendorId) {
      form.setValue("vendorId", presetVendorId);
    }
  }, [form, presetVendorId]);

  useEffect(() => {
    if (previousVendorIdRef.current === selectedVendorId) {
      return;
    }
    previousVendorIdRef.current = selectedVendorId;
    setAllocations({});
    setAllocationError(null);
    preAllocatedBillIdRef.current = null;
  }, [selectedVendorId]);

  const allocationDocuments = useMemo(
    () =>
      (openBillsQuery.data ?? []).map((bill) => {
        const total = bill.total ?? bill.totals?.total ?? "0";
        const whtAmount = bill.whtAmount ?? bill.totals?.whtAmount ?? "0";
        const net =
          bill.netSettlementAmount ?? bill.totals?.netSettlementAmount ?? total;
        const amountPaid = parseMoney(bill.amountPaid);
        const cashDue = bill.whtEnabled
          ? Math.max(parseMoney(net) - amountPaid, 0)
          : parseMoney(bill.amountDue);
        return {
          id: bill.id,
          number: bill.billNumber || "Bill",
          documentDate: bill.issueDate,
          dueDate: bill.dueDate,
          amountDue: toMoneyString(cashDue),
          total,
          whtEnabled: Boolean(bill.whtEnabled),
          whtAmount,
          whtRate: bill.whtRate,
          whtType: bill.whtType,
          netSettlementAmount: net,
        };
      }),
    [openBillsQuery.data],
  );

  useEffect(() => {
    if (!presetBillId || preAllocatedBillIdRef.current === presetBillId) {
      return;
    }
    const target = allocationDocuments.find((document) => document.id === presetBillId);
    const due = parseMoney(target?.amountDue);
    if (!target || due <= 0) {
      return;
    }
    preAllocatedBillIdRef.current = presetBillId;
    setAllocations((current) => ({ ...current, [presetBillId]: Number(toMoneyString(due)) }));
  }, [allocationDocuments, presetBillId]);

  const allocatedTotal = getAllocatedTotal(
    Object.entries(allocations).map(([documentId, allocatedAmount]) => ({
      documentId,
      allocatedAmount,
    })),
  );
  const unappliedPreview = parseMoney(watchedAmount) - allocatedTotal;

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
            vendorId: values.vendorId,
            paymentDate: values.paymentDate,
            paymentMethod: values.paymentMethod,
            referenceNumber: values.referenceNumber || undefined,
            amount: toMoneyDecimalString(values.amount),
            notes: values.notes || undefined,
          });

          const nonZeroAllocations = Object.entries(allocations)
            .filter(([, amount]) => parseMoney(amount) > 0)
            .map(([billId, amount]) => ({
              billId,
              amount: toMoneyDecimalString(amount),
            }));

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
                error={formErrors.vendorId?.message}
                label="Vendor"
                onChange={(value) => form.setValue("vendorId", value, { shouldValidate: true })}
                options={(vendorsQuery.data ?? []).map((vendor) => ({
                  id: vendor.id,
                  label: vendor.displayName,
                  secondary: vendor.vendorCode ?? undefined,
                }))}
                placeholder="Select vendor"
                value={selectedVendorId}
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

          <FormSection title="Bill allocation">
            <AllocationEditor
              allocations={allocations}
              currencyCode={currencyCode}
              documents={allocationDocuments}
              settlementLabel="Payable"
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
          <Button className="w-full" isLoading={createMutation.isPending || allocateMutation.isPending} type="submit">
            Record bill payment
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
