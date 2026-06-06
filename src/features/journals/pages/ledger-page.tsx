import { Link } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import type { Account } from "@/features/accounts/types/account.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";

export function LedgerPage() {
  const { companyId, permissions } = useActiveCompany();
  const accountsQuery = useAccountOptions(companyId);
  const canView = canViewEntity(permissions, "reports");

  if (!canView) {
    return (
      <ErrorState
        title="Ledger access restricted"
        description="Your current company membership does not include ledger visibility."
      />
    );
  }

  const columns: DataTableColumn<Account>[] = [
    {
      key: "name",
      header: "Account",
      render: (account) => (
        <div>
          <Link className="font-medium text-primary hover:underline" to={`/app/company/${companyId}/ledger/${account.id}`}>
            {(account.code ? `${account.code} - ` : "") + account.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{account.type}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (account) => (account.isActive ? "Active" : "Inactive"),
    },
  ];

  return (
    <EntityListPage
      content={
        accountsQuery.error ? (
          <ErrorState title="Unable to load accounts" description={accountsQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={accountsQuery.data ?? []}
            emptyDescription="Create accounts before reviewing ledger activity."
            emptyTitle="No accounts available"
            getRowKey={(account) => account.id}
            isLoading={accountsQuery.isLoading}
          />
        )
      }
      description="Select an account to inspect posting activity and running balances."
      eyebrow="Ledger"
      title="Account Ledger"
    />
  );
}
