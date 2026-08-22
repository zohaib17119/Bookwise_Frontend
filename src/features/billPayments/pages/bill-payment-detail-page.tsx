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
import {
  useAllocateBillPayment,
  useBillPayment,
  useUnallocateBillPayment,
  useUpdateBillPayment,
} from "@/features/billPayments/hooks/use-bill-payments";
import type { BillPaymentAllocation } from "@/features/billPayments/types/bill-payment.types";
import { useOpenBillsByVendor } from "@/features/bills/hooks/use-bills";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { getAllocatedTotal } from "@/features/shared/utils/document-calculations";
import { toMoneyDecimalString } from "@/features/shared/utils/decimal-string";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { parseMoney, toMoneyString, validateAllocations } from "@/lib/utils/money";

function mapAllocationRow(allocation: BillPaymentAllocation) {
  const bill = allocation.bill;
  return {
    documentId: allocation.documentId || allocation.billId || allocation.id || "",
    documentNumber:
      allocation.documentNumber || bill?.billNumber || allocation.billId || "Bill",
    amountDue: toMoneyString(allocation.amountDue ?? bill?.amountDue ?? "0"),
    allocatedAmount: toMoneyString(allocation.allocatedAmount ?? allocation.amount ?? "0"),
  };
}

export function BillPaymentDetailPage() {
  const { paymentId, companyId } = useParams();
  const { permissions } = useActiveCompany();
  const paymentQuery = useBillPayment(companyId, paymentId ?? null);
  const unallocateMutation = useUnallocateBillPayment(companyId);
  const updateMutation = useUpdateBillPayment(companyId);
  const allocateMutation = useAllocateBillPayment(companyId);
  const canView = canViewEntity(permissions, "bill_payments");
  const canManage = canManageEntity(permissions, "bill_payments");
  const [editAmount, setEditAmount] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [applyAllocations, setApplyAllocations] = useState<Record<string, number>>({});
  const [applyError, setApplyError] = useState<string | null>(null);

  const payment = paymentQuery.data;
  const openBillsQuery = useOpenBillsByVendor(companyId, payment?.vendorId);

  const allocatedTotal = useMemo(
    () =>
      (payment?.allocations ?? []).reduce(
        (sum, row) => sum + parseMoney((row as BillPaymentAllocation).amount ?? 0),
        0,
      ),
    [payment?.allocations],
  );

  const applyDocuments = useMemo(
    () =>
      (openBillsQuery.data ?? []).map((bill) => {
        const total = bill.total ?? bill.totals?.total ?? "0";
        const whtAmount = bill.whtAmount ?? bill.totals?.whtAmount ?? "0";
        const net = bill.netSettlementAmount ?? bill.totals?.netSettlementAmount ?? total;
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

  const applyAllocatedTotal = getAllocatedTotal(
    Object.entries(applyAllocations).map(([documentId, allocatedAmount]) => ({
      documentId,
      allocatedAmount,
    })),
  );

  if (!canView) {
    return (
      <ErrorState
        title="Bill payment access restricted"
        description="Your current company membership does not include bill payment access."
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
        title="Bill payment not found"
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
        description="Review the outgoing vendor payment and bill allocation summary."
        number={payment.referenceNumber || payment.id}
        status={hasUnapplied ? "PARTIALLY_PAID" : "PAID"}
        title="Bill payment details"
      />

      <DocumentActionBar
        actions={
          <Button asChild variant="ghost">
            <Link to={`/app/company/${companyId}/bill-payments`}>Back to bill payments</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentMetaSection
            items={[
              { label: "Vendor", value: payment.vendorName || "-" },
              { label: "Payment date", value: formatDate(payment.paymentDate) },
              { label: "Payment method", value: payment.paymentMethod },
              { label: "Reference", value: payment.referenceNumber || "-" },
            ]}
            title="Payment summary"
          />
          <DocumentMetaSection
            items={[
              {
                label: "Amount",
                value: formatCurrency(payment.amount ?? "0", currency),
              },
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
            mapAllocationRow(allocation as BillPaymentAllocation),
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
                Allocate the remaining {formatCurrency(unapplied, currency)} to open bills for this
                vendor.
              </p>
              <div className="mt-4">
                <AllocationEditor
                  allocations={applyAllocations}
                  currencyCode={currency}
                  documents={applyDocuments}
                  settlementLabel="Payable"
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
                      .map(([billId, amount]) => ({
                        billId,
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
                  Apply to bills
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
                        ? "Unallocate all bills before zeroing this payment"
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

          <div>
            <h3 className="text-sm font-semibold">Unallocate a bill</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Removes this payment’s allocation from one bill and restores unapplied cash. Other
              bills stay allocated.
            </p>
            <div className="mt-3 space-y-2">
              {(payment.allocations ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No allocations on this payment.</p>
              ) : (
                (payment.allocations ?? []).map((raw) => {
                  const allocation = raw as BillPaymentAllocation;
                  const billId = allocation.billId || allocation.bill?.id || allocation.documentId;
                  if (!billId) return null;
                  return (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                      key={allocation.id ?? billId}
                    >
                      <div>
                        <p className="font-medium">
                          {allocation.bill?.billNumber ||
                            allocation.documentNumber ||
                            billId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Allocated {formatCurrency(allocation.amount ?? 0, currency)}
                        </p>
                      </div>
                      <Button
                        disabled={unallocateMutation.isPending}
                        onClick={() =>
                          void unallocateMutation.mutateAsync({
                            paymentId: payment.id,
                            billId,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Unallocate
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
            {unallocateMutation.error ? (
              <p className="mt-2 text-sm text-destructive">{unallocateMutation.error.message}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
