import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { useExpensesPaginated } from "@/features/expenses/hooks/use-expenses";
import type { Expense } from "@/features/expenses/types/expense.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function ExpensesPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const deferredSearch = useDeferredValue(search);
  const vendorsQuery = useVendorOptions(companyId);
  const expensesQuery = useExpensesPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    vendorId: vendorId || undefined,
    page,
    limit,
  });
  const canView = canViewEntity(permissions, "expenses");
  const canManage = canManageEntity(permissions, "expenses");
  const displayCurrency = getCompanyBaseCurrency(company);

  if (!canView) {
    return (
      <ErrorState
        title="Expenses access restricted"
        description="Your current company membership does not include expense access."
      />
    );
  }

  const columns: DataTableColumn<Expense>[] = [
    { key: "paymentDate", header: "Date", render: (expense) => formatDate(expense.paymentDate) },
    { key: "vendor", header: "Vendor", render: (expense) => expense.vendorName || "-" },
    {
      key: "category",
      header: "Category",
      render: (expense) => expense.expenseAccountName || "-",
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (expense) => formatCurrency(Number(expense.amount), expense.currencyCode ?? displayCurrency),
    },
    {
      key: "description",
      header: "Description",
      render: (expense) => (
        <Link className="font-medium text-primary" to={`/app/company/${companyId}/expenses/${expense.id}`}>
          {expense.description}
        </Link>
      ),
    },
  ];

  return (
    <EntityListPage
      content={
        expensesQuery.error ? (
          <ErrorState title="Unable to load expenses" description={expensesQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={expensesQuery.data?.items ?? []}
            emptyDescription="Record cash expenses that post directly to your ledger."
            emptyTitle="No expenses yet"
            getRowKey={(expense) => expense.id}
            isLoading={expensesQuery.isLoading}
            pagination={
              expensesQuery.data
                ? {
                    page: expensesQuery.data.pagination.page,
                    totalPages: expensesQuery.data.pagination.totalPages,
                    total: expensesQuery.data.pagination.total,
                    limit: expensesQuery.data.pagination.limit,
                    onPageChange: setPage,
                    onLimitChange: setLimit,
                  }
                : undefined
            }
          />
        )
      }
      description="Track direct cash and bank expenses with immediate journal posting."
      eyebrow="Purchases"
      headerActions={
        canManage ? (
          <Button asChild>
            <Link to={`/app/company/${companyId}/expenses/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New expense
            </Link>
          </Button>
        ) : null
      }
      title="Expenses"
      toolbar={
        <FilterBar>
          <SearchInput onChange={setSearch} placeholder="Search description or reference" value={search} />
          <Select className="min-w-[220px]" onChange={(e) => setVendorId(e.target.value)} value={vendorId}>
            <option value="">All vendors</option>
            {(vendorsQuery.data ?? []).map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.displayName}
              </option>
            ))}
          </Select>
        </FilterBar>
      }
    />
  );
}
