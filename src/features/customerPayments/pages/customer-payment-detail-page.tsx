import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { AllocationEditor } from "@/components/documents/allocation-editor";
import { AllocationSummaryCard } from "@/components/documents/allocation-summary-card";
import { DocumentActionBar } from "@/components/documents/document-action-bar";
import { DocumentHeaderCard } from "@/components/documents/document-header-card";
import { DocumentMetaSection } from "@/components/documents/document-meta-section";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useAllocateCustomerPayment,
  useCustomerPayment,
  useUpdateCustomerPayment,
} from "@/features/customerPayments/hooks/use-customer-payments";
import type { CustomerPaymentAllocation } from "@/features/customerPayments/types/customer-payment.types";
import { useOpenInvoicesByCustomer } from "@/features/invoices/hooks/use-invoices";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { getAllocatedTotal } from "@/features/shared/utils/document-calculations";
import { toMoneyDecimalString } from "@/features/shared/utils/decimal-string";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { parseMoney, toMoneyString, validateAllocations } from "@/lib/utils/money";

function mapAllocationRow(allocation: CustomerPaymentAllocation) {
  const invoice = allocation.invoice;
  return {
    documentId: allocation.documentId || allocation.invoiceId || allocation.id || "",
    documentNumber:
      allocation.documentNumber ||
      invoice?.invoiceNumber ||
      allocation.invoiceId ||
      "Invoice",
    amountDue: toMoneyString(allocation.amountDue ?? invoice?.amountDue ?? "0"),
    allocatedAmount: toMoneyString(allocation.allocatedAmount ?? allocation.amount ?? "0"),
  };
}

export function CustomerPaymentDetailPage() {
  const { paymentId, companyId } = useParams();
  const { permissions } = useActiveCompany();
  const paymentQuery = useCustomerPayment(companyId, paymentId ?? null);
  const allocateMutation = useAllocateCustomerPayment(companyId);
  const updateMutation = useUpdateCustomerPayment(companyId);
  const canView = canViewEntity(permissions, "customer_payments");
  const canManage = canManageEntity(permissions, "customer_payments");
  const [applyAllocations, setApplyAllocations] = useState<Record<string, number>>({});
  const [applyError, setApplyError] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const payment = paymentQuery.data;
  const openInvoicesQuery = useOpenInvoicesByCustomer(companyId, payment?.customerId);

  const allocatedTotal = useMemo(
    () =>
      (payment?.allocations ?? []).reduce(
        (sum, row) => sum + parseMoney((row as CustomerPaymentAllocation).amount ?? 0),
        0,
      ),
    [payment?.allocations],
  );

  const applyDocuments = useMemo(
    () =>
      (openInvoicesQuery.data ?? []).map((invoice) => {
        const total = invoice.total ?? invoice.totals?.total ?? "0";
        const whtAmount = invoice.whtAmount ?? invoice.totals?.whtAmount ?? "0";
        const net =
          invoice.netSettlementAmount ??
          invoice.totals?.netSettlementAmount ??
          total;
        const amountPaid = parseMoney(invoice.amountPaid);
        const cashDue = invoice.whtEnabled
          ? Math.max(parseMoney(net) - amountPaid, 0)
          : parseMoney(invoice.amountDue);
        return {
          id: invoice.id,
          number: invoice.invoiceNumber || "Invoice",
          documentDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          amountDue: toMoneyString(cashDue),
          total,
          whtEnabled: Boolean(invoice.whtEnabled),
          whtAmount,
          whtRate: invoice.whtRate,
          whtType: invoice.whtType,
          netSettlementAmount: net,
        };
      }),
    [openInvoicesQuery.data],
  );

  const applyAllocatedTotal = getAllocatedTotal(
    Object.entries(applyAllocations).map(([documentId, allocatedAmount]) => ({
      documentId,
      allocatedAmount,
    })),
  );

  if (!canView) {
    return (
      <ErrorState
        title="Customer payment access restricted"
        description="Your current company membership does not include customer payment access."
      />
    );
  }

  if (paymentQuery.isLoading) {
    return (
      <PageContainer>
        <div className="surface p-6">Loading payment...</div>
      </PageContainer>
    );
  }

  if (paymentQuery.error || !payment) {
    return (
      <ErrorState
        title="Customer payment not found"
        description={paymentQuery.error?.message ?? "The requested payment is unavailable."}
      />
    );
  }

  const currency = payment.currencyCode ?? "USD";
  const unapplied = parseMoney(payment.unappliedAmount);
  const hasUnapplied = unapplied > 0;
  const amountValue = editAmount ?? toMoneyString(payment.amount);

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        description="Review the payment receipt and how it was allocated across invoices."
        number={payment.referenceNumber || payment.id}
        status={hasUnapplied ? "PARTIALLY_PAID" : "PAID"}
        title="Customer payment details"
      />

      <DocumentActionBar
        actions={
          <Button asChild variant="ghost">
            <Link to={`/app/company/${companyId}/customer-payments`}>Back to payments</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentMetaSection
            items={[
              { label: "Customer", value: payment.customerName || "-" },
              { label: "Payment date", value: formatDate(payment.paymentDate) },
              { label: "Payment method", value: payment.paymentMethod },
              { label: "Reference", value: payment.referenceNumber || "-" },
            ]}
            title="Payment summary"
          />
          <DocumentMetaSection
            items={[
              { label: "Amount", value: formatCurrency(payment.amount ?? "0", currency) },
              {
                label: "Unapplied amount",
                value: formatCurrency(payment.unappliedAmount ?? "0", currency),
              },
              { label: "Notes", value: payment.notes || "-" },
            ]}
            title="Amounts"
          />
        </div>

        <AllocationSummaryCard
          allocations={(payment.allocations ?? []).map((allocation) =>
            mapAllocationRow(allocation as CustomerPaymentAllocation),
          )}
          currencyCode={currency}
          title="Allocation summary"
          totalAmount={toMoneyString(payment.amount)}
          unappliedAmount={toMoneyString(payment.unappliedAmount ?? 0)}
        />
      </div>

      {canManage ? (
        <div className="surface space-y-6 p-6">
          {hasUnapplied ? (
            <div>
              <h3 className="text-sm font-semibold">Apply unapplied amount</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Allocate the remaining {formatCurrency(unapplied, currency)} to open invoices for
                this customer.
              </p>
              <div className="mt-4">
                <AllocationEditor
                  allocations={applyAllocations}
                  currencyCode={currency}
                  documents={applyDocuments}
                  settlementLabel="Receivable"
                  onAllocationChange={(documentId, amount) => {
                    setApplyError(null);
                    setApplyAllocations((current) => ({ ...current, [documentId]: amount }));
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Applying {formatCurrency(applyAllocatedTotal, currency)} · leftover{" "}
                  {formatCurrency(unapplied - applyAllocatedTotal, currency)}
                </p>
                <Button
                  disabled={allocateMutation.isPending || applyAllocatedTotal <= 0}
                  isLoading={allocateMutation.isPending}
                  onClick={async () => {
                    const validationErrors = validateAllocations({
                      paymentAmount: unapplied,
                      allocations: applyAllocations,
                      documents: applyDocuments,
                    });
                    if (validationErrors.length) {
                      setApplyError(validationErrors[0]);
                      return;
                    }
                    const nonZero = Object.entries(applyAllocations)
                      .filter(([, amount]) => parseMoney(amount) > 0)
                      .map(([invoiceId, amount]) => ({
                        invoiceId,
                        amount: toMoneyDecimalString(amount),
                      }));
                    if (!nonZero.length) {
                      setApplyError("Enter at least one allocation amount");
                      return;
                    }
                    setApplyError(null);
                    await allocateMutation.mutateAsync({
                      paymentId: payment.id,
                      payload: { allocations: nonZero },
                    });
                    setApplyAllocations({});
                  }}
                  type="button"
                >
                  Apply to invoices
                </Button>
              </div>
              {applyError ? <p className="mt-2 text-sm text-destructive">{applyError}</p> : null}
              {allocateMutation.error ? (
                <p className="mt-2 text-sm text-destructive">{allocateMutation.error.message}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold">Reduce payment amount</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Lower the payment down to the allocated total (
              {formatCurrency(allocatedTotal, currency)}) or to zero when nothing is allocated
              (e.g. duplicate payment mistake). A reversing bank slice is posted for the reduction.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[160px]">
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="payment-amount">
                  New amount
                </label>
                <Input
                  id="payment-amount"
                  onChange={(event) => {
                    setEditAmount(event.target.value);
                    setAmountError(null);
                  }}
                  value={amountValue}
                />
              </div>
              <Button
                disabled={updateMutation.isPending}
                isLoading={updateMutation.isPending}
                onClick={async () => {
                  const next = parseMoney(amountValue);
                  if (next < 0 || (next === 0 && allocatedTotal > 0)) {
                    setAmountError(
                      allocatedTotal > 0
                        ? "Unallocate all invoices before zeroing this payment"
                        : "Amount cannot be negative",
                    );
                    return;
                  }
                  if (next > parseMoney(payment.amount)) {
                    setAmountError("Amount can only be reduced");
                    return;
                  }
                  if (next < allocatedTotal) {
                    setAmountError(
                      `Cannot go below allocated total (${formatCurrency(allocatedTotal, currency)})`,
                    );
                    return;
                  }
                  await updateMutation.mutateAsync({
                    paymentId: payment.id,
                    amount: toMoneyString(next),
                  });
                  setEditAmount(null);
                  setAmountError(null);
                }}
                type="button"
                variant="secondary"
              >
                Save amount
              </Button>
            </div>
            {amountError ? <p className="mt-2 text-sm text-destructive">{amountError}</p> : null}
            {updateMutation.error ? (
              <p className="mt-2 text-sm text-destructive">{updateMutation.error.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
