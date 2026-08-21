import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar, FilterField } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { TableColumnPicker } from "@/components/shared/table-column-picker";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canShowFbr } from "@/features/compliance/utils/compliance-access";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import type { Bill } from "@/features/bills/types/bill.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useBillsPaginated } from "@/features/bills/hooks/use-bills";
import {
  useTableViewPreferences,
  type TableViewColumnDef,
} from "@/hooks/use-table-view-preferences";

const BILL_VIEW_COLUMNS: TableViewColumnDef[] = [
  { id: "number", label: "Bill", defaultVisible: true },
  { id: "vendor", label: "Vendor", defaultVisible: true },
  { id: "issueDate", label: "Issue date", defaultVisible: true },
  { id: "dueDate", label: "Due date", defaultVisible: false },
  { id: "payment", label: "Payment", defaultVisible: true },
  { id: "goods", label: "Goods", defaultVisible: true },
  { id: "fbrTaxReported", label: "FBR / Tax reported", defaultVisible: true },
  { id: "amountExclusiveTax", label: "Amount exclusive tax", defaultVisible: false },
  { id: "taxPercent", label: "Tax %", defaultVisible: false },
  { id: "amountInclusiveTax", label: "Amount inclusive tax", defaultVisible: false },
  { id: "incomeWhtPercent", label: "Income WHT %", defaultVisible: false },
  { id: "incomeWhtAmount", label: "Income WHT amount", defaultVisible: false },
  { id: "salesTaxWhtPercent", label: "Sales tax WHT %", defaultVisible: false },
  { id: "salesTaxWhtAmount", label: "Sales tax WHT amount", defaultVisible: false },
  { id: "amountInclusiveWht", label: "Amount including WHT", defaultVisible: false },
  { id: "totalPayable", label: "Total payable", defaultVisible: false },
  { id: "amountPaid", label: "Amount paid", defaultVisible: false },
  { id: "total", label: "Total", defaultVisible: true },
  { id: "amountDue", label: "Amount due", defaultVisible: true },
];

export function BillsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const user = useAuthStore((state) => state.user);
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
  const baseCurrency = getCompanyBaseCurrency(company);
  const showFbr = canShowFbr(company);

  const viewColumns = useMemo(
    () =>
      showFbr
        ? BILL_VIEW_COLUMNS
        : BILL_VIEW_COLUMNS.filter((column) => column.id !== "fbrTaxReported"),
    [showFbr],
  );

  const tableView = useTableViewPreferences("bills", companyId, user?.id, viewColumns);

  if (!canView) {
    return (
      <ErrorState
        title="Bills access restricted"
        description="Your current company membership does not include bill access."
      />
    );
  }

  const columnMap: Record<string, DataTableColumn<Bill>> = {
    number: {
      key: "number",
      header: "Bill",
      render: (bill) => (
        <div>
          <Link
            className="font-medium text-primary"
            to={`/app/company/${companyId}/bills/${bill.id}`}
          >
            {bill.billNumber || "Draft bill"}
          </Link>
          <p className="text-xs text-muted-foreground">Ref: {bill.referenceNumber || "-"}</p>
        </div>
      ),
    },
    vendor: { key: "vendor", header: "Vendor", render: (bill) => bill.vendorName || "-" },
    issueDate: {
      key: "issueDate",
      header: "Issue Date",
      render: (bill) => formatDate(bill.issueDate),
    },
    dueDate: {
      key: "dueDate",
      header: "Due Date",
      render: (bill) => formatDate(bill.dueDate),
    },
    payment: {
      key: "payment",
      header: "Payment",
      render: (bill) => (
        <DocumentStatusBadge
          status={bill.paymentStatus === "UNPAID" ? "UNPAID" : bill.status}
        />
      ),
    },
    goods: {
      key: "goods",
      header: "Goods",
      render: (bill) => (
        <DocumentStatusBadge status={bill.goodsStatus ?? "NOT_APPLICABLE"} />
      ),
    },
    fbrTaxReported: {
      key: "fbrTaxReported",
      header: "FBR / Tax reported",
      render: (bill) => (
        <DocumentStatusBadge status={bill.complianceStatus ?? "NOT_APPLICABLE"} />
      ),
    },
    amountExclusiveTax: {
      key: "amountExclusiveTax",
      header: "Amount exclusive tax",
      className: "text-right",
      render: (bill) =>
        formatCurrency(bill.subtotal ?? bill.totals?.subtotal ?? "0", bill.currencyCode ?? baseCurrency),
    },
    taxPercent: {
      key: "taxPercent",
      header: "Tax %",
      className: "text-right",
      render: (bill) => bill.taxRateDisplay ?? "—",
    },
    amountInclusiveTax: {
      key: "amountInclusiveTax",
      header: "Amount inclusive tax",
      className: "text-right",
      render: (bill) =>
        formatCurrency(bill.total ?? bill.totals?.total ?? "0", bill.currencyCode ?? baseCurrency),
    },
    incomeWhtPercent: {
      key: "incomeWhtPercent",
      header: "Income WHT %",
      className: "text-right",
      render: (bill) =>
        bill.incomeWhtEnabled && bill.incomeWhtRate != null
          ? `${Number(bill.incomeWhtRate)}%`
          : "—",
    },
    incomeWhtAmount: {
      key: "incomeWhtAmount",
      header: "Income WHT amount",
      className: "text-right",
      render: (bill) =>
        bill.incomeWhtEnabled
          ? formatCurrency(bill.incomeWhtAmount ?? "0", bill.currencyCode ?? baseCurrency)
          : "—",
    },
    salesTaxWhtPercent: {
      key: "salesTaxWhtPercent",
      header: "Sales tax WHT %",
      className: "text-right",
      render: (bill) =>
        bill.salesTaxWhtEnabled && bill.salesTaxWhtRate != null
          ? `${Number(bill.salesTaxWhtRate)}%`
          : "—",
    },
    salesTaxWhtAmount: {
      key: "salesTaxWhtAmount",
      header: "Sales tax WHT amount",
      className: "text-right",
      render: (bill) =>
        bill.salesTaxWhtEnabled
          ? formatCurrency(bill.salesTaxWhtAmount ?? "0", bill.currencyCode ?? baseCurrency)
          : "—",
    },
    amountInclusiveWht: {
      key: "amountInclusiveWht",
      header: "Amount including WHT",
      className: "text-right",
      render: (bill) =>
        formatCurrency(
          bill.whtEnabled || bill.incomeWhtEnabled || bill.salesTaxWhtEnabled
            ? (bill.netSettlementAmount ?? bill.totals?.netSettlementAmount ?? bill.total ?? "0")
            : (bill.total ?? bill.totals?.total ?? "0"),
          bill.currencyCode ?? baseCurrency,
        ),
    },
    totalPayable: {
      key: "totalPayable",
      header: "Total payable",
      className: "text-right",
      render: (bill) =>
        formatCurrency(
          bill.netSettlementAmount ?? bill.totals?.netSettlementAmount ?? bill.total ?? "0",
          bill.currencyCode ?? baseCurrency,
        ),
    },
    amountPaid: {
      key: "amountPaid",
      header: "Amount paid",
      className: "text-right",
      render: (bill) =>
        formatCurrency(bill.amountPaid ?? "0", bill.currencyCode ?? baseCurrency),
    },
    total: {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (bill) =>
        formatCurrency(
          bill.total ?? bill.totals?.total ?? "0",
          bill.currencyCode ?? baseCurrency,
        ),
    },
    amountDue: {
      key: "amountDue",
      header: "Amount Due",
      className: "text-right",
      render: (bill) =>
        formatCurrency(bill.amountDue ?? "0", bill.currencyCode ?? baseCurrency),
    },
  };

  const columns = tableView.visibleColumnIds
    .map((id) => columnMap[id])
    .filter((column): column is DataTableColumn<Bill> => Boolean(column));

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
        <div className="flex flex-wrap items-center gap-2">
          <TableColumnPicker
            columns={viewColumns}
            hidden={tableView.hidden}
            onMove={tableView.moveColumn}
            onReset={tableView.reset}
            onToggle={tableView.toggleVisible}
            order={tableView.order}
          />
          <Button asChild disabled={!canManage}>
            <Link to={`/app/company/${companyId}/bills/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New bill
            </Link>
          </Button>
        </div>
      }
      title="Bills"
      toolbar={
        <FilterBar>
          <FilterField className="md:min-w-[240px] md:flex-1">
            <SearchInput
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search bill number or reference"
              value={search}
            />
          </FilterField>
          <FilterField className="sm:min-w-[180px]">
            <Select
              className="w-full"
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              value={status}
            >
              <option value="">All statuses</option>
              {["DRAFT", "OPEN", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"].map(
                (option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ),
              )}
            </Select>
          </FilterField>
          <FilterField className="sm:min-w-[220px]">
            <Select
              className="w-full"
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
          </FilterField>
        </FilterBar>
      }
    />
  );
}
