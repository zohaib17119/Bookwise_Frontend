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
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import { useInvoicesPaginated } from "@/features/invoices/hooks/use-invoices";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import InvoiceEditorPage from "./invoice-editor-page";

export function InvoicesPage() {
  const { companyId, company, permissions } = useActiveCompany();
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

  if (!canView) {
    return (
      <ErrorState
        title="Invoices access restricted"
        description="Your current company membership does not include invoice access."
      />
    );
  }

  const columns: DataTableColumn<Invoice>[] = [
    {
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
    { key: "customer", header: "Customer", render: (invoice) => invoice.customerName || "-" },
    { key: "issueDate", header: "Issue Date", render: (invoice) => formatDate(invoice.issueDate) },
    { key: "dueDate", header: "Due Date", render: (invoice) => formatDate(invoice.dueDate) },
    { key: "status", header: "Status", render: (invoice) => <DocumentStatusBadge status={invoice.status} /> },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(
          Number(invoice.total ?? invoice.totals?.total ?? 0),
          invoice.currencyCode ?? company?.baseCurrencyCode ?? company?.currencyCode ?? "USD",
        ),
    },
    {
      key: "amountDue",
      header: "Amount Due",
      className: "text-right",
      render: (invoice) =>
        formatCurrency(Number(invoice.amountDue ?? 0), invoice.currencyCode ?? company?.baseCurrencyCode ?? company?.currencyCode ?? "USD"),
    },
  ];

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
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/invoices/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New invoice
          </Link>
        </Button>
      }
      title="Invoices"
      toolbar={
        <FilterBar>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search invoice number or reference"
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
            {["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"].map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Select
            className="min-w-[220px]"
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
        </FilterBar>
      
      }
    />
  );
}
