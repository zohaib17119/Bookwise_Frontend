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
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatDate } from "@/lib/utils/format";

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

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        description="Review the payment receipt and how it was allocated across invoices."
        number={payment.referenceNumber || payment.id}
        status={payment.unappliedAmount ? "PARTIALLY_PAID" : "PAID"}
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
              { label: "Amount", value: String(payment.amount) },
              { label: "Unapplied amount", value: String(payment.unappliedAmount ?? 0) },
              { label: "Notes", value: payment.notes || "-" },
            ]}
            title="Amounts"
          />
        </div>

        <AllocationSummaryCard
          allocations={payment.allocations ?? []}
          currencyCode={payment.currencyCode}
          title="Allocation summary"
          totalAmount={payment.amount}
          unappliedAmount={payment.unappliedAmount}
        />
      </div>
    </PageContainer>
  );
}
