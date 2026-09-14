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
import { canShowFbr, canUseFbrDigitalInvoicing, canUseZatcaReporting } from "@/features/compliance/utils/compliance-access";
import {
  describeFbrDiStatusForUi,
  formatFbrDiStatusLabel,
} from "@/features/compliance/utils/fbr-status";
import {
  CreateAdjustmentNoteDialog,
  type AdjustmentNoteType,
} from "@/features/creditNotes/components/create-adjustment-note-dialog";
import { useCreateCreditNote } from "@/features/creditNotes/hooks/use-credit-notes";
import { useCreateDebitNote } from "@/features/debitNotes/hooks/use-debit-notes";
import {
  useDeleteInvoice,
  useInvoice,
  useMarkInvoiceTaxReported,
  useRetryInvoiceFbrSubmit,
  useSendInvoice,
  useSubmitInvoiceCompliance,
  useSubmitInvoiceFbrSync,
} from "@/features/invoices/hooks/use-invoices";
import { getApiErrorMessage } from "@/lib/api/error";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { whtHeldByHint, whtHeldByLabel, whtNetLabel, whtSettlementAddsToCash } from "@/features/shared/utils/wht-labels";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { formatPaymentOptions } from "@/features/invoices/constants/payment-options";
import InvoiceView from "./InvoiceView";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Alert } from "@/components/ui/alert";

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { invoiceId, companyId } = useParams();
  const { permissions, company } = useActiveCompany();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentNoteType | null>(null);
  const [fbrFlash, setFbrFlash] = useState<{
    tone: "ok" | "err";
    text: string;
    detail?: string | null;
    preview?: string | null;
  } | null>(null);
  const invoiceQuery = useInvoice(companyId, invoiceId ?? null);
  const deleteMutation = useDeleteInvoice(companyId);
  const sendMutation = useSendInvoice(companyId);
  const complianceMutation = useSubmitInvoiceCompliance(companyId);
  const fbrSubmitMutation = useSubmitInvoiceFbrSync(companyId);
  const fbrRetryMutation = useRetryInvoiceFbrSubmit(companyId);
  const markTaxReportedMutation = useMarkInvoiceTaxReported(companyId);
  const creditNoteMutation = useCreateCreditNote(companyId);
  const debitNoteMutation = useCreateDebitNote(companyId);
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");
  const showZatca = canUseZatcaReporting(company);
  const showFbr = canShowFbr(company);
  const useFbrDi = canUseFbrDigitalInvoicing(company);
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
  const fbrStatus = invoice.fbrSubmissionStatus ?? "NOT_APPLICABLE";
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
  const fbrIssued =
    useFbrDi &&
    canManage &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED" &&
    invoice.status !== "VOID";
  const canSendFbr =
    fbrIssued &&
    ["NOT_APPLICABLE", "PENDING", "PROCESSING"].includes(fbrStatus) &&
    !(fbrStatus === "SUBMITTED" && invoice.fbrFbrInvoiceNumber);
  const canRetryFbr =
    fbrIssued && ["FAILED", "REJECTED", "RETRYING"].includes(fbrStatus);
  const fbrBusy = fbrSubmitMutation.isPending || fbrRetryMutation.isPending;
  const canMarkTaxReported =
    showFbr &&
    canManage &&
    !useFbrDi &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED" &&
    complianceStatus === "PENDING";

  const runFbrSync = async (mode: "submit" | "retry") => {
    setFbrFlash(null);
    try {
      const data =
        mode === "submit"
          ? await fbrSubmitMutation.mutateAsync(invoice.id)
          : await fbrRetryMutation.mutateAsync(invoice.id);
      if (data.result.status === "SUBMITTED") {
        setFbrFlash({
          tone: "ok",
          text: data.fbrFbrInvoiceNumber
            ? `FBR accepted. Invoice number: ${data.fbrFbrInvoiceNumber}`
            : "FBR accepted this document.",
        });
      } else {
        const preview = data.gatewayPreview || data.result.gatewayPreview || null;
        setFbrFlash({
          tone: "err",
          text:
            data.fbrLastError ||
            data.result.message ||
            data.guidance?.summary ||
            "FBR did not accept this document.",
          detail: data.guidance?.action ?? null,
          preview,
        });
      }
    } catch (err) {
      setFbrFlash({ tone: "err", text: getApiErrorMessage(err) });
    }
  };
  const canCreateAdjustment =
    canManage &&
    !isAdjustmentNote &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED" &&
    invoice.status !== "VOID";

  const fbrStatusLabel = formatFbrDiStatusLabel(fbrStatus, {
    digitalInvoicingEnabled: useFbrDi,
  });
  const fbrGuidance = describeFbrDiStatusForUi({
    fbrSubmissionStatus: fbrStatus,
    fbrLastError: invoice.fbrLastError,
    fbrLastResponseCode: invoice.fbrLastResponseCode,
    digitalInvoicingEnabled: useFbrDi,
  });

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
              {invoice ? <InvoiceView companyId={companyId} invoice={invoice} /> : null}
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
              {canSendFbr ? (
                <Button
                  isLoading={fbrBusy}
                  onClick={() => void runFbrSync("submit")}
                  type="button"
                  variant="primary"
                >
                  Send to FBR
                </Button>
              ) : null}
              {canRetryFbr ? (
                <Button
                  isLoading={fbrBusy}
                  onClick={() => void runFbrSync("retry")}
                  type="button"
                  variant="secondary"
                >
                  Retry FBR submit
                </Button>
              ) : null}
              {useFbrDi && invoice.status !== "DRAFT" ? (
                <span className="text-sm text-muted-foreground">{fbrStatusLabel}</span>
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
              {canMarkTaxReported ? (
                <Button
                  isLoading={markTaxReportedMutation.isPending}
                  onClick={() => void markTaxReportedMutation.mutateAsync(invoice.id)}
                  variant="secondary"
                >
                  Mark tax reported
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

      {fbrFlash ? (
        <Alert
          description={
            <span className="space-y-2 block">
              <span className="block">{fbrFlash.text}</span>
              {fbrFlash.detail ? (
                <span className="block opacity-90">{fbrFlash.detail}</span>
              ) : null}
              {fbrFlash.preview ? (
                <span className="mt-2 block rounded-md border border-destructive/20 bg-white/60 p-2 font-mono text-xs break-all text-foreground">
                  Gateway body: {fbrFlash.preview}
                </span>
              ) : null}
            </span>
          }
          title={fbrFlash.tone === "ok" ? "FBR Digital Invoicing" : "FBR submit issue"}
          variant={fbrFlash.tone === "ok" ? "success" : "destructive"}
        />
      ) : null}

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
                  { label: "Contact person", value: invoice.contactPersonName || "-" },
                  { label: "Contact mobile", value: invoice.contactMobile || "-" },
                  { label: "Department", value: invoice.contactPersonDepartment || "-" },
                  { label: "Delivery date", value: formatDate(invoice.deliveryDate) },
                  { label: "Delivery challan no", value: invoice.deliveryChallanNumber || "-" },
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
                      : [{ label: "Estimate", value: invoice.estimateNumber || "-" }]),
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
                  ...(showFbr
                    ? useFbrDi
                      ? [
                          {
                            label: "FBR Digital Invoicing",
                            value: (
                              <DocumentStatusBadge label={fbrStatusLabel} status={fbrStatus} />
                            ),
                          },
                          ...(invoice.fbrSubmittedAt
                            ? [
                                {
                                  label: "FBR submitted at",
                                  value: formatDateTime(invoice.fbrSubmittedAt),
                                },
                              ]
                            : []),
                          ...(invoice.fbrFbrInvoiceNumber
                            ? [
                                {
                                  label: "FBR invoice number",
                                  value: invoice.fbrFbrInvoiceNumber,
                                },
                              ]
                            : []),
                          ...(invoice.fbrInvoiceRefNo
                            ? [{ label: "FBR local ref", value: invoice.fbrInvoiceRefNo }]
                            : []),
                          ...(typeof invoice.fbrAttemptCount === "number" &&
                          invoice.fbrAttemptCount > 0
                            ? [{ label: "FBR attempts", value: String(invoice.fbrAttemptCount) }]
                            : []),
                          ...(fbrGuidance.summary
                            ? [{ label: "FBR status detail", value: fbrGuidance.summary }]
                            : []),
                          ...(fbrGuidance.action
                            ? [{ label: "Suggested action", value: fbrGuidance.action }]
                            : []),
                          ...(invoice.fbrLastError &&
                          ["FAILED", "REJECTED", "RETRYING"].includes(fbrStatus)
                            ? [{ label: "FBR last error", value: invoice.fbrLastError }]
                            : []),
                        ]
                      : [
                          {
                            label: "FBR / Tax reported",
                            value: complianceStatus.replace(/_/g, " "),
                          },
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
            <DocumentLinesTable
              currencyCode={documentCurrency}
              lines={invoice.lines}
              mode="sales"
              showHsCode
            />
          </DocumentDetailsSection>
        </div>

        <div className="space-y-4">
          <DocumentTotalsCard
            currencyCode={documentCurrency}
            discountTotal={invoice.totals?.discountTotal}
            subtotal={invoice.totals?.subtotal}
            taxTotal={invoice.totals?.taxTotal}
            total={invoice.totals?.total}
            whtAmount={invoice.whtEnabled ? invoice.whtAmount ?? invoice.totals?.whtAmount : undefined}
            incomeWhtAmount={invoice.incomeWhtAmount ?? undefined}
            salesTaxWhtAmount={invoice.salesTaxWhtAmount ?? undefined}
            whtSettledAmount={invoice.whtEnabled ? invoice.whtSettledAmount : undefined}
            netSettlementAmount={
              invoice.whtEnabled
                ? invoice.netSettlementAmount ?? invoice.totals?.netSettlementAmount
                : undefined
            }
            netLabel={whtNetLabel(
              invoice.incomeWhtHeldBy ?? invoice.salesTaxWhtHeldBy ?? invoice.whtHeldBy,
              "invoice",
            )}
            whtAddsToTotal={whtSettlementAddsToCash(
              invoice.incomeWhtHeldBy ?? invoice.salesTaxWhtHeldBy ?? invoice.whtHeldBy,
              "invoice",
            )}
            incomeWhtAddsToTotal={whtSettlementAddsToCash(
              invoice.incomeWhtHeldBy ?? invoice.whtHeldBy,
              "invoice",
            )}
            salesTaxWhtAddsToTotal={whtSettlementAddsToCash(
              invoice.salesTaxWhtHeldBy ?? invoice.whtHeldBy,
              "invoice",
            )}
            incomeWhtHeldByLabel={whtHeldByLabel(
              invoice.incomeWhtHeldBy ?? invoice.whtHeldBy,
              "invoice",
              company?.name ?? company?.legalName,
            )}
            salesTaxWhtHeldByLabel={whtHeldByLabel(
              invoice.salesTaxWhtHeldBy ?? invoice.whtHeldBy,
              "invoice",
              company?.name ?? company?.legalName,
            )}
            whtHeldByHint={whtHeldByHint(
              invoice.whtHeldBy,
              "invoice",
              company?.name ?? company?.legalName,
            )}
            whtHeldByLabel={whtHeldByLabel(
              invoice.whtHeldBy,
              "invoice",
              company?.name ?? company?.legalName,
            )}
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
        errorMessage={sendMutation.error?.message}
        isPending={sendMutation.isPending}
        onClose={() => {
          setSendOpen(false);
          sendMutation.reset();
        }}
        onConfirm={async () => {
          await sendMutation.mutateAsync(invoice.id);
          sendMutation.reset();
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
