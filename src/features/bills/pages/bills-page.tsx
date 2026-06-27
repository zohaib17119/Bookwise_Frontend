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
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useVendors, useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import type { Bill } from "@/features/bills/types/bill.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useBillsPaginated } from "@/features/bills/hooks/use-bills";

export function BillsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const deferredSearch = useDeferredValue(search);
  const vendorsQuery = useVendorOptions(companyId);
  const billsQuery = useBillsPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    status: status || undefined,
    vendorId: vendorId || undefined,
    page,
    limit,
  });
  const canView = canViewEntity(permissions, "bills");
  const canManage = canManageEntity(permissions, "bills");

  if (!canView) {
    return <ErrorState title="Bills access restricted" description="Your current company membership does not include bill access." />;
  }

  const columns: DataTableColumn<Bill>[] = [
    {
      key: "number",
      header: "Bill",
      render: (bill) => (
        <div>
          <Link className="font-medium text-primary" to={`/app/company/${companyId}/bills/${bill.id}`}>
            {bill.billNumber || "Draft bill"}
          </Link>
          <p className="text-xs text-muted-foreground">Ref: {bill.referenceNumber || "-"}</p>
        </div>
      ),
    },
    { key: "vendor", header: "Vendor", render: (bill) => bill.vendorName || "-" },
    { key: "issueDate", header: "Issue Date", render: (bill) => formatDate(bill.issueDate) },
    { key: "dueDate", header: "Due Date", render: (bill) => formatDate(bill.dueDate) },
    { key: "status", header: "Status", render: (bill) => <DocumentStatusBadge status={bill.status} /> },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (bill) =>
        formatCurrency(
          Number(bill.total ?? bill.totals?.total ?? 0),
          bill.currencyCode ?? company?.baseCurrencyCode ?? company?.currencyCode ?? "USD",
        ),
    },
    {
      key: "amountDue",
      header: "Amount Due",
      className: "text-right",
      render: (bill) =>
        formatCurrency(Number(bill.amountDue ?? 0), bill.currencyCode ?? company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
  ];

  return (
    <EntityListPage
      content={
        billsQuery.error ? (
          <ErrorState title="Unable to load bills" description={billsQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={billsQuery.data?.items ?? []}
            emptyDescription="Create bills to track vendor obligations and payable balances."
            emptyTitle="No bills yet"
            getRowKey={(bill) => bill.id}
            isLoading={billsQuery.isLoading}
            pagination={
              billsQuery.data
                ? {
                    page: billsQuery.data.pagination.page,
                    totalPages: billsQuery.data.pagination.totalPages,
                    total: billsQuery.data.pagination.total,
                    limit: billsQuery.data.pagination.limit,
                    onPageChange: setPage,
                    onLimitChange: (next) => {
                      setLimit(next);
                      setPage(1);
                    },
                  }
                : undefined
            }
          />
        )
      }
      description="Manage vendor bills and outstanding payable balances."
      eyebrow="Payables"
      headerActions={
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/bills/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New bill
          </Link>
        </Button>
      }
      title="Bills"
      toolbar={
        <FilterBar>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search bill number or reference"
            value={search}
          />
          <Select
            className="min-w-[180px]"
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            value={status}
          >
            <option value="">All statuses</option>
            {["DRAFT", "OPEN", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"].map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Select
            className="min-w-[220px]"
            onChange={(e) => {
              setVendorId(e.target.value);
              setPage(1);
            }}
            value={vendorId}
          >
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
