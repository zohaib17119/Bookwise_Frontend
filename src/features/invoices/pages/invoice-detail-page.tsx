import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { useDeleteInvoice, useInvoice, useSendInvoice } from "@/features/invoices/hooks/use-invoices";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatDate } from "@/lib/utils/format";
import InvoiceView from "./InvoiceView";

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { invoiceId, companyId } = useParams();
  const { permissions } = useActiveCompany();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const invoiceQuery = useInvoice(companyId, invoiceId ?? null);
  const deleteMutation = useDeleteInvoice(companyId);
  const sendMutation = useSendInvoice(companyId);
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");

  if (!canView) {
    return <ErrorState title="Invoice access restricted" description="Your current company membership does not include invoice access." />;
  }

  if (invoiceQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading invoice...</div></PageContainer>;
  }

  if (invoiceQuery.error || !invoiceQuery.data) {
    return <ErrorState title="Invoice not found" description={invoiceQuery.error?.message ?? "The requested invoice is unavailable."} />;
  }

  const invoice = invoiceQuery.data;


  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-3">
              {invoice &&<InvoiceView invoice={invoice}  /> }
              {invoice.status === "DRAFT" ? (
                <Button onClick={() => setSendOpen(true)} variant="primary">Send invoice</Button>
              ) : null}
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/invoices/${invoice.id}/edit`}>Edit invoice</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/customer-payments/new?customerId=${invoice.customerId}`}>Receive payment</Link>
              </Button>
              <Button onClick={() => setDeleteOpen(true)} variant="ghost">Delete</Button>
            </div>
          ) : null
        }
        description="Review invoice details, receivables position, and line items."
        number={invoice.invoiceNumber}
        status={invoice.status}
        title="Invoice details"
      />

      <DocumentActionBar
        actions={
          <Button asChild variant="ghost">
            <Link to={`/app/company/${companyId}/invoices`}>Back to invoices</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <DocumentDetailsSection title="Document overview">
            <div className="grid gap-4 md:grid-cols-2">
              <DocumentMetaSection
                items={[
                  { label: "Customer", value: invoice.customerName || "-" },
                  { label: "Reference", value: invoice.referenceNumber || "-" },
                  { label: "Issue date", value: formatDate(invoice.issueDate) },
                  { label: "Due date", value: formatDate(invoice.dueDate) },
                ]}
                title="Header"
              />
              <DocumentMetaSection
                items={[
                  { label: "Estimate", value: invoice.estimateId || "-" },
                  { label: "Currency", value: invoice.currencyCode || "USD" },
                  { label: "Terms", value: invoice.terms || "-" },
                ]}
                title="Commercials"
              />
            </div>
          </DocumentDetailsSection>

          <DocumentDetailsSection title="Line items">
            <DocumentLinesTable currencyCode={invoice.currencyCode} lines={invoice.lines} mode="sales" />
          </DocumentDetailsSection>
        </div>

        <div className="space-y-4">
          <DocumentTotalsCard
            currencyCode={invoice.currencyCode}
            discountTotal={invoice.totals?.discountTotal}
            subtotal={invoice.totals?.subtotal}
            taxTotal={invoice.totals?.taxTotal}
            total={invoice.totals?.total}
          />
          <AmountSummaryCard amount={invoice.amountPaid} currencyCode={invoice.currencyCode} label="Amount paid" />
          <AmountSummaryCard amount={invoice.amountDue} currencyCode={invoice.currencyCode} label="Amount due" />
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Send invoice"
        description="This finalizes the invoice: it posts revenue to your ledger, marks it as Issued, and emails the customer. This cannot be undone."
        isPending={sendMutation.isPending}
        onClose={() => {
          setSendOpen(false);
          sendMutation.reset();
        }}
        onConfirm={async () => {
          await sendMutation.mutateAsync(invoice.id);
          setSendOpen(false);
        }}
        open={sendOpen}
        title="Send this invoice?"
      />

      <ConfirmDeleteDialog
        description="This will remove the invoice from active workflows while preserving backend audit visibility."
        isPending={deleteMutation.isPending}
        onClose={() => {
          setDeleteOpen(false);
          deleteMutation.reset();
        }}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(invoice.id);
          navigate(`/app/company/${companyId}/invoices`);
        }}
        open={deleteOpen}
        title="Delete invoice?"
      />
    </PageContainer>
  );
}
