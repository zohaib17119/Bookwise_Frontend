import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { AmountSummaryCard } from "@/components/documents/amount-summary-card";
import { DocumentActionBar } from "@/components/documents/document-action-bar";
import { DocumentDetailsSection } from "@/components/documents/document-details-section";
import { DocumentHeaderCard } from "@/components/documents/document-header-card";
import { DocumentLinesTable } from "@/components/documents/document-lines-table";
import { DocumentMetaSection } from "@/components/documents/document-meta-section";
import { DocumentTotalsCard } from "@/components/documents/document-totals-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useBill, useDeleteBill } from "@/features/bills/hooks/use-bills";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatDate } from "@/lib/utils/format";

export function BillDetailPage() {
  const navigate = useNavigate();
  const { billId, companyId } = useParams();
  const { permissions } = useActiveCompany();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const billQuery = useBill(companyId, billId ?? null);
  const deleteMutation = useDeleteBill(companyId);
  const canView = canViewEntity(permissions, "bills");
  const canManage = canManageEntity(permissions, "bills");

  if (!canView) {
    return <ErrorState title="Bill access restricted" description="Your current company membership does not include bill access." />;
  }

  if (billQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading bill...</div></PageContainer>;
  }

  if (billQuery.error || !billQuery.data) {
    return <ErrorState title="Bill not found" description={billQuery.error?.message ?? "The requested bill is unavailable."} />;
  }

  const bill = billQuery.data;

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/bills/${bill.id}/edit`}>Edit bill</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/bill-payments/new?vendorId=${bill.vendorId}`}>Record payment</Link>
              </Button>
              <Button onClick={() => setDeleteOpen(true)} variant="ghost">Delete</Button>
            </div>
          ) : null
        }
        description="Review bill details, payable balances, and the underlying line items."
        number={bill.billNumber}
        status={bill.status}
        title="Bill details"
      />

      <DocumentActionBar
        actions={<Button asChild variant="ghost"><Link to={`/app/company/${companyId}/bills`}>Back to bills</Link></Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <DocumentDetailsSection title="Document overview">
            <div className="grid gap-4 md:grid-cols-2">
              <DocumentMetaSection
                items={[
                  { label: "Vendor", value: bill.vendorName || "-" },
                  { label: "Reference", value: bill.referenceNumber || "-" },
                  { label: "Issue date", value: formatDate(bill.issueDate) },
                  { label: "Due date", value: formatDate(bill.dueDate) },
                ]}
                title="Header"
              />
              <DocumentMetaSection
                items={[
                  { label: "Currency", value: bill.currencyCode || "USD" },
                  { label: "Notes", value: bill.notes || "-" },
                ]}
                title="Commercials"
              />
            </div>
          </DocumentDetailsSection>

          <DocumentDetailsSection title="Line items">
            <DocumentLinesTable currencyCode={bill.currencyCode} lines={bill.lines} mode="purchase" />
          </DocumentDetailsSection>
        </div>

        <div className="space-y-4">
          <DocumentTotalsCard
            currencyCode={bill.currencyCode}
            discountTotal={bill.totals?.discountTotal}
            subtotal={bill.totals?.subtotal}
            taxTotal={bill.totals?.taxTotal}
            total={bill.totals?.total}
          />
          <AmountSummaryCard amount={bill.amountPaid} currencyCode={bill.currencyCode} label="Amount paid" />
          <AmountSummaryCard amount={bill.amountDue} currencyCode={bill.currencyCode} label="Amount due" />
        </div>
      </div>

      <ConfirmDeleteDialog
        description="This will remove the bill from active workflows while preserving backend audit visibility."
        isPending={deleteMutation.isPending}
        onClose={() => {
          setDeleteOpen(false);
          deleteMutation.reset();
        }}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(bill.id);
          navigate(`/app/company/${companyId}/bills`);
        }}
        open={deleteOpen}
        title="Delete bill?"
      />
    </PageContainer>
  );
}
