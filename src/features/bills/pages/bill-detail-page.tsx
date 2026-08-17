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
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { DocumentTotalsCard } from "@/components/documents/document-totals-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canShowFbr } from "@/features/compliance/utils/compliance-access";
import { whtHeldByHint, whtHeldByLabel, whtNetLabel, whtSettlementAddsToCash } from "@/features/shared/utils/wht-labels";
import {
  useBill,
  useDeleteBill,
  useIssueBill,
  useMarkBillTaxReported,
  useReceiveBillGoods,
  useVoidBill,
} from "@/features/bills/hooks/use-bills";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatDate } from "@/lib/utils/format";

export function BillDetailPage() {
  const navigate = useNavigate();
  const { billId, companyId } = useParams();
  const { permissions, company } = useActiveCompany();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const billQuery = useBill(companyId, billId ?? null);
  const deleteMutation = useDeleteBill(companyId);
  const issueMutation = useIssueBill(companyId);
  const receiveMutation = useReceiveBillGoods(companyId);
  const voidMutation = useVoidBill(companyId);
  const markTaxReportedMutation = useMarkBillTaxReported(companyId);
  const canView = canViewEntity(permissions, "bills");
  const canManage = canManageEntity(permissions, "bills");
  const showFbr = canShowFbr(company);

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
  const documentCurrency = bill.currencyCode ?? getCompanyBaseCurrency(company);
  const canReceive =
    bill.rawStatus !== "DRAFT" &&
    bill.rawStatus !== "VOID" &&
    bill.rawStatus !== "CANCELLED" &&
    bill.goodsStatus !== "NOT_APPLICABLE" &&
    bill.goodsStatus !== "RECEIVED";
  const canVoid =
    bill.rawStatus !== "DRAFT" && bill.rawStatus !== "VOID" && bill.rawStatus !== "CANCELLED";
  const complianceStatus = bill.complianceStatus ?? "NOT_APPLICABLE";
  const canMarkTaxReported =
    showFbr && canManage && bill.rawStatus !== "DRAFT" && complianceStatus === "PENDING";

  return (
    <PageContainer className="space-y-6">
      <DocumentHeaderCard
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-3">
              {bill.status === "DRAFT" ? (
                <Button onClick={() => setIssueOpen(true)} variant="primary">Issue bill</Button>
              ) : null}
              {canReceive ? (
                <Button onClick={() => setReceiveOpen(true)} variant="primary">Receive goods</Button>
              ) : null}
              {canMarkTaxReported ? (
                <Button
                  isLoading={markTaxReportedMutation.isPending}
                  onClick={() => void markTaxReportedMutation.mutateAsync(bill.id)}
                  variant="secondary"
                >
                  Mark tax reported
                </Button>
              ) : null}
              {bill.status === "DRAFT" ? (
                <Button asChild variant="secondary">
                  <Link to={`/app/company/${companyId}/bills/${bill.id}/edit`}>Edit bill</Link>
                </Button>
              ) : null}
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/bill-payments/new?vendorId=${bill.vendorId}&billId=${bill.id}`}>Record payment</Link>
              </Button>
              {canVoid ? (
                <Button onClick={() => setVoidOpen(true)} variant="outline">Void</Button>
              ) : null}
              <Button onClick={() => setDeleteOpen(true)} variant="ghost">
                {bill.status === "DRAFT" ? "Delete" : "Cancel / void"}
              </Button>
            </div>
          ) : null
        }
        badges={
          <>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Payment</span>
              <DocumentStatusBadge status={bill.paymentStatus === "UNPAID" ? "UNPAID" : bill.status} />
            </div>
            {bill.goodsStatus && bill.goodsStatus !== "NOT_APPLICABLE" ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Goods</span>
                <DocumentStatusBadge status={bill.goodsStatus} />
              </div>
            ) : null}
          </>
        }
        description="Review bill details, goods receipt, payable balances, and line items."
        number={bill.billNumber}
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
                  { label: "Currency", value: documentCurrency },
                  { label: "Goods status", value: (bill.goodsStatus ?? "-").replace(/_/g, " ") },
                  { label: "Payment status", value: (bill.paymentStatus ?? bill.status ?? "-").replace(/_/g, " ") },
                  ...(showFbr
                    ? [
                        {
                          label: "FBR / Tax reported",
                          value: complianceStatus.replace(/_/g, " "),
                        },
                      ]
                    : []),
                  { label: "Notes", value: bill.notes || "-" },
                ]}
                title="Commercials"
              />
            </div>
          </DocumentDetailsSection>

          <DocumentDetailsSection title="Line items">
            <DocumentLinesTable currencyCode={documentCurrency} lines={bill.lines} mode="purchase" />
          </DocumentDetailsSection>
        </div>

        <div className="space-y-4">
          <DocumentTotalsCard
            currencyCode={documentCurrency}
            discountTotal={bill.totals?.discountTotal}
            subtotal={bill.totals?.subtotal}
            taxTotal={bill.totals?.taxTotal}
            total={bill.totals?.total}
            whtAmount={bill.whtEnabled ? bill.whtAmount ?? bill.totals?.whtAmount : undefined}
            netSettlementAmount={
              bill.whtEnabled
                ? bill.netSettlementAmount ?? bill.totals?.netSettlementAmount
                : undefined
            }
            netLabel={whtNetLabel(bill.whtHeldBy, "bill")}
            whtAddsToTotal={whtSettlementAddsToCash(bill.whtHeldBy, "bill")}
            whtHeldByHint={whtHeldByHint(
              bill.whtHeldBy,
              "bill",
              company?.name ?? company?.legalName,
            )}
            whtHeldByLabel={whtHeldByLabel(
              bill.whtHeldBy,
              "bill",
              company?.name ?? company?.legalName,
            )}
          />
          <AmountSummaryCard amount={bill.amountPaid} currencyCode={documentCurrency} label="Amount paid" />
          <AmountSummaryCard amount={bill.amountDue} currencyCode={documentCurrency} label="Amount due" />
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Issue bill"
        description="Posts accounts payable (and purchases clearing for inventory lines). Stock quantity increases only when you Receive goods."
        isPending={issueMutation.isPending}
        onClose={() => {
          setIssueOpen(false);
          issueMutation.reset();
        }}
        onConfirm={async () => {
          await issueMutation.mutateAsync(bill.id);
          setIssueOpen(false);
        }}
        open={issueOpen}
        title="Issue this bill?"
      />

      <ConfirmDialog
        confirmLabel="Receive goods"
        description="Creates inventory batches and stock quantity for outstanding inventory lines, and reclasses Purchases Clearing to Inventory Asset."
        isPending={receiveMutation.isPending}
        onClose={() => {
          setReceiveOpen(false);
          receiveMutation.reset();
        }}
        onConfirm={async () => {
          await receiveMutation.mutateAsync({ billId: bill.id });
          setReceiveOpen(false);
        }}
        open={receiveOpen}
        title="Receive all outstanding goods?"
      />

      <ConfirmDialog
        confirmLabel="Void bill"
        description="Reverses goods receipt (if any) and the bill journal. Payments must be unallocated first. Cannot void if received stock was already sold."
        isPending={voidMutation.isPending}
        onClose={() => {
          setVoidOpen(false);
          voidMutation.reset();
        }}
        onConfirm={async () => {
          await voidMutation.mutateAsync(bill.id);
          setVoidOpen(false);
        }}
        open={voidOpen}
        title="Void this bill?"
      />

      <ConfirmDeleteDialog
        description={
          bill.status === "DRAFT"
            ? "This will cancel the draft bill."
            : "Issued bills are voided (journals and stock reversed when possible)."
        }
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
        title={bill.status === "DRAFT" ? "Delete draft bill?" : "Void / cancel bill?"}
      />
    </PageContainer>
  );
}
