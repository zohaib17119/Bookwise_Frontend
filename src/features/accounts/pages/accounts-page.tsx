import { useDeferredValue, useMemo, useState } from "react";
import { Plus, Spline, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActions } from "@/components/shared/table-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useParentAccountOptions,
  useUpdateAccount,
} from "@/features/accounts/hooks/use-accounts";
import { AccountFormDrawer } from "@/features/accounts/components/account-form-drawer";
import type { Account } from "@/features/accounts/types/account.types";
import type { AccountFormValues } from "@/features/accounts/schemas/account.schema";

export function AccountsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeSystemGenerated, setIncludeSystemGenerated] = useState(true);
  const [asTree, setAsTree] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filters = useMemo(
    () => ({
      search: deferredSearch.trim() || undefined,
      type: type || undefined,
      includeInactive,
      includeSystemGenerated,
      asTree,
    }),
    [asTree, deferredSearch, includeInactive, includeSystemGenerated, type],
  );

  const accountsQuery = useAccounts(companyId, filters);
  const parentOptionsQuery = useParentAccountOptions(companyId, selectedAccount?.id);
  const createMutation = useCreateAccount(companyId);
  const updateMutation = useUpdateAccount(companyId, selectedAccount?.id ?? null);
  const deleteMutation = useDeleteAccount(companyId);
  const canView = canViewEntity(permissions, "accounts");
  const canManage = canManageEntity(permissions, "accounts");

  if (!canView) {
    return (
      <ErrorState
        title="Accounts access restricted"
        description="Your current company membership does not include access to the chart of accounts."
      />
    );
  }

  const columns: DataTableColumn<Account>[] = [
    {
      key: "account",
      header: "Account",
      render: (account) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {account.code ? `${account.code} - ` : ""}
              {account.name}
            </p>
            {account.isSystemGenerated ? (
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                System
              </span>
            ) : null}
          </div>
          {account.description ? (
            <p className="mt-1 text-xs text-muted-foreground">{account.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (account) => (
        <div>
          <p className="capitalize">{account.type}</p>
          <p className="text-xs text-muted-foreground">{account.subtype || "No subtype"}</p>
        </div>
      ),
    },
    {
      key: "normalSide",
      header: "Normal Side",
      render: (account) => (
        <span className="capitalize">{account.normalSide}</span>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      render: (account) => account.parentAccountName || "Top level",
    },
    {
      key: "status",
      header: "Status",
      render: (account) => <StatusBadge active={account.isActive} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (account) => (
        <TableActions
          canManage={canManage && !account.isSystemGenerated}
          onDelete={() => setDeleteTarget(account)}
          onEdit={() => {
            setSelectedAccount(account);
            setDrawerMode("edit");
            setDrawerOpen(true);
          }}
        />
      ),
    },
  ];

  const activeMutation = drawerMode === "create" ? createMutation : updateMutation;

  return (
    <>
      <EntityListPage
        content={
          accountsQuery.error ? (
            <ErrorState
              title="Unable to load accounts"
              description={accountsQuery.error.message}
            />
          ) : (
            <DataTable
              columns={columns}
              data={accountsQuery.data ?? []}
              emptyDescription="Create the chart of accounts that powers invoices, bills, items, and reporting."
              emptyTitle="No accounts yet"
              getRowKey={(account) => account.id}
              isLoading={accountsQuery.isLoading}
            />
          )
        }
        description="Manage the company ledger, account hierarchy, and reporting structure."
        eyebrow="Accounting"
        headerActions={
          <Button
            disabled={!canManage}
            onClick={() => {
              setSelectedAccount(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            New account
          </Button>
        }
        title="Chart of Accounts"
        toolbar={
          <FilterBar
            actions={
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spline className="h-4 w-4" />
                {asTree ? "Hierarchy mode" : "Flat list"}
              </div>
            }
          >
            <SearchInput
              onChange={setSearch}
              placeholder="Search accounts by code or name"
              value={search}
            />
            <Select
              className="min-w-[180px]"
              onChange={(event) => setType(event.target.value)}
              value={type}
            >
              <option value="">All account types</option>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
              />
              Include inactive
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeSystemGenerated}
                onChange={(event) => setIncludeSystemGenerated(event.target.checked)}
              />
              Include system
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={asTree}
                onChange={(event) => setAsTree(event.target.checked)}
              />
              Tree view
            </label>
          </FilterBar>
        }
      />

      <AccountFormDrawer
        account={selectedAccount}
        companyCurrency={company?.currency}
        error={activeMutation.error}
        isPending={activeMutation.isPending}
        mode={drawerMode}
        onClose={() => {
          setDrawerOpen(false);
          activeMutation.reset();
        }}
        onSubmit={async (values: AccountFormValues) => {
          const payload = {
            ...values,
            code: values.code || undefined,
            description: values.description || undefined,
            subtype: values.subtype || undefined,
            currencyCode: values.currencyCode || undefined,
          };

          if (drawerMode === "create") {
            await createMutation.mutateAsync(payload);
          } else {
            await updateMutation.mutateAsync(payload);
          }

          setDrawerOpen(false);
        }}
        open={drawerOpen}
        parentAccounts={parentOptionsQuery.data ?? []}
      />

      <ConfirmDeleteDialog
        description={`This will soft delete ${deleteTarget?.name ?? "this account"} and hide it from new selections.`}
        isPending={deleteMutation.isPending}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        open={Boolean(deleteTarget)}
        title="Delete account?"
      />

      {deleteMutation.error ? (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
          <Alert
            description="The backend rejected the delete request. Review dependencies or permissions."
            title={deleteMutation.error.message}
            variant="destructive"
          />
        </div>
      ) : null}
    </>
  );
}
