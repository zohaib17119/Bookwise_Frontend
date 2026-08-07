import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { AllocationSummaryCard } from "@/components/documents/allocation-summary-card";
import { DocumentActionBar } from "@/components/documents/document-action-bar";
import { DocumentHeaderCard } from "@/components/documents/document-header-card";
import { DocumentMetaSection } from "@/components/documents/document-meta-section";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useBillPayment } from "@/features/billPayments/hooks/use-bill-payments";
import type { BillPaymentAllocation } from "@/features/billPayments/types/bill-payment.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { parseMoney, toMoneyString } from "@/lib/utils/money";

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
  const canView = canViewEntity(permissions, "bill_payments");

  if (!canView) {
    return <ErrorState title="Bill payment access restricted" description="Your current company membership does not include bill payment access." />;
  }

  if (paymentQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading payment...</div></PageContainer>;
  }

  if (paymentQuery.error || !paymentQuery.data) {
    return <ErrorState title="Bill payment not found" description={paymentQuery.error?.message ?? "The requested payment is unavailable."} />;
  }

  const payment = paymentQuery.data;
  const currency = payment.currencyCode ?? "USD";
  const hasUnapplied = parseMoney(payment.unappliedAmount) > 0;

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        description="Review the outgoing vendor payment and bill allocation summary."
        number={payment.referenceNumber || payment.id}
        status={hasUnapplied ? "PARTIALLY_PAID" : "PAID"}
        title="Bill payment details"
      />

      <DocumentActionBar
        actions={<Button asChild variant="ghost"><Link to={`/app/company/${companyId}/bill-payments`}>Back to bill payments</Link></Button>}
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
            mapAllocationRow(allocation as BillPaymentAllocation),
          )}
          currencyCode={currency}
          title="Allocation summary"
          totalAmount={toMoneyString(payment.amount)}
          unappliedAmount={toMoneyString(payment.unappliedAmount ?? 0)}
        />
      </div>
    </PageContainer>
  );
}
