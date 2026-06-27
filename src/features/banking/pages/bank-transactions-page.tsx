import { useDeferredValue, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { TableActions } from "@/components/shared/table-actions";
import { BankTransactionStatusBadge } from "@/components/accounting/bank-transaction-status-badge";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity, canUsePermission } from "@/features/permissions/utils/module-permissions";
import { BankTransactionFormDrawer } from "@/features/banking/components/bank-transaction-form-drawer";
import {
  useBankAccounts,
  useBankTransactions,
  useCreateBankTransaction,
  useDeleteBankTransaction,
  useMatchBankTransaction,
  useUnmatchBankTransaction,
  useUpdateBankTransaction,
} from "@/features/banking/hooks/use-banking";
import type { BankTransaction } from "@/features/banking/types/banking.types";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function BankTransactionsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "banking");
  const canManage = canManageEntity(permissions, "banking");
  const canMatch = canUsePermission(permissions, ["banking.manage"]);
  const [search, setSearch] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isMatched, setIsMatched] = useState("");
  const [isCleared, setIsCleared] = useState("");
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("");
  const [source, setSource] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankTransaction | null>(null);

  const filters = useMemo(
    () => ({
      search: deferredSearch.trim() || undefined,
      bankAccountId: bankAccountId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      isMatched: isMatched === "" ? undefined : isMatched === "true",
      isCleared: isCleared === "" ? undefined : isCleared === "true",
      type: type || undefined,
      direction: direction || undefined,
      source: source || undefined,
    }),
    [bankAccountId, deferredSearch, direction, fromDate, isCleared, isMatched, source, toDate, type],
  );

  const bankAccountsQuery = useBankAccounts(companyId);
  const transactionsQuery = useBankTransactions(companyId, filters);
  const createMutation = useCreateBankTransaction(companyId);
  const updateMutation = useUpdateBankTransaction(companyId, selectedTransaction?.id ?? null);
  const deleteMutation = useDeleteBankTransaction(companyId);
  const matchMutation = useMatchBankTransaction(companyId);
  const unmatchMutation = useUnmatchBankTransaction(companyId);

  if (!canView) {
    return <ErrorState title="Banking access restricted" description="Your current company membership does not include banking visibility." />;
  }

  const columns: DataTableColumn<BankTransaction>[] = [
    {
      key: "date",
      header: "Date",
      render: (transaction) => formatDate(transaction.transactionDate),
    },
    {
      key: "description",
      header: "Transaction",
      render: (transaction) => (
        <div>
          <Link className="font-medium text-primary hover:underline" to={`/app/company/${companyId}/banking/transactions/${transaction.id}`}>
            {transaction.description || "Bank transaction"}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{transaction.bankAccountName || "-"}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (transaction) => transaction.type || "-" },
    { key: "direction", header: "Direction", render: (transaction) => transaction.direction || "-" },
    {
      key: "amount",
      header: "Amount",
      render: (transaction) => formatCurrency(transaction.amount, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
    {
      key: "status",
      header: "Status",
      render: (transaction) => (
        <BankTransactionStatusBadge
          isCleared={transaction.isCleared}
          isMatched={transaction.isMatched}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[220px]",
      render: (transaction) => (
        <div className="flex items-center justify-end gap-2">
          {canMatch ? (
            <Button
              onClick={() =>
                transaction.isMatched
                  ? unmatchMutation.mutate(transaction.id)
                  : matchMutation.mutate(transaction.id)
              }
              size="sm"
              type="button"
              variant="ghost"
            >
              {transaction.isMatched ? "Unmatch" : "Match"}
            </Button>
          ) : null}
          <TableActions
            canManage={canManage}
            onDelete={() => setDeleteTarget(transaction)}
            onEdit={() => {
              setSelectedTransaction(transaction);
              setDrawerMode("edit");
              setDrawerOpen(true);
            }}
          />
        </div>
      ),
    },
  ];

  const activeMutation = drawerMode === "create" ? createMutation : updateMutation;

  return (
    <>
      <EntityListPage
        content={
          transactionsQuery.error ? (
            <ErrorState title="Unable to load bank transactions" description={transactionsQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={transactionsQuery.data ?? []}
              emptyDescription="Create or import bank transactions before matching and reconciliation."
              emptyTitle="No bank transactions yet"
              getRowKey={(transaction) => transaction.id}
              isLoading={transactionsQuery.isLoading}
            />
          )
        }
        description="Monitor imported and manual bank activity, then match and reconcile it."
        eyebrow="Banking"
        headerActions={
          <Button
            disabled={!canManage}
            onClick={() => {
              setSelectedTransaction(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            New transaction
          </Button>
        }
        title="Bank Transactions"
        toolbar={
          <FilterBar>
            <SearchInput onChange={setSearch} placeholder="Search transaction description" value={search} />
            <Select className="min-w-[180px]" onChange={(event) => setBankAccountId(event.target.value)} value={bankAccountId}>
              <option value="">All bank accounts</option>
              {(bankAccountsQuery.data ?? []).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <DateRangeToolbar fromDate={fromDate} onFromDateChange={setFromDate} onToDateChange={setToDate} toDate={toDate} />
            <Select className="min-w-[140px]" onChange={(event) => setIsMatched(event.target.value)} value={isMatched}>
              <option value="">Match status</option>
              <option value="true">Matched</option>
              <option value="false">Unmatched</option>
            </Select>
            <Select className="min-w-[140px]" onChange={(event) => setIsCleared(event.target.value)} value={isCleared}>
              <option value="">Clear status</option>
              <option value="true">Cleared</option>
              <option value="false">Uncleared</option>
            </Select>
            <Select className="min-w-[140px]" onChange={(event) => setDirection(event.target.value)} value={direction}>
              <option value="">Direction</option>
              <option value="IN">Inflow</option>
              <option value="OUT">Outflow</option>
            </Select>
            <Select className="min-w-[160px]" onChange={(event) => setType(event.target.value)} value={type}>
              <option value="">All types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="fee">Fee</option>
              <option value="transfer">Transfer</option>
            </Select>
            <Select className="min-w-[160px]" onChange={(event) => setSource(event.target.value)} value={source}>
              <option value="">All sources</option>
              <option value="bank-feed">Bank feed</option>
              <option value="manual">Manual</option>
              <option value="import">Import</option>
            </Select>
          </FilterBar>
        }
      />

      <BankTransactionFormDrawer
        bankAccounts={bankAccountsQuery.data ?? []}
        bankTransaction={selectedTransaction}
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
            transactionDate: values.transactionDate || undefined,
            description: values.description || undefined,
            type: values.type || undefined,
            direction: values.direction || undefined,
            source: values.source || undefined,
            amount: Number(values.amount),
          };

          if (drawerMode === "create") {
            await createMutation.mutateAsync(payload);
          } else {
            await updateMutation.mutateAsync(payload);
          }

          setDrawerOpen(false);
        }}
        open={drawerOpen}
      />

      <ConfirmDeleteDialog
        description={`This will remove ${deleteTarget?.description ?? "the selected bank transaction"} from active banking workflows.`}
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
        title="Delete bank transaction?"
      />
    </>
  );
}
