import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActions } from "@/components/shared/table-actions";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { BankAccountFormDrawer } from "@/features/banking/components/bank-account-form-drawer";
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
  useUpdateBankAccount,
} from "@/features/banking/hooks/use-banking";
import type { BankAccount } from "@/features/banking/types/banking.types";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function BankAccountsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "banking");
  const canManage = canManageEntity(permissions, "banking");
  const accountsQuery = useBankAccounts(companyId);
  const ledgerAccountsQuery = useAccountOptions(companyId);
  const createMutation = useCreateBankAccount(companyId);
  const deleteMutation = useDeleteBankAccount(companyId);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const updateMutation = useUpdateBankAccount(companyId, selectedAccount?.id ?? null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);

  if (!canView) {
    return <ErrorState title="Banking access restricted" description="Your current company membership does not include banking visibility." />;
  }

  const columns: DataTableColumn<BankAccount>[] = [
    {
      key: "name",
      header: "Bank account",
      render: (account) => (
        <div>
          <p className="font-medium">{account.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{account.bankName || "-"}</p>
        </div>
      ),
    },
    { key: "linked", header: "Linked account", render: (account) => account.linkedAccountName || "-" },
    { key: "currency", header: "Currency", render: (account) => account.currencyCode || company?.currency || "USD" },
    {
      key: "opening",
      header: "Opening balance",
      render: (account) => (
        <div>
          <p>{formatCurrency(account.openingBalance ?? 0, account.currencyCode ?? company?.currency ?? "USD")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(account.openingBalanceDate)}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (account) => <StatusBadge active={account.isActive} /> },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (account) => (
        <TableActions
          canManage={canManage}
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
            <ErrorState title="Unable to load bank accounts" description={accountsQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={accountsQuery.data ?? []}
              emptyDescription="Create bank accounts before importing transactions or starting reconciliations."
              emptyTitle="No bank accounts yet"
              getRowKey={(account) => account.id}
              isLoading={accountsQuery.isLoading}
            />
          )
        }
        description="Configure company bank accounts and map them to ledger accounts."
        eyebrow="Banking"
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
            New bank account
          </Button>
        }
        title="Bank Accounts"
      />

      <BankAccountFormDrawer
        accountOptions={ledgerAccountsQuery.data ?? []}
        error={activeMutation.error}
        isPending={activeMutation.isPending}
        mode={drawerMode}
        onClose={() => {
          setDrawerOpen(false);
          activeMutation.reset();
        }}
        onSubmit={async (values) => {
          const payload = {
            ...values,
            accountNumberMasked: values.accountNumberMasked || undefined,
            bankName: values.bankName || undefined,
            branchName: values.branchName || undefined,
            currencyCode: values.currencyCode || undefined,
            openingBalance: values.openingBalance ?? null,
            openingBalanceDate: values.openingBalanceDate || undefined,
          };
          if (drawerMode === "create") {
            await createMutation.mutateAsync(payload);
          } else {
            await updateMutation.mutateAsync(payload);
          }
          setDrawerOpen(false);
        }}
        open={drawerOpen}
        bankAccount={selectedAccount}
      />

      <ConfirmDeleteDialog
        description={`This will remove ${deleteTarget?.name ?? "the selected bank account"} from active banking workflows.`}
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
        title="Delete bank account?"
      />
    </>
  );
}
