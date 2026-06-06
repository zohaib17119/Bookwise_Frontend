import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { ReconciliationSummaryCard } from "@/components/accounting/reconciliation-summary-card";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useReconciliations } from "@/features/reconciliations/hooks/use-reconciliations";
import type { Reconciliation } from "@/features/reconciliations/types/reconciliation.types";
import { canUsePermission, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatDate } from "@/lib/utils/format";

export function ReconciliationsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "banking");
  const canManage = canUsePermission(permissions, ["reconciliations.manage", "banking.manage"]);
  const reconciliationsQuery = useReconciliations(companyId);

  if (!canView) {
    return <ErrorState title="Reconciliation access restricted" description="Your current company membership does not include banking visibility." />;
  }

  const columns: DataTableColumn<Reconciliation>[] = [
    {
      key: "bankAccount",
      header: "Bank account",
      render: (session) => (
        <Link className="font-medium text-primary hover:underline" to={`/app/company/${companyId}/banking/reconciliations/${session.id}`}>
          {session.bankAccountName || session.bankAccountId}
        </Link>
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (session) => `${formatDate(session.startDate)} - ${formatDate(session.endDate)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (session) => session.status || "In progress",
    },
    {
      key: "difference",
      header: "Difference",
      render: (session) => (
        <span>{session.difference ?? 0} {company?.currency ?? "USD"}</span>
      ),
    },
  ];

  return (
    <EntityListPage
      content={
        reconciliationsQuery.error ? (
          <ErrorState title="Unable to load reconciliations" description={reconciliationsQuery.error.message} />
        ) : (
          <div className="space-y-6">
            {(reconciliationsQuery.data ?? []).length ? (
              <ReconciliationSummaryCard
                clearedBalance={reconciliationsQuery.data?.[0]?.clearedBalance}
                currencyCode={company?.currency}
                difference={reconciliationsQuery.data?.[0]?.difference}
                statementEndingBalance={reconciliationsQuery.data?.[0]?.statementEndingBalance}
                status={reconciliationsQuery.data?.[0]?.status}
              />
            ) : null}
            <DataTable
              columns={columns}
              data={reconciliationsQuery.data ?? []}
              emptyDescription="Start a reconciliation session after importing or entering bank transactions."
              emptyTitle="No reconciliation sessions yet"
              getRowKey={(session) => session.id}
              isLoading={reconciliationsQuery.isLoading}
            />
          </div>
        )
      }
      description="Track bank reconciliation sessions, progress, and differences."
      eyebrow="Banking"
      headerActions={
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/banking/reconciliations/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New reconciliation
          </Link>
        </Button>
      }
      title="Reconciliations"
    />
  );
}
