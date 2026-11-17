import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { Link } from "react-router-dom";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { SortableTableHeader, toggleListSort } from "@/components/shared/sortable-table-header";
import type { ListSortDir } from "@/features/shared/types/common";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { buildPayFromOptions } from "@/features/accounts/utils/payment-account-options";
import { ExpensePayFromFilter } from "@/features/expenses/components/expense-pay-from-filter";
import { useBankAccounts } from "@/features/banking/hooks/use-banking";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { ExpenseCategoryFilter } from "@/features/expenses/components/expense-category-filter";
import { ExpenseCategorySelect } from "@/features/expenses/components/expense-category-select";
import {
  useCreateExpense,
  useExpensesPaginated,
  useUpdateExpense,
} from "@/features/expenses/hooks/use-expenses";
import type { Expense } from "@/features/expenses/types/expense.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useAccountingSettings } from "@/features/settings/hooks/use-settings";
import { useDefaultAccountMapping } from "@/features/settings/hooks/use-default-account-mapping";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { toMoneyString } from "@/lib/utils/money";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function defaultRange() {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - 6);
  return { fromDate: isoDate(fromDate), toDate: isoDate(toDate) };
}

type Draft = {
  paymentDate: string;
  expenseAccountId: string;
  paymentAccountId: string;
  amount: string;
  description: string;
  referenceNumber: string;
  updateNote: string;
};

const emptyDraft = (paymentAccountId = ""): Draft => ({
  paymentDate: isoDate(new Date()),
  expenseAccountId: "",
  paymentAccountId,
  amount: "",
  description: "",
  referenceNumber: "",
  updateNote: "",
});

export function ExpensesPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;
  const range = defaultRange();
  const [fromDate, setFromDate] = useState(range.fromDate);
  const [toDate, setToDate] = useState(range.toDate);
  const [sortBy, setSortBy] = useState("paymentDate");
  const [sortDir, setSortDir] = useState<ListSortDir>("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [addDraft, setAddDraft] = useState<Draft>(emptyDraft());
  const [includedCategoryIds, setIncludedCategoryIds] = useState<Set<string> | null>(null);
  const [includedPayFromIds, setIncludedPayFromIds] = useState<Set<string> | null>(null);
  const debouncedSearch = useDebouncedValue(search, 200);
  const accountsQuery = useAccountOptions(companyId);
  const bankAccountsQuery = useBankAccounts(companyId);
  const mappingQuery = useDefaultAccountMapping(companyId);
  const accountingQuery = useAccountingSettings(companyId);
  const notesRequired = Boolean(accountingQuery.data?.expenseUpdateNotesRequired);
  const expenseAccountIdsParam =
    includedCategoryIds === null ? undefined : [...includedCategoryIds].join(",");
  const paymentAccountIdsParam =
    includedPayFromIds === null ? undefined : [...includedPayFromIds].join(",");
  const expensesQuery = useExpensesPaginated(companyId, {
    search: debouncedSearch.trim() || undefined,
    fromDate,
    toDate,
    page,
    limit,
    expenseAccountIds: expenseAccountIdsParam,
    paymentAccountIds: paymentAccountIdsParam,
    sortBy,
    sortDir,
  });
  const createMutation = useCreateExpense(companyId);
  const updateMutation = useUpdateExpense(companyId, editingId);
  const canView = canViewEntity(permissions, "expenses");
  const canManage = canManageEntity(permissions, "expenses");
  const displayCurrency = getCompanyBaseCurrency(company);

  const payFromOptions = useMemo(
    () => buildPayFromOptions(accountsQuery.data ?? [], bankAccountsQuery.data ?? []),
    [accountsQuery.data, bankAccountsQuery.data],
  );
  const defaultPayFrom =
    mappingQuery.data?.defaultExpensePayment?.accountId || mappingQuery.data?.cashBank?.accountId || "";

  useEffect(() => {
    if (!defaultPayFrom) return;
    setAddDraft((current) =>
      current.paymentAccountId ? current : { ...current, paymentAccountId: defaultPayFrom },
    );
  }, [defaultPayFrom]);

  if (!canView) {
    return (
      <ErrorState
        title="Expenses access restricted"
        description="Your current company membership does not include expense access."
      />
    );
  }

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setDraft({
      paymentDate: String(expense.paymentDate).slice(0, 10),
      expenseAccountId: expense.expenseAccountId,
      paymentAccountId: expense.paymentAccountId,
      amount: expense.amount,
      description: expense.description,
      referenceNumber: expense.referenceNumber ?? "",
      updateNote: "",
    });
  };

  const payFromSelect = (value: string, onChange: (value: string) => void) => (
    <Select className="min-w-[180px]" onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">Select</option>
      {payFromOptions.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </Select>
  );

  const categorySelect = (value: string, onChange: (value: string) => void) => (
    <ExpenseCategorySelect
      accounts={accountsQuery.data ?? []}
      companyId={companyId}
      onChange={onChange}
      value={value}
    />
  );

  const items = expensesQuery.data?.items ?? [];
  const pagination = expensesQuery.data?.pagination;
  const filteredTotalAmount = expensesQuery.data?.filteredTotalAmount ?? "0.00";

  const handleSort = (key: string) => {
    const next = toggleListSort(sortBy, sortDir, key);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
    setPage(1);
  };

  const expenseHeaders: Array<{ label: string; sortKey?: string; className?: string }> = [
    { label: "Date", sortKey: "paymentDate" },
    { label: "Category" },
    { label: "Pay from" },
    { label: "Amount", sortKey: "amount", className: "text-right" },
    { label: "Description" },
    { label: "Created", sortKey: "createdAt" },
    { label: "Updated" },
    { label: "" },
  ];

  return (
    <EntityListPage
      content={
        expensesQuery.error ? (
          <ErrorState title="Unable to load expenses" description={expensesQuery.error.message} />
        ) : (
          <div className="surface overflow-hidden">
            {createMutation.error ? <Alert title={createMutation.error.message} variant="destructive" /> : null}
            {updateMutation.error ? <Alert title={updateMutation.error.message} variant="destructive" /> : null}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <p className="text-sm font-medium">
                Total (filtered): {formatCurrency(filteredTotalAmount, displayCurrency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Showing {items.length} of {pagination?.total ?? items.length} records
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-secondary/60">
                  <tr>
                    {expenseHeaders.map((header) => (
                      <th
                        className={`px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground ${header.className ?? ""}`}
                        key={header.label || "actions"}
                      >
                        {header.sortKey ? (
                          <SortableTableHeader
                            activeSortKey={sortBy}
                            className={header.className}
                            label={header.label}
                            onSort={handleSort}
                            sortDir={sortDir}
                            sortKey={header.sortKey}
                          />
                        ) : (
                          header.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((expense) => {
                    const editing = editingId === expense.id;
                    return (
                      <tr className="border-t" key={expense.id}>
                        <td className="px-3 py-2">
                          {editing ? (
                            <Input
                              type="date"
                              value={draft.paymentDate}
                              onChange={(event) => setDraft({ ...draft, paymentDate: event.target.value })}
                            />
                          ) : (
                            formatDate(expense.paymentDate)
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editing
                            ? categorySelect(draft.expenseAccountId, (value) =>
                                setDraft({ ...draft, expenseAccountId: value }),
                              )
                            : expense.expenseAccountName || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {editing
                            ? payFromSelect(draft.paymentAccountId, (value) =>
                                setDraft({ ...draft, paymentAccountId: value }),
                              )
                            : expense.paymentAccountName || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {editing ? (
                            <Input
                              inputMode="decimal"
                              value={draft.amount}
                              onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
                            />
                          ) : (
                            formatCurrency(expense.amount, expense.currencyCode ?? displayCurrency)
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editing ? (
                            <div className="space-y-2">
                              <Input
                                value={draft.description}
                                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                              />
                              {notesRequired || draft.updateNote ? (
                                <Input
                                  placeholder={notesRequired ? "Update notes (required)" : "Update notes"}
                                  value={draft.updateNote}
                                  onChange={(event) => setDraft({ ...draft, updateNote: event.target.value })}
                                />
                              ) : null}
                            </div>
                          ) : (
                            <div>
                              <Link
                                className="font-medium text-primary"
                                to={`/app/company/${companyId}/expenses/${expense.id}`}
                              >
                                {expense.description}
                              </Link>
                              {expense.lastUpdateNote ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Last note: {expense.lastUpdateNote}
                                </p>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(expense.createdAt)}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(expense.updatedAt)}</td>
                        <td className="px-3 py-2">
                          {canManage && editing ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                isLoading={updateMutation.isPending}
                                onClick={async () => {
                                  await updateMutation.mutateAsync({
                                    paymentDate: draft.paymentDate,
                                    expenseAccountId: draft.expenseAccountId,
                                    paymentAccountId: draft.paymentAccountId,
                                    amount: toMoneyString(draft.amount),
                                    description: draft.description,
                                    referenceNumber: draft.referenceNumber || null,
                                    updateNote: draft.updateNote || undefined,
                                  });
                                  setEditingId(null);
                                }}
                                type="button"
                              >
                                Save
                              </Button>
                              <Button onClick={() => setEditingId(null)} size="sm" type="button" variant="ghost">
                                Cancel
                              </Button>
                            </div>
                          ) : canManage ? (
                            <Button onClick={() => startEdit(expense)} size="sm" type="button" variant="ghost">
                              Edit
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  {canManage ? (
                    <tr className="border-t bg-secondary/20">
                      <td className="px-3 py-2">
                        <Input
                          type="date"
                          value={addDraft.paymentDate}
                          onChange={(event) => setAddDraft({ ...addDraft, paymentDate: event.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {categorySelect(addDraft.expenseAccountId, (value) =>
                          setAddDraft({ ...addDraft, expenseAccountId: value }),
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {payFromSelect(addDraft.paymentAccountId, (value) =>
                          setAddDraft({ ...addDraft, paymentAccountId: value }),
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          inputMode="decimal"
                          placeholder="0.00"
                          value={addDraft.amount}
                          onChange={(event) => setAddDraft({ ...addDraft, amount: event.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2" colSpan={3}>
                        <Input
                          placeholder="Description"
                          value={addDraft.description}
                          onChange={(event) => setAddDraft({ ...addDraft, description: event.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          isLoading={createMutation.isPending}
                          onClick={async () => {
                            await createMutation.mutateAsync({
                              paymentDate: addDraft.paymentDate,
                              paymentAccountId: addDraft.paymentAccountId,
                              expenseAccountId: addDraft.expenseAccountId,
                              amount: toMoneyString(addDraft.amount),
                              description: addDraft.description,
                            });
                            setAddDraft(emptyDraft(defaultPayFrom));
                          }}
                          type="button"
                        >
                          Add expense
                        </Button>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {pagination && pagination.totalPages > 1 ? (
              <div className="flex justify-end gap-2 border-t px-4 py-3">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Previous
                </Button>
                <Button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        )
      }
      description="Add and edit expenses in the table. Pay-from defaults to your expense payment account."
      eyebrow="Purchases"
      title="Expenses"
      toolbar={
        <FilterBar>
          <DateRangeToolbar
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={(value) => {
              setFromDate(value);
              setPage(1);
            }}
            onToDateChange={(value) => {
              setToDate(value);
              setPage(1);
            }}
          />
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search description or reference"
            value={search}
          />
          <ExpenseCategoryFilter
            accounts={accountsQuery.data ?? []}
            includedIds={includedCategoryIds}
            onChange={(next) => {
              setIncludedCategoryIds(next);
              setPage(1);
            }}
          />
          <ExpensePayFromFilter
            includedIds={includedPayFromIds}
            onChange={(next) => {
              setIncludedPayFromIds(next);
              setPage(1);
            }}
            options={payFromOptions}
          />
        </FilterBar>
      }
    />
  );
}
