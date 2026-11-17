import { useEffect, useState } from "react";
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
  usePatchInvoiceSalesPerson,
  useRetryInvoiceFbrSubmit,
  useRevertInvoiceToDraft,
  useSendInvoice,
  useSubmitInvoiceCompliance,
  useSubmitInvoiceFbrSync,
} from "@/features/invoices/hooks/use-invoices";
import { useSalesPersons } from "@/features/sales-persons/hooks/use-sales-persons";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { whtHeldByHint, whtHeldByLabel, whtNetLabel, whtSettlementAddsToCash } from "@/features/shared/utils/wht-labels";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { formatPaymentOptions } from "@/features/invoices/constants/payment-options";
import {
  fbrDiOriginBanner,
  resolveFbrDiSource,
  type FbrDiAttemptEvidence,
} from "@/features/invoices/api/invoices.api";
import InvoiceView from "./InvoiceView";
import { DeliveryChallanPreview } from "@/features/invoices/components/delivery-challan-preview";
import { useDeliveryChallanRemaining } from "@/features/invoices/hooks/use-delivery-challans";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Alert } from "@/components/ui/alert";

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { invoiceId, companyId } = useParams();
  const { permissions, company, role } = useActiveCompany();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentNoteType | null>(null);
  const [fbrFlash, setFbrFlash] = useState<{
    tone: "ok" | "err";
    text: string;
    detail?: string | null;
    preview?: string | null;
    fbrDi?: FbrDiAttemptEvidence | null;
  } | null>(null);
  const invoiceQuery = useInvoice(companyId, invoiceId ?? null);
  const remainingDcQuery = useDeliveryChallanRemaining(
    companyId,
    invoiceId ?? null,
    Boolean(invoiceId) && !invoiceQuery.isLoading,
  );
  const deleteMutation = useDeleteInvoice(companyId);
  const sendMutation = useSendInvoice(companyId);
  const complianceMutation = useSubmitInvoiceCompliance(companyId);
  const fbrSubmitMutation = useSubmitInvoiceFbrSync(companyId);
  const fbrRetryMutation = useRetryInvoiceFbrSubmit(companyId);
  const markTaxReportedMutation = useMarkInvoiceTaxReported(companyId);
  const revertToDraftMutation = useRevertInvoiceToDraft(companyId);
  const creditNoteMutation = useCreateCreditNote(companyId);
  const debitNoteMutation = useCreateDebitNote(companyId);
  const patchSalesPersonMutation = usePatchInvoiceSalesPerson(companyId, invoiceId ?? null);
  const salesPersonsQuery = useSalesPersons(companyId);
  const [salesPersonDraft, setSalesPersonDraft] = useState("");
  const [salesPersonSaveError, setSalesPersonSaveError] = useState<string | null>(null);
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");
  const showZatca = canUseZatcaReporting(company);
  const showFbr = canShowFbr(company);
  const useFbrDi = canUseFbrDigitalInvoicing(company);
  const baseCurrency = getCompanyBaseCurrency(company);

  useEffect(() => {
    if (invoiceQuery.data) {
      setSalesPersonDraft(invoiceQuery.data.salesPersonId ?? "");
      setSalesPersonSaveError(null);
    }
  }, [invoiceQuery.data?.id, invoiceQuery.data?.salesPersonId]);

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
  const canEditSalesPerson =
    canManage && invoice.status !== "VOID" && invoice.status !== "CANCELLED";
  const salesPersonDirty =
    (salesPersonDraft || "") !== (invoice.salesPersonId ?? "");
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
  const flashIsLocalMap =
    Boolean(fbrFlash?.fbrDi) && resolveFbrDiSource(fbrFlash?.fbrDi) === "LOCAL_MAP";
  const storedIsLocalMap =
    !fbrFlash &&
    invoice.fbrLastReachedGateway === false &&
    invoice.fbrLastRequestJson != null;
  const canForceFbrAnyway =
    canRetryFbr &&
    ((flashIsLocalMap && fbrFlash?.fbrDi?.requestJson != null) || storedIsLocalMap);
  const canMarkTaxReported =
    showFbr &&
    canManage &&
    !useFbrDi &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "CANCELLED" &&
    complianceStatus === "PENDING";

  const runFbrSync = async (
    mode: "submit" | "retry",
    options?: { bypassLocalMap?: boolean },
  ) => {
    setFbrFlash(null);
    try {
      const data =
        mode === "submit"
          ? await fbrSubmitMutation.mutateAsync({
              invoiceId: invoice.id,
              bypassLocalMap: options?.bypassLocalMap,
            })
          : await fbrRetryMutation.mutateAsync({
              invoiceId: invoice.id,
              bypassLocalMap: options?.bypassLocalMap,
            });
      const fbrDi = data.fbrDi ?? data.result.fbrDi ?? null;
      const source = resolveFbrDiSource(fbrDi);
      const origin = fbrDiOriginBanner(source);
      if (data.result.status === "SUBMITTED") {
        setFbrFlash({
          tone: "ok",
          text: `${origin} ${
            data.fbrFbrInvoiceNumber
              ? `FBR accepted. Invoice number: ${data.fbrFbrInvoiceNumber}`
              : "FBR accepted this document."
          }`,
          fbrDi,
        });
      } else {
        const preview = data.gatewayPreview || data.result.gatewayPreview || null;
        const errBody =
          data.fbrLastError ||
          data.result.message ||
          data.guidance?.summary ||
          "Submit did not succeed.";
        setFbrFlash({
          tone: "err",
          text: `${origin} ${errBody}`,
          detail: data.guidance?.action ?? null,
          preview: source === "LOCAL_MAP" ? null : preview,
          fbrDi,
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
  const canCreateDeliveryChallan =
    canManage &&
    !isAdjustmentNote &&
    Boolean(remainingDcQuery.data?.canCreate);
  const canRevertToDraft =
    canManage &&
    (role === "OWNER" || role === "ADMIN") &&
    !isAdjustmentNote &&
    invoice.status !== "DRAFT" &&
    invoice.status !== "VOID" &&
    invoice.status !== "CANCELLED";

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
              {canCreateDeliveryChallan ? (
                <Button asChild variant="secondary">
                  <Link to={`/app/company/${companyId}/invoices/${invoice.id}/delivery-challans/new`}>
                    Create delivery challan
                  </Link>
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
              {canForceFbrAnyway ? (
                <Button
                  isLoading={fbrBusy}
                  onClick={() => void runFbrSync("retry", { bypassLocalMap: true })}
                  type="button"
                  variant="secondary"
                >
                  Submit to FBR anyway
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
              {canRevertToDraft ? (
                <Button onClick={() => setRevertOpen(true)} variant="secondary">
                  Revert to draft
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
              {fbrFlash.fbrDi ? (
                <span className="block rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm font-medium text-foreground">
                  {fbrDiOriginBanner(resolveFbrDiSource(fbrFlash.fbrDi))}
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                    source={resolveFbrDiSource(fbrFlash.fbrDi)}
                  </span>
                </span>
              ) : null}
              <span className="block">{fbrFlash.text}</span>
              {fbrFlash.detail ? (
                <span className="block opacity-90">{fbrFlash.detail}</span>
              ) : null}
              {fbrFlash.preview ? (
                <span className="mt-2 block rounded-md border border-destructive/20 bg-white/60 p-2 font-mono text-xs break-all text-foreground">
                  Gateway body: {fbrFlash.preview}
                </span>
              ) : null}
              {fbrFlash.fbrDi ? (
                <span className="mt-2 block space-y-2 rounded-md border border-border bg-white/60 p-3 text-foreground">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {resolveFbrDiSource(fbrFlash.fbrDi) === "LOCAL_MAP"
                      ? "BooksWise local validation (not sent to FBR)"
                      : resolveFbrDiSource(fbrFlash.fbrDi) === "MOCK"
                        ? "Mock DI attempt"
                        : "FBR gateway attempt"}
                  </span>
                  <span className="block font-mono text-xs break-all">
                    PostURL: {fbrFlash.fbrDi.postUrl}
                    {resolveFbrDiSource(fbrFlash.fbrDi) === "LOCAL_MAP"
                      ? " (not called)"
                      : ""}
                  </span>
                  {fbrFlash.fbrDi.httpStatus != null ? (
                    <span className="block font-mono text-xs">
                      HTTP: {fbrFlash.fbrDi.httpStatus}
                    </span>
                  ) : null}
                  <span className="block">
                    <span className="text-xs text-muted-foreground">Request JSON</span>
                    <pre className="mt-1 max-h-48 overflow-auto rounded border border-border/60 bg-muted/40 p-2 font-mono text-[11px] leading-snug whitespace-pre-wrap break-all">
                      {JSON.stringify(fbrFlash.fbrDi.requestJson, null, 2)}
                    </pre>
                  </span>
                  <span className="block">
                    <span className="text-xs text-muted-foreground">
                      {resolveFbrDiSource(fbrFlash.fbrDi) === "LOCAL_MAP"
                        ? "BooksWise validation errors"
                        : "FBR response"}
                    </span>
                    <pre className="mt-1 max-h-48 overflow-auto rounded border border-border/60 bg-muted/40 p-2 font-mono text-[11px] leading-snug whitespace-pre-wrap break-all">
                      {JSON.stringify(fbrFlash.fbrDi.responseBody, null, 2)}
                    </pre>
                  </span>
                  {fbrFlash.fbrDi.mapIssues?.length ? (
                    <span className="block font-mono text-xs text-destructive">
                      {fbrFlash.fbrDi.mapIssues.map((i) => `${i.path}: ${i.message}`).join("; ")}
                    </span>
                  ) : null}
                  {resolveFbrDiSource(fbrFlash.fbrDi) === "LOCAL_MAP" &&
                  fbrFlash.fbrDi.requestJson != null &&
                  canRetryFbr ? (
                    <span className="mt-2 block">
                      <Button
                        isLoading={fbrBusy}
                        onClick={() => void runFbrSync("retry", { bypassLocalMap: true })}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Submit to FBR anyway
                      </Button>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Skips BooksWise validation and posts this request JSON to FBR.
                      </span>
                    </span>
                  ) : null}
                </span>
              ) : null}
            </span>
          }
          title={
            fbrFlash.tone === "ok"
              ? "FBR Digital Invoicing"
              : resolveFbrDiSource(fbrFlash.fbrDi) === "LOCAL_MAP"
                ? "BooksWise validation"
                : resolveFbrDiSource(fbrFlash.fbrDi) === "MOCK"
                  ? "FBR mock result"
                  : "FBR gateway response"
          }
          variant={fbrFlash.tone === "ok" ? "success" : "destructive"}
        />
      ) : null}

      {!fbrFlash && useFbrDi && invoice.fbrLastRequestJson != null ? (
        <Alert
          description={
            <span className="space-y-2 block">
              <span className="block rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm font-medium text-foreground">
                {invoice.fbrLastReachedGateway === false
                  ? fbrDiOriginBanner("LOCAL_MAP")
                  : fbrDiOriginBanner("FBR_GATEWAY")}
                <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                  source=
                  {invoice.fbrLastReachedGateway === false ? "LOCAL_MAP" : "FBR_GATEWAY"}
                </span>
              </span>
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last stored attempt
              </span>
              {invoice.fbrLastPostUrl ? (
                <span className="block font-mono text-xs break-all">
                  PostURL: {invoice.fbrLastPostUrl}
                  {invoice.fbrLastReachedGateway === false ? " (not called)" : ""}
                </span>
              ) : null}
              {invoice.fbrLastHttpStatus != null ? (
                <span className="block font-mono text-xs">HTTP: {invoice.fbrLastHttpStatus}</span>
              ) : null}
              <span className="block">
                <span className="text-xs text-muted-foreground">Request JSON</span>
                <pre className="mt-1 max-h-48 overflow-auto rounded border border-border/60 bg-muted/40 p-2 font-mono text-[11px] leading-snug whitespace-pre-wrap break-all">
                  {JSON.stringify(invoice.fbrLastRequestJson, null, 2)}
                </pre>
              </span>
              <span className="block">
                <span className="text-xs text-muted-foreground">
                  {invoice.fbrLastReachedGateway === false
                    ? "BooksWise validation errors"
                    : "FBR response"}
                </span>
                <pre className="mt-1 max-h-48 overflow-auto rounded border border-border/60 bg-muted/40 p-2 font-mono text-[11px] leading-snug whitespace-pre-wrap break-all">
                  {JSON.stringify(invoice.fbrLastResponseBody ?? null, null, 2)}
                </pre>
              </span>
              {invoice.fbrLastReachedGateway === false && canRetryFbr ? (
                <span className="mt-2 block">
                  <Button
                    isLoading={fbrBusy}
                    onClick={() => void runFbrSync("retry", { bypassLocalMap: true })}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Submit to FBR anyway
                  </Button>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Skips BooksWise validation and posts this request JSON to FBR.
                  </span>
                </span>
              ) : null}
            </span>
          }
          title={
            invoice.fbrLastReachedGateway === false
              ? "BooksWise validation (stored)"
              : "FBR gateway response (stored)"
          }
          variant="default"
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
                  {
                    label: "Sales person",
                    value: canEditSalesPerson ? (
                      <div className="flex max-w-[min(100%,16rem)] flex-col items-end gap-2">
                        <Select
                          className="w-full text-left"
                          disabled={patchSalesPersonMutation.isPending}
                          onChange={(event) => {
                            setSalesPersonDraft(event.target.value);
                            setSalesPersonSaveError(null);
                          }}
                          value={salesPersonDraft}
                        >
                          <option value="">Select sales person…</option>
                          {(salesPersonsQuery.data ?? []).map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.name}
                              {sp.isDefault ? " (default)" : ""}
                            </option>
                          ))}
                        </Select>
                        {salesPersonSaveError ? (
                          <span className="text-xs text-destructive">{salesPersonSaveError}</span>
                        ) : null}
                        <Button
                          disabled={
                            !salesPersonDirty ||
                            !salesPersonDraft ||
                            patchSalesPersonMutation.isPending
                          }
                          onClick={() => {
                            setSalesPersonSaveError(null);
                            patchSalesPersonMutation.mutate(salesPersonDraft, {
                              onError: (error) => {
                                setSalesPersonSaveError(getApiErrorMessage(error));
                              },
                            });
                          }}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          {patchSalesPersonMutation.isPending ? "Saving…" : "Save sales person"}
                        </Button>
                      </div>
                    ) : (
                      invoice.salesPersonName || "—"
                    ),
                  },
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

          {!isAdjustmentNote ? (
            <DocumentDetailsSection title="Delivery challans">
              {(invoice.deliveryChallans?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No delivery challans yet.
                  {canCreateDeliveryChallan
                    ? " Create one to print a partial or full delivery document (stock is unchanged)."
                    : ""}
                </p>
              ) : (
                <ul className="space-y-3">
                  {invoice.deliveryChallans!.map((dc) => (
                    <li
                      key={dc.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="text-sm">
                        <div className="font-medium">{dc.challanNumber}</div>
                        <div className="text-muted-foreground">
                          {formatDate(dc.challanDate)}
                          {dc.lines?.length
                            ? ` · ${dc.lines.length} line${dc.lines.length === 1 ? "" : "s"}`
                            : ""}
                        </div>
                      </div>
                      {companyId ? (
                        <DeliveryChallanPreview
                          challanNumber={dc.challanNumber}
                          companyId={companyId}
                          dcId={dc.id}
                          invoiceId={invoice.id}
                          label="Print"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {canCreateDeliveryChallan ? (
                <div className="pt-3">
                  <Button asChild size="sm" variant="secondary">
                    <Link
                      to={`/app/company/${companyId}/invoices/${invoice.id}/delivery-challans/new`}
                    >
                      Create delivery challan
                    </Link>
                  </Button>
                </div>
              ) : null}
            </DocumentDetailsSection>
          ) : null}
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

      <ConfirmDialog
        confirmLabel="Revert to draft"
        description="This reverses the invoice journal and inventory, clears FBR submission data, and reopens the invoice as Draft so you can edit and re-issue. Unallocate any customer payments first. Linked credit/debit notes block this action."
        errorMessage={revertToDraftMutation.error?.message}
        isPending={revertToDraftMutation.isPending}
        onClose={() => {
          setRevertOpen(false);
          revertToDraftMutation.reset();
        }}
        onConfirm={async () => {
          await revertToDraftMutation.mutateAsync(invoice.id);
          revertToDraftMutation.reset();
          setRevertOpen(false);
        }}
        open={revertOpen}
        title="Revert invoice to draft?"
      />

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
