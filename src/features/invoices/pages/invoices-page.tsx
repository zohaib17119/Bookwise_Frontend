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
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { getCompanyBaseCurrency } from "@/features/companies/utils/company-currency";
import { canShowFbr, canUseZatcaReporting } from "@/features/compliance/utils/compliance-access";
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import { useInvoicesPaginated } from "@/features/invoices/hooks/use-invoices";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import {
  AuthorityTaxDialog,
  type AuthorityTaxDialogKind,
} from "@/features/tax/components/authority-tax-dialog";
import {
  usePayInvoiceSalesTax,
  useSettleInvoiceIncomeWht,
  useTaxBalances,
  useTaxSettings,
} from "@/features/tax/hooks/use-tax";
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
  { id: "taxAmount", label: "Tax amount", defaultVisible: true },
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
  { id: "taxActions", label: "Tax actions", defaultVisible: true },
];

function moneyNum(value?: string | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

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
  const accountsQuery = useAccountOptions(companyId);
  const taxSettingsQuery = useTaxSettings(companyId);
  const taxBalancesQuery = useTaxBalances(companyId);
  const paySalesTaxMutation = usePayInvoiceSalesTax(companyId);
  const settleIncomeWhtMutation = useSettleInvoiceIncomeWht(companyId);
  const invoicesQuery = useInvoicesPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    status: status || undefined,
    customerId: customerId || undefined,
    page,
    limit,
  });
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");
  const canManageTax = canManageEntity(permissions, "tax");
  const baseCurrency = getCompanyBaseCurrency(company);

  const [dialogKind, setDialogKind] = useState<AuthorityTaxDialogKind | null>(null);
  const [dialogInvoice, setDialogInvoice] = useState<Invoice | null>(null);

  const bankAccounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (account) =>
          account.type === "BANK" ||
          (account.type === "ASSET" && (account.subtype ?? "").toLowerCase() === "cash"),
      ),
    [accountsQuery.data],
  );

  const savedCfPercent =
    (taxSettingsQuery.data?.salesTaxCarryForwardMaxPercent as string | null | undefined) ?? null;
  const cfBalance = moneyNum(taxBalancesQuery.data?.salesTaxCarryForward);

  const viewColumns = useMemo(() => {
    let columns = INVOICE_VIEW_COLUMNS;
    if (!showZatca) {
      columns = columns.filter((column) => column.id !== "zatca");
    }
    if (!showFbr) {
      columns = columns.filter((column) => column.id !== "fbrTaxReported");
    }
    if (!canManageTax) {
      columns = columns.filter((column) => column.id !== "taxActions");
    }
    return columns;
  }, [canManageTax, showFbr, showZatca]);

  const tableView = useTableViewPreferences("invoices", companyId, user?.id, viewColumns);

  if (!canView) {
    return (
      <ErrorState
        title="Invoices access restricted"
        description="Your current company membership does not include invoice access."
      />
    );
  }

  const openSalesTax = (invoice: Invoice) => {
    setDialogInvoice(invoice);
    setDialogKind("invoice-sales-tax");
    paySalesTaxMutation.reset();
  };

  const openIncomeWht = (invoice: Invoice) => {
    setDialogInvoice(invoice);
    setDialogKind("invoice-income-wht");
    settleIncomeWhtMutation.reset();
  };

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
      header: "Payment Status",
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
        return <span className="text-muted-foreground"><DocumentStatusBadge status={"DRAFT"} /></span>;
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
    taxAmount: {
      key: "taxAmount",
      header: "Tax amount",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(
          invoice.taxAmount ?? invoice.totals?.taxTotal ?? "0",
          invoice.currencyCode ?? baseCurrency,
        ),
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
    taxActions: {
      key: "taxActions",
      header: "Tax Actions",
      render: (invoice) => {
        const status = String(invoice.status ?? "");
        const issued = !["DRAFT", "VOID", "CANCELLED"].includes(status);
        const salesTaxOutstanding = Math.max(
          0,
          moneyNum(invoice.taxAmount) - moneyNum(invoice.salesTaxAuthoritySettledAmount),
        );
        const incomeWhtOutstanding = Math.max(
          0,
          moneyNum(invoice.incomeWhtAmount) - moneyNum(invoice.incomeWhtAuthoritySettledAmount),
        );
        const heldBy = invoice.incomeWhtHeldBy ?? "COUNTERPARTY";
        if (!issued || (!salesTaxOutstanding && !incomeWhtOutstanding)) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            {salesTaxOutstanding > 0 ? (
              <Button
                onClick={() => openSalesTax(invoice)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Mark sales tax paid
              </Button>
            ) : null}
            {incomeWhtOutstanding > 0 ? (
              <Button
                onClick={() => openIncomeWht(invoice)}
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
    .filter((column): column is DataTableColumn<Invoice> => Boolean(column));

  return (
    <>
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
    <AuthorityTaxDialog
      amount={
        dialogKind === "invoice-sales-tax"
          ? Math.max(
              0,
              moneyNum(dialogInvoice?.taxAmount) -
                moneyNum(dialogInvoice?.salesTaxAuthoritySettledAmount),
            )
          : Math.max(
              0,
              moneyNum(dialogInvoice?.incomeWhtAmount) -
                moneyNum(dialogInvoice?.incomeWhtAuthoritySettledAmount),
            )
      }
      amountLabel={
        dialogKind === "invoice-sales-tax" ? "Sales tax to pay" : "Income WHT to settle"
      }
      bankAccounts={bankAccounts}
      carryForwardBalance={cfBalance}
      currency={dialogInvoice?.currencyCode ?? baseCurrency}
      description={
        dialogKind === "invoice-sales-tax"
          ? "Pays this invoice’s sales tax using carry forward (up to your max %) then cash/bank."
          : dialogInvoice?.incomeWhtHeldBy === "COMPANY"
            ? "Pays company-held income WHT from cash/bank."
            : "Moves customer-held income WHT receivable into Income WHT Claimed (no cash)."
      }
      errorMessage={
        (dialogKind === "invoice-sales-tax"
          ? paySalesTaxMutation.error?.message
          : settleIncomeWhtMutation.error?.message) ?? null
      }
      isPending={paySalesTaxMutation.isPending || settleIncomeWhtMutation.isPending}
      kind={dialogKind}
      needsBank={
        dialogKind === "invoice-sales-tax" || dialogInvoice?.incomeWhtHeldBy === "COMPANY"
      }
      needsPercent={dialogKind === "invoice-sales-tax" && savedCfPercent == null}
      onClose={() => {
        setDialogKind(null);
        setDialogInvoice(null);
      }}
      onConfirm={async (values) => {
        if (!dialogInvoice || !dialogKind) return;
        if (dialogKind === "invoice-sales-tax") {
          await paySalesTaxMutation.mutateAsync({
            invoiceId: dialogInvoice.id,
            paymentDate: values.paymentDate,
            bankAccountId: values.bankAccountId,
            carryForwardMaxPercent: values.carryForwardMaxPercent,
          });
        } else {
          await settleIncomeWhtMutation.mutateAsync({
            invoiceId: dialogInvoice.id,
            paymentDate: values.paymentDate,
            bankAccountId: values.bankAccountId,
          });
        }
        setDialogKind(null);
        setDialogInvoice(null);
      }}
      open={Boolean(dialogKind && dialogInvoice)}
      savedPercent={savedCfPercent}
      title={
        dialogKind === "invoice-sales-tax"
          ? `Mark sales tax paid — ${dialogInvoice?.invoiceNumber ?? ""}`
          : dialogInvoice?.incomeWhtHeldBy === "COMPANY"
            ? `Pay income WHT — ${dialogInvoice?.invoiceNumber ?? ""}`
            : `Claim income WHT — ${dialogInvoice?.invoiceNumber ?? ""}`
      }
    />
    </>
  );
}
