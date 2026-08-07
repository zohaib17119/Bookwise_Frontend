import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { AllocationSummaryCard } from "@/components/documents/allocation-summary-card";
import { DocumentActionBar } from "@/components/documents/document-action-bar";
import { DocumentHeaderCard } from "@/components/documents/document-header-card";
import { DocumentMetaSection } from "@/components/documents/document-meta-section";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useCustomerPayment } from "@/features/customerPayments/hooks/use-customer-payments";
import type { CustomerPaymentAllocation } from "@/features/customerPayments/types/customer-payment.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { parseMoney, toMoneyString } from "@/lib/utils/money";

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
  const canView = canViewEntity(permissions, "customer_payments");

  if (!canView) {
    return <ErrorState title="Customer payment access restricted" description="Your current company membership does not include customer payment access." />;
  }

  if (paymentQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading payment...</div></PageContainer>;
  }

  if (paymentQuery.error || !paymentQuery.data) {
    return <ErrorState title="Customer payment not found" description={paymentQuery.error?.message ?? "The requested payment is unavailable."} />;
  }

  const payment = paymentQuery.data;
  const currency = payment.currencyCode ?? "USD";
  const hasUnapplied = parseMoney(payment.unappliedAmount) > 0;

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        description="Review the payment receipt and how it was allocated across invoices."
        number={payment.referenceNumber || payment.id}
        status={hasUnapplied ? "PARTIALLY_PAID" : "PAID"}
        title="Customer payment details"
      />

      <DocumentActionBar
        actions={<Button asChild variant="ghost"><Link to={`/app/company/${companyId}/customer-payments`}>Back to payments</Link></Button>}
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
    </PageContainer>
  );
}
