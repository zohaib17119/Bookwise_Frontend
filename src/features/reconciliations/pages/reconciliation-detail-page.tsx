import { useState } from "react";
import { useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AccountingActionBar } from "@/components/accounting/accounting-action-bar";
import { ReconciliationSummaryCard } from "@/components/accounting/reconciliation-summary-card";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useClearTransactions,
  useCompleteReconciliation,
  useReconciliation,
  useUnclearTransactions,
} from "@/features/reconciliations/hooks/use-reconciliations";
import type { ReconciliationCandidateTransaction } from "@/features/reconciliations/types/reconciliation.types";
import { canUsePermission, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function ReconciliationDetailPage() {
  const { companyId, reconciliationSessionId } = useParams();
  const { company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "banking");
  const canManage = canUsePermission(permissions, ["reconciliations.manage", "banking.manage"]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completeOpen, setCompleteOpen] = useState(false);
  const reconciliationQuery = useReconciliation(companyId, reconciliationSessionId ?? null);
  const clearMutation = useClearTransactions(companyId, reconciliationSessionId ?? null);
  const unclearMutation = useUnclearTransactions(companyId, reconciliationSessionId ?? null);
  const completeMutation = useCompleteReconciliation(companyId, reconciliationSessionId ?? null);

  if (!canView) {
    return <ErrorState title="Reconciliation access restricted" description="Your current company membership does not include banking visibility." />;
  }

  if (reconciliationQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading reconciliation...</div></PageContainer>;
  }

  if (reconciliationQuery.error || !reconciliationQuery.data) {
    return <ErrorState title="Reconciliation not found" description={reconciliationQuery.error?.message ?? "The requested reconciliation session is unavailable."} />;
  }

  const reconciliation = reconciliationQuery.data;
  const isLocked = reconciliation.status?.toUpperCase() === "COMPLETED";

  const columns: DataTableColumn<ReconciliationCandidateTransaction>[] = [
    {
      key: "select",
      header: "",
      className: "w-[48px]",
      render: (transaction) => (
        <Checkbox
          checked={selectedIds.includes(transaction.id)}
          disabled={isLocked || !canManage}
          onChange={(event) =>
            setSelectedIds((current) =>
              event.target.checked
                ? [...current, transaction.id]
                : current.filter((id) => id !== transaction.id),
            )
          }
        />
      ),
    },
    { key: "date", header: "Date", render: (transaction) => formatDate(transaction.transactionDate) },
    { key: "description", header: "Description", render: (transaction) => transaction.description || "-" },
    {
      key: "amount",
      header: "Amount",
      render: (transaction) => formatCurrency(transaction.amount, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
    { key: "cleared", header: "Cleared", render: (transaction) => (transaction.isCleared ? "Yes" : "No") },
  ];

  return (
    <PageContainer
      header={
        <PageHeader
          description="Clear candidate transactions until the statement difference reaches zero."
          eyebrow="Banking"
          title={reconciliation.bankAccountName || "Reconciliation session"}
        />
      }
    >
      {(clearMutation.error || unclearMutation.error || completeMutation.error) ? (
        <Alert
          title={
            clearMutation.error?.message ||
            unclearMutation.error?.message ||
            completeMutation.error?.message ||
            "Operation failed"
          }
          variant="destructive"
        />
      ) : null}

      <AccountingActionBar
        actions={
          <>
            <Button
              disabled={!selectedIds.length || isLocked || !canManage}
              isLoading={clearMutation.isPending}
              onClick={() => clearMutation.mutate(selectedIds)}
              type="button"
              variant="secondary"
            >
              Clear selected
            </Button>
            <Button
              disabled={!selectedIds.length || isLocked || !canManage}
              isLoading={unclearMutation.isPending}
              onClick={() => unclearMutation.mutate(selectedIds)}
              type="button"
              variant="ghost"
            >
              Unclear selected
            </Button>
            <Button
              disabled={isLocked || !canManage}
              onClick={() => setCompleteOpen(true)}
              type="button"
            >
              Complete reconciliation
            </Button>
          </>
        }
      />

      <ReconciliationSummaryCard
        clearedBalance={reconciliation.clearedBalance}
        currencyCode={company?.baseCurrencyCode ?? company?.currencyCode}
        difference={reconciliation.difference}
        statementEndingBalance={reconciliation.statementEndingBalance}
        status={reconciliation.status}
      />

      <DataTable
        columns={columns}
        data={reconciliation.candidateTransactions ?? []}
        emptyDescription="No candidate transactions were returned for this reconciliation period."
        emptyTitle="No candidate transactions"
        getRowKey={(transaction) => transaction.id}
        isLoading={false}
      />

      <ConfirmDeleteDialog
        description="Completing a reconciliation locks the session and finalizes the cleared set according to backend rules."
        isPending={completeMutation.isPending}
        onClose={() => {
          setCompleteOpen(false);
          completeMutation.reset();
        }}
        onConfirm={async () => {
          await completeMutation.mutateAsync();
          setCompleteOpen(false);
        }}
        open={completeOpen}
        title="Complete reconciliation?"
      />
    </PageContainer>
  );
}
