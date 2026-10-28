import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { Button } from "@/components/ui/button";
import { CheckboxMultiFilter } from "@/components/shared/checkbox-multi-filter";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar, FilterField } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { toggleListSort } from "@/components/shared/sortable-table-header";
import { TableColumnPicker } from "@/components/shared/table-column-picker";
import type { ListSortDir } from "@/features/shared/types/common";
import { lastNDaysRange } from "@/lib/utils/date-range";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canShowFbr } from "@/features/compliance/utils/compliance-access";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import type { Bill } from "@/features/bills/types/bill.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import {
  AuthorityTaxDialog,
  type AuthorityTaxDialogKind,
} from "@/features/tax/components/authority-tax-dialog";
import {
  useClaimBillPurchaseTax,
  useSettleBillIncomeWht,
} from "@/features/tax/hooks/use-tax";
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
  { id: "taxAmount", label: "Tax amount", defaultVisible: true },
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
  { id: "taxActions", label: "Tax actions", defaultVisible: true },
];

function moneyNum(value?: string | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const BILL_STATUS_FILTER_OPTIONS = [
  "DRAFT",
  "OPEN",
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
  "CANCELLED",
].map((id) => ({
  id,
  label: id === "UNPAID" ? "Unpaid" : id.replace(/_/g, " "),
}));

export function BillsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [includedStatuses, setIncludedStatuses] = useState<Set<string> | null>(null);
  const [includedVendorIds, setIncludedVendorIds] = useState<Set<string> | null>(null);
  const defaultRange = lastNDaysRange(30);
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const [sortBy, setSortBy] = useState("issueDate");
  const [sortDir, setSortDir] = useState<ListSortDir>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const deferredSearch = useDeferredValue(search);
  const vendorsQuery = useVendorOptions(companyId);
  const accountsQuery = useAccountOptions(companyId);
  const claimPurchaseTaxMutation = useClaimBillPurchaseTax(companyId);
  const settleIncomeWhtMutation = useSettleBillIncomeWht(companyId);
  const billsQuery = useBillsPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    statuses: includedStatuses === null ? undefined : [...includedStatuses].join(","),
    vendorIds: includedVendorIds === null ? undefined : [...includedVendorIds].join(","),
    fromDate,
    toDate,
    sortBy,
    sortDir,
    page,
    limit,
  });
  const canView = canViewEntity(permissions, "bills");
  const canManage = canManageEntity(permissions, "bills");
  const canManageTax = canManageEntity(permissions, "tax");
  const baseCurrency = getCompanyBaseCurrency(company);
  const showFbr = canShowFbr(company);
  const [dialogKind, setDialogKind] = useState<AuthorityTaxDialogKind | null>(null);
  const [dialogBill, setDialogBill] = useState<Bill | null>(null);

  const bankAccounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (account) =>
          account.type === "BANK" ||
          (account.type === "ASSET" && (account.subtype ?? "").toLowerCase() === "cash"),
      ),
    [accountsQuery.data],
  );

  const viewColumns = useMemo(() => {
    let columns = showFbr
      ? BILL_VIEW_COLUMNS
      : BILL_VIEW_COLUMNS.filter((column) => column.id !== "fbrTaxReported");
    if (!canManageTax) {
      columns = columns.filter((column) => column.id !== "taxActions");
    }
    return columns;
  }, [canManageTax, showFbr]);

  const tableView = useTableViewPreferences("bills", companyId, user?.id, viewColumns);

  if (!canView) {
    return (
      <ErrorState
        title="Bills access restricted"
        description="Your current company membership does not include bill access."
      />
    );
  }

  const handleSort = (key: string) => {
    const next = toggleListSort(sortBy, sortDir, key);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
    setPage(1);
  };

  const columnSums = billsQuery.data?.columnSums;
  const headerSum = (key: string) => {
    const value = columnSums?.[key];
    if (value == null || value === "") return undefined;
    return formatCurrency(value, baseCurrency);
  };

  const columnMap: Record<string, DataTableColumn<Bill>> = {
    number: {
      key: "number",
      sortable: true,
      sortKey: "billNumber",
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
      sortable: true,
      header: "Issue Date",
      render: (bill) => formatDate(bill.issueDate),
    },
    dueDate: {
      key: "dueDate",
      sortable: true,
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
      headerExtra: headerSum("amountExclusiveTax"),
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
    taxAmount: {
      key: "taxAmount",
      header: "Tax amount",
      headerExtra: headerSum("taxAmount"),
      className: "text-right",
      render: (bill) =>
        formatCurrency(bill.taxAmount ?? bill.totals?.taxTotal ?? "0", bill.currencyCode ?? baseCurrency),
    },
    amountInclusiveTax: {
      key: "amountInclusiveTax",
      header: "Amount inclusive tax",
      headerExtra: headerSum("amountInclusiveTax"),
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
      headerExtra: headerSum("incomeWhtAmount"),
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
      headerExtra: headerSum("salesTaxWhtAmount"),
      className: "text-right",
      render: (bill) =>
        bill.salesTaxWhtEnabled
          ? formatCurrency(bill.salesTaxWhtAmount ?? "0", bill.currencyCode ?? baseCurrency)
          : "—",
    },
    amountInclusiveWht: {
      key: "amountInclusiveWht",
      header: "Amount including WHT",
      headerExtra: headerSum("amountInclusiveWht"),
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
      headerExtra: headerSum("totalPayable"),
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
      headerExtra: headerSum("amountPaid"),
      className: "text-right",
      render: (bill) =>
        formatCurrency(bill.amountPaid ?? "0", bill.currencyCode ?? baseCurrency),
    },
    total: {
      key: "total",
      sortable: true,
      header: "Total",
      headerExtra: headerSum("total"),
      className: "text-right",
      render: (bill) =>
        formatCurrency(
          bill.total ?? bill.totals?.total ?? "0",
          bill.currencyCode ?? baseCurrency,
        ),
    },
    amountDue: {
      key: "amountDue",
      sortable: true,
      header: "Amount Due",
      headerExtra: headerSum("amountDue"),
      className: "text-right",
      render: (bill) =>
        formatCurrency(bill.amountDue ?? "0", bill.currencyCode ?? baseCurrency),
    },
    taxActions: {
      key: "taxActions",
      header: "Tax",
      render: (bill) => {
        const status = String(bill.status ?? "");
        const issued = !["DRAFT", "VOID", "CANCELLED"].includes(status);
        const purchaseTaxOutstanding = Math.max(
          0,
          moneyNum(bill.taxAmount) - moneyNum(bill.salesTaxAuthoritySettledAmount),
        );
        const incomeWhtOutstanding = Math.max(
          0,
          moneyNum(bill.incomeWhtAmount) - moneyNum(bill.incomeWhtAuthoritySettledAmount),
        );
        const heldBy = bill.incomeWhtHeldBy ?? "COMPANY";
        if (!issued || (!purchaseTaxOutstanding && !incomeWhtOutstanding)) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            {purchaseTaxOutstanding > 0 ? (
              <Button
                onClick={() => {
                  setDialogBill(bill);
                  setDialogKind("bill-purchase-tax");
                  claimPurchaseTaxMutation.reset();
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                Claim sales tax
              </Button>
            ) : null}
            {incomeWhtOutstanding > 0 ? (
              <Button
                onClick={() => {
                  setDialogBill(bill);
                  setDialogKind("bill-income-wht");
                  settleIncomeWhtMutation.reset();
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                {heldBy === "COMPANY" ? "Pay income WHT" : "Claim income WHT"}
              </Button>
            ) : null}
          </div>
        );
      },
    },
  };

  const columns = tableView.visibleColumnIds
    .map((id) => columnMap[id])
    .filter((column): column is DataTableColumn<Bill> => Boolean(column));

  return (
    <>
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
            onSort={handleSort}
            sortDir={sortDir}
            sortKey={sortBy}
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
          <DateRangeToolbar
            fromDate={fromDate}
            onFromDateChange={(value) => {
              setFromDate(value);
              setPage(1);
            }}
            onToDateChange={(value) => {
              setToDate(value);
              setPage(1);
            }}
            toDate={toDate}
          />
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
            <CheckboxMultiFilter
              includedIds={includedStatuses}
              label="Status"
              onChange={(next) => {
                setIncludedStatuses(next);
                setPage(1);
              }}
              options={BILL_STATUS_FILTER_OPTIONS}
            />
          </FilterField>
          <FilterField className="sm:min-w-[220px]">
            <CheckboxMultiFilter
              includedIds={includedVendorIds}
              label="Vendors"
              minWidth={280}
              onChange={(next) => {
                setIncludedVendorIds(next);
                setPage(1);
              }}
              options={(vendorsQuery.data ?? []).map((vendor) => ({
                id: vendor.id,
                label: vendor.displayName,
              }))}
            />
          </FilterField>
        </FilterBar>
      }
    />
    <AuthorityTaxDialog
      amount={
        dialogKind === "bill-purchase-tax"
          ? Math.max(
              0,
              moneyNum(dialogBill?.taxAmount) - moneyNum(dialogBill?.salesTaxAuthoritySettledAmount),
            )
          : Math.max(
              0,
              moneyNum(dialogBill?.incomeWhtAmount) -
                moneyNum(dialogBill?.incomeWhtAuthoritySettledAmount),
            )
      }
      amountLabel={
        dialogKind === "bill-purchase-tax" ? "Purchase tax to claim" : "Income WHT to settle"
      }
      bankAccounts={bankAccounts}
      currency={dialogBill?.currencyCode ?? baseCurrency}
      description={
        dialogKind === "bill-purchase-tax"
          ? "Moves purchase tax recoverable into sales tax carry forward (no cash)."
          : dialogBill?.incomeWhtHeldBy === "COUNTERPARTY"
            ? "Moves income WHT receivable into Income WHT Claimed (no cash)."
            : "Pays company-held income WHT from cash/bank."
      }
      errorMessage={
        (dialogKind === "bill-purchase-tax"
          ? claimPurchaseTaxMutation.error?.message
          : settleIncomeWhtMutation.error?.message) ?? null
      }
      isPending={claimPurchaseTaxMutation.isPending || settleIncomeWhtMutation.isPending}
      kind={dialogKind}
      needsBank={
        dialogKind === "bill-income-wht" && (dialogBill?.incomeWhtHeldBy ?? "COMPANY") === "COMPANY"
      }
      needsPercent={false}
      onClose={() => {
        setDialogKind(null);
        setDialogBill(null);
      }}
      onConfirm={async (values) => {
        if (!dialogBill || !dialogKind) return;
        if (dialogKind === "bill-purchase-tax") {
          await claimPurchaseTaxMutation.mutateAsync({
            billId: dialogBill.id,
            paymentDate: values.paymentDate,
          });
        } else {
          await settleIncomeWhtMutation.mutateAsync({
            billId: dialogBill.id,
            paymentDate: values.paymentDate,
            bankAccountId: values.bankAccountId,
          });
        }
        setDialogKind(null);
        setDialogBill(null);
      }}
      open={Boolean(dialogKind && dialogBill)}
      savedPercent={null}
      title={
        dialogKind === "bill-purchase-tax"
          ? `Claim sales tax — ${dialogBill?.billNumber ?? ""}`
          : (dialogBill?.incomeWhtHeldBy ?? "COMPANY") === "COMPANY"
            ? `Pay income WHT — ${dialogBill?.billNumber ?? ""}`
            : `Claim income WHT — ${dialogBill?.billNumber ?? ""}`
      }
    />
    </>
  );
}
