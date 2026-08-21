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
import { canShowFbr, canUseZatcaReporting } from "@/features/compliance/utils/compliance-access";
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import { useInvoicesPaginated } from "@/features/invoices/hooks/use-invoices";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  useTableViewPreferences,
  type TableViewColumnDef,
} from "@/hooks/use-table-view-preferences";

const INVOICE_VIEW_COLUMNS: TableViewColumnDef[] = [
  { id: "number", label: "Invoice", defaultVisible: true },
  { id: "customer", label: "Customer", defaultVisible: true },
  { id: "issueDate", label: "Issue date", defaultVisible: true },
  { id: "dueDate", label: "Due date", defaultVisible: false },
  { id: "payment", label: "Payment", defaultVisible: true },
  { id: "zatca", label: "ZATCA", defaultVisible: true },
  { id: "fbrTaxReported", label: "FBR / Tax reported", defaultVisible: true },
  { id: "amountExclusiveTax", label: "Amount exclusive tax", defaultVisible: false },
  { id: "taxPercent", label: "Tax %", defaultVisible: false },
  { id: "amountInclusiveTax", label: "Amount inclusive tax", defaultVisible: false },
  { id: "incomeWhtPercent", label: "Income WHT %", defaultVisible: false },
  { id: "incomeWhtAmount", label: "Income WHT amount", defaultVisible: false },
  { id: "salesTaxWhtPercent", label: "Sales tax WHT %", defaultVisible: false },
  { id: "salesTaxWhtAmount", label: "Sales tax WHT amount", defaultVisible: false },
  { id: "amountInclusiveWht", label: "Amount including WHT", defaultVisible: false },
  { id: "totalReceivable", label: "Total receivable", defaultVisible: false },
  { id: "amountPaid", label: "Amount paid", defaultVisible: false },
  { id: "total", label: "Total", defaultVisible: true },
  { id: "amountDue", label: "Amount due", defaultVisible: true },
];

export function InvoicesPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const user = useAuthStore((state) => state.user);
  const showZatca = canUseZatcaReporting(company);
  const showFbr = canShowFbr(company);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const deferredSearch = useDeferredValue(search);
  const customersQuery = useCustomerOptions(companyId);
  const invoicesQuery = useInvoicesPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    status: status || undefined,
    customerId: customerId || undefined,
    page,
    limit,
  });
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");
  const baseCurrency = getCompanyBaseCurrency(company);

  const viewColumns = useMemo(() => {
    let columns = INVOICE_VIEW_COLUMNS;
    if (!showZatca) {
      columns = columns.filter((column) => column.id !== "zatca");
    }
    if (!showFbr) {
      columns = columns.filter((column) => column.id !== "fbrTaxReported");
    }
    return columns;
  }, [showFbr, showZatca]);

  const tableView = useTableViewPreferences("invoices", companyId, user?.id, viewColumns);

  if (!canView) {
    return (
      <ErrorState
        title="Invoices access restricted"
        description="Your current company membership does not include invoice access."
      />
    );
  }

  const columnMap: Record<string, DataTableColumn<Invoice>> = {
    number: {
      key: "number",
      header: "Invoice",
      render: (invoice) => (
        <div>
          <Link
            className="font-medium text-primary"
            to={`/app/company/${companyId}/invoices/${invoice.id}`}
          >
            {invoice.invoiceNumber || "Draft invoice"}
          </Link>
          <p className="text-xs text-muted-foreground">
            Ref: {invoice.referenceNumber || "-"}
          </p>
        </div>
      ),
    },
    customer: {
      key: "customer",
      header: "Customer",
      render: (invoice) => invoice.customerName || "-",
    },
    issueDate: {
      key: "issueDate",
      header: "Issue Date",
      render: (invoice) => formatDate(invoice.issueDate),
    },
    dueDate: {
      key: "dueDate",
      header: "Due Date",
      render: (invoice) => formatDate(invoice.dueDate),
    },
    payment: {
      key: "payment",
      header: "Payment",
      render: (invoice) => {
        const status = invoice.status ?? "";
        if (status === "PAID") return <DocumentStatusBadge status="PAID" />;
        if (status === "PARTIALLY_PAID") return <DocumentStatusBadge status="PARTIALLY_PAID" />;
        if (status === "ISSUED" || status === "OVERDUE") {
          return (
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] text-amber-800">
              Unpaid
            </span>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    zatca: {
      key: "zatca",
      header: "ZATCA",
      render: (invoice) => (
        <DocumentStatusBadge status={invoice.complianceStatus ?? "NOT_APPLICABLE"} />
      ),
    },
    fbrTaxReported: {
      key: "fbrTaxReported",
      header: "FBR / Tax reported",
      render: (invoice) => (
        <DocumentStatusBadge status={invoice.complianceStatus ?? "NOT_APPLICABLE"} />
      ),
    },
    amountExclusiveTax: {
      key: "amountExclusiveTax",
      header: "Amount exclusive tax",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(
          invoice.subtotal ?? invoice.totals?.subtotal ?? "0",
          invoice.currencyCode ?? baseCurrency,
        ),
    },
    taxPercent: {
      key: "taxPercent",
      header: "Tax %",
      className: "text-right",
      render: (invoice) => invoice.taxRateDisplay ?? "—",
    },
    amountInclusiveTax: {
      key: "amountInclusiveTax",
      header: "Amount inclusive tax",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(
          invoice.total ?? invoice.totals?.total ?? "0",
          invoice.currencyCode ?? baseCurrency,
        ),
    },
    incomeWhtPercent: {
      key: "incomeWhtPercent",
      header: "Income WHT %",
      className: "text-right",
      render: (invoice) =>
        invoice.incomeWhtEnabled && invoice.incomeWhtRate != null
          ? `${Number(invoice.incomeWhtRate)}%`
          : "—",
    },
    incomeWhtAmount: {
      key: "incomeWhtAmount",
      header: "Income WHT amount",
      className: "text-right",
      render: (invoice) =>
        invoice.incomeWhtEnabled
          ? formatCurrency(invoice.incomeWhtAmount ?? "0", invoice.currencyCode ?? baseCurrency)
          : "—",
    },
    salesTaxWhtPercent: {
      key: "salesTaxWhtPercent",
      header: "Sales tax WHT %",
      className: "text-right",
      render: (invoice) =>
        invoice.salesTaxWhtEnabled && invoice.salesTaxWhtRate != null
          ? `${Number(invoice.salesTaxWhtRate)}%`
          : "—",
    },
    salesTaxWhtAmount: {
      key: "salesTaxWhtAmount",
      header: "Sales tax WHT amount",
      className: "text-right",
      render: (invoice) =>
        invoice.salesTaxWhtEnabled
          ? formatCurrency(invoice.salesTaxWhtAmount ?? "0", invoice.currencyCode ?? baseCurrency)
          : "—",
    },
    amountInclusiveWht: {
      key: "amountInclusiveWht",
      header: "Amount including WHT",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(
          invoice.whtEnabled || invoice.incomeWhtEnabled || invoice.salesTaxWhtEnabled
            ? (invoice.netSettlementAmount ??
                invoice.totals?.netSettlementAmount ??
                invoice.total ??
                "0")
            : (invoice.total ?? invoice.totals?.total ?? "0"),
          invoice.currencyCode ?? baseCurrency,
        ),
    },
    totalReceivable: {
      key: "totalReceivable",
      header: "Total receivable",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(
          invoice.netSettlementAmount ??
            invoice.totals?.netSettlementAmount ??
            invoice.total ??
            "0",
          invoice.currencyCode ?? baseCurrency,
        ),
    },
    amountPaid: {
      key: "amountPaid",
      header: "Amount paid",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(invoice.amountPaid ?? "0", invoice.currencyCode ?? baseCurrency),
    },
    total: {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(
          invoice.total ?? invoice.totals?.total ?? "0",
          invoice.currencyCode ?? baseCurrency,
        ),
    },
    amountDue: {
      key: "amountDue",
      header: "Amount Due",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(invoice.amountDue ?? "0", invoice.currencyCode ?? baseCurrency),
    },
  };

  const columns = tableView.visibleColumnIds
    .map((id) => columnMap[id])
    .filter((column): column is DataTableColumn<Invoice> => Boolean(column));

  return (
    <EntityListPage
      content={
        invoicesQuery.error ? (
          <ErrorState title="Unable to load invoices" description={invoicesQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={invoicesQuery.data?.items ?? []}
            emptyDescription="Create invoices to manage receivables and payment collection."
            emptyTitle="No invoices yet"
            getRowKey={(invoice) => invoice.id}
            isLoading={invoicesQuery.isLoading}
            pagination={
              invoicesQuery.data
                ? {
                    page: invoicesQuery.data.pagination.page,
                    totalPages: invoicesQuery.data.pagination.totalPages,
                    total: invoicesQuery.data.pagination.total,
                    limit: invoicesQuery.data.pagination.limit,
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
      description="Issue invoices, track receivables, and prepare customer payment allocation."
      eyebrow="Sales documents"
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
            <Link to={`/app/company/${companyId}/invoices/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New invoice
            </Link>
          </Button>
        </div>
      }
      title="Invoices"
      toolbar={
        <FilterBar>
          <FilterField className="md:min-w-[240px] md:flex-1">
            <SearchInput
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search invoice number or reference"
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
              {["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"].map(
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
                setCustomerId(e.target.value);
                setPage(1);
              }}
              value={customerId}
            >
              <option value="">All customers</option>
              {(customersQuery.data ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.displayName}
                </option>
              ))}
            </Select>
          </FilterField>
        </FilterBar>
      }
    />
  );
}
