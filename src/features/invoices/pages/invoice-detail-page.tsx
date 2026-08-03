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
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canShowZatca } from "@/features/compliance/utils/compliance-access";
import {
  CreateAdjustmentNoteDialog,
  type AdjustmentNoteType,
} from "@/features/creditNotes/components/create-adjustment-note-dialog";
import { useCreateCreditNote } from "@/features/creditNotes/hooks/use-credit-notes";
import { useCreateDebitNote } from "@/features/debitNotes/hooks/use-debit-notes";
import {
  useDeleteInvoice,
  useInvoice,
  useSendInvoice,
  useSubmitInvoiceCompliance,
} from "@/features/invoices/hooks/use-invoices";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatDate } from "@/lib/utils/format";
import { formatPaymentOptions } from "@/features/invoices/constants/payment-options";
import InvoiceView from "./InvoiceView";

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { invoiceId, companyId } = useParams();
  const { permissions, company } = useActiveCompany();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentNoteType | null>(null);
  const invoiceQuery = useInvoice(companyId, invoiceId ?? null);
  const deleteMutation = useDeleteInvoice(companyId);
  const sendMutation = useSendInvoice(companyId);
  const complianceMutation = useSubmitInvoiceCompliance(companyId);
  const creditNoteMutation = useCreateCreditNote(companyId);
  const debitNoteMutation = useCreateDebitNote(companyId);
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");
  const showZatca = canShowZatca(company);
  const baseCurrency = getCompanyBaseCurrency(company);

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
  const isCreditNote = invoice.documentType === "CREDIT_NOTE";
  const isDebitNote = invoice.documentType === "DEBIT_NOTE";
  const isAdjustmentNote = isCreditNote || isDebitNote;
  const documentCurrency = invoice.currencyCode ?? baseCurrency;
  const complianceStatus = invoice.complianceStatus ?? "NOT_APPLICABLE";
  const canRetryCompliance =
    showZatca &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED" &&
    ["ERROR", "REJECTED"].includes(complianceStatus);
  const showZatcaPending =
    showZatca &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED" &&
    complianceStatus === "PENDING";
  const canCreateAdjustment =
    canManage &&
    !isAdjustmentNote &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED" &&
    invoice.status !== "VOID";

  const documentTitle = isCreditNote
    ? "Credit note details"
    : isDebitNote
      ? "Debit note details"
      : "Invoice details";
  const backPath = isCreditNote
    ? `/app/company/${companyId}/credit-notes`
    : isDebitNote
      ? `/app/company/${companyId}/debit-notes`
      : `/app/company/${companyId}/invoices`;
  const backLabel = isCreditNote
    ? "Back to credit notes"
    : isDebitNote
      ? "Back to debit notes"
      : "Back to invoices";

  const adjustmentPending = creditNoteMutation.isPending || debitNoteMutation.isPending;
  const adjustmentError =
    creditNoteMutation.error?.message ?? debitNoteMutation.error?.message ?? null;

  const sendLabel = isCreditNote
    ? "Send credit note"
    : isDebitNote
      ? "Send debit note"
      : "Send invoice";

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-3">
              {invoice ? <InvoiceView invoice={invoice} /> : null}
              {invoice.status === "DRAFT" ? (
                <Button onClick={() => setSendOpen(true)} variant="primary">
                  {sendLabel}
                </Button>
              ) : null}
              {canCreateAdjustment ? (
                <>
                  <Button onClick={() => setAdjustmentType("CREDIT_NOTE")} variant="secondary">
                    Create credit note
                  </Button>
                  <Button onClick={() => setAdjustmentType("DEBIT_NOTE")} variant="secondary">
                    Create debit note
                  </Button>
                </>
              ) : null}
              {showZatcaPending ? (
                <span className="text-sm text-muted-foreground">
                  ZATCA submission in progress
                </span>
              ) : null}
              {canRetryCompliance ? (
                <Button
                  isLoading={complianceMutation.isPending}
                  onClick={() => void complianceMutation.mutateAsync(invoice.id)}
                  variant="secondary"
                >
                  Retry ZATCA submit
                </Button>
              ) : null}
              {!isAdjustmentNote ? (
                <Button asChild variant="secondary">
                  <Link to={`/app/company/${companyId}/invoices/${invoice.id}/edit`}>Edit invoice</Link>
                </Button>
              ) : null}
              {!isAdjustmentNote ? (
                <Button asChild variant="secondary">
                  <Link to={`/app/company/${companyId}/customer-payments/new?customerId=${invoice.customerId}`}>
                    Receive payment
                  </Link>
                </Button>
              ) : null}
              <Button onClick={() => setDeleteOpen(true)} variant="ghost">Delete</Button>
            </div>
          ) : null
        }
        description={
          isAdjustmentNote
            ? "Review adjustment note details, ZATCA status, and link to the original invoice."
            : "Review invoice details, receivables position, and line items."
        }
        number={invoice.invoiceNumber}
        status={invoice.status}
        title={documentTitle}
      />

      <DocumentActionBar
        actions={
          <Button asChild variant="ghost">
            <Link to={backPath}>{backLabel}</Link>
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
                  ...(isAdjustmentNote
                    ? []
                    : [{ label: "Due date", value: formatDate(invoice.dueDate) }]),
                  ...(invoice.originalInvoice
                    ? [
                        {
                          label: "Original invoice",
                          value: invoice.originalInvoice.invoiceNumber || invoice.originalInvoice.id,
                        },
                      ]
                    : []),
                ]}
                title="Header"
              />
              <DocumentMetaSection
                items={[
                  ...(isCreditNote
                    ? [{ label: "Document type", value: "Credit note" }]
                    : isDebitNote
                      ? [{ label: "Document type", value: "Debit note" }]
                      : [{ label: "Estimate", value: invoice.estimateId || "-" }]),
                  { label: "Currency", value: documentCurrency },
                  { label: "Terms", value: invoice.terms || "-" },
                  ...(showZatca
                    ? [
                        {
                          label: "ZATCA compliance",
                          value: complianceStatus.replace(/_/g, " "),
                        },
                        ...(invoice.complianceUuid
                          ? [{ label: "Compliance UUID", value: invoice.complianceUuid }]
                          : []),
                        ...(invoice.complianceLastError &&
                        ["ERROR", "REJECTED"].includes(complianceStatus)
                          ? [{ label: "ZATCA last error", value: invoice.complianceLastError }]
                          : []),
                      ]
                    : []),
                  ...(invoice.paymentOptions?.length
                    ? [{
                        label: "Accepted payment methods",
                        value: formatPaymentOptions(invoice.paymentOptions),
                      }]
                    : []),
                ]}
                title="Commercials"
              />
            </div>
            {invoice.originalInvoice ? (
              <p className="text-sm text-muted-foreground">
                Linked to original invoice{" "}
                <Link
                  className="text-primary underline"
                  to={`/app/company/${companyId}/invoices/${invoice.originalInvoice.id}`}
                >
                  {invoice.originalInvoice.invoiceNumber || "Open"}
                </Link>
              </p>
            ) : null}
            {invoice.notes || invoice.memoOnStatement ? (
              <DocumentMetaSection
                items={[
                  ...(invoice.notes
                    ? [{ label: isAdjustmentNote ? "Reason" : "Note to customer", value: invoice.notes }]
                    : []),
                  ...(invoice.memoOnStatement
                    ? [{ label: "Memo on statement", value: invoice.memoOnStatement }]
                    : []),
                ]}
                title="Notes"
              />
            ) : null}
          </DocumentDetailsSection>

          <DocumentDetailsSection title="Line items">
            <DocumentLinesTable currencyCode={documentCurrency} lines={invoice.lines} mode="sales" />
          </DocumentDetailsSection>
        </div>

        <div className="space-y-4">
          <DocumentTotalsCard
            currencyCode={documentCurrency}
            discountTotal={invoice.totals?.discountTotal}
            subtotal={invoice.totals?.subtotal}
            taxTotal={invoice.totals?.taxTotal}
            total={invoice.totals?.total}
          />
          <AmountSummaryCard amount={invoice.amountPaid} currencyCode={documentCurrency} label="Amount paid" />
          <AmountSummaryCard amount={invoice.amountDue} currencyCode={documentCurrency} label="Amount due" />
        </div>
      </div>

      <ConfirmDialog
        confirmLabel={sendLabel}
        description={
          isCreditNote
            ? "This finalizes the credit note: it posts the AR credit to your ledger and queues ZATCA in the background when enabled (email does not wait for clearance)."
            : isDebitNote
              ? "This finalizes the debit note: it posts the AR debit to your ledger and queues ZATCA in the background when enabled."
              : showZatca
                ? "This finalizes the invoice: it posts revenue, marks it Issued, emails the customer, and queues ZATCA in the background. Email does not wait for ZATCA clearance."
                : "This finalizes the invoice: it posts revenue to your ledger, marks it as Issued, and emails the customer. This cannot be undone."
        }
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
        title={
          isCreditNote
            ? "Send this credit note?"
            : isDebitNote
              ? "Send this debit note?"
              : "Send this invoice?"
        }
      />

      {companyId ? (
        <CreateAdjustmentNoteDialog
          baseCurrency={baseCurrency}
          companyId={companyId}
          errorMessage={adjustmentError}
          fixedType={adjustmentType ?? "CREDIT_NOTE"}
          isPending={adjustmentPending}
          onClose={() => {
            setAdjustmentType(null);
            creditNoteMutation.reset();
            debitNoteMutation.reset();
          }}
          onConfirm={async ({ noteType, originalInvoiceId, notes, lines }) => {
            const mutate =
              noteType === "DEBIT_NOTE"
                ? debitNoteMutation.mutateAsync
                : creditNoteMutation.mutateAsync;
            const note = await mutate({
              originalInvoiceId,
              notes,
              lines,
              sendImmediately: true,
            });
            setAdjustmentType(null);
            const noteId = (note as { id?: string })?.id;
            if (noteId) {
              navigate(`/app/company/${companyId}/invoices/${noteId}`);
            }
          }}
          open={Boolean(adjustmentType)}
          presetInvoiceId={invoice.id}
        />
      ) : null}

      <ConfirmDeleteDialog
        description="This will remove the document from active workflows while preserving backend audit visibility."
        isPending={deleteMutation.isPending}
        onClose={() => {
          setDeleteOpen(false);
          deleteMutation.reset();
        }}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(invoice.id);
          navigate(backPath);
        }}
        open={deleteOpen}
        title={
          isCreditNote
            ? "Delete credit note?"
            : isDebitNote
              ? "Delete debit note?"
              : "Delete invoice?"
        }
      />
    </PageContainer>
  );
}
