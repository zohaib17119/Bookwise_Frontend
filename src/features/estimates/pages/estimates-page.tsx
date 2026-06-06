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
import { useCustomerOptions } from "@/features/customers/hooks/use-customers";
import { useEstimates } from "@/features/estimates/hooks/use-estimates";
import type { Estimate } from "@/features/estimates/types/estimate.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function EstimatesPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const deferredSearch = useDeferredValue(search);
  const customersQuery = useCustomerOptions(companyId);
  const estimatesQuery = useEstimates(companyId, {
    search: deferredSearch.trim() || undefined,
    status: status || undefined,
    customerId: customerId || undefined,
  });
  const canView = canViewEntity(permissions, "estimates");
  const canManage = canManageEntity(permissions, "estimates");

  if (!canView) {
    return (
      <ErrorState
        title="Estimates access restricted"
        description="Your current company membership does not include estimates access."
      />
    );
  }

  const columns: DataTableColumn<Estimate>[] = [
    {
      key: "number",
      header: "Estimate",
      render: (estimate) => (
        <div>
          <Link
            className="font-medium text-primary"
            to={`/app/company/${companyId}/estimates/${estimate.id}`}
          >
            {estimate.estimateNumber || "Draft estimate"}
          </Link>
          <p className="text-xs text-muted-foreground">
            Ref: {estimate.referenceNumber || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (estimate) => estimate.customerName || "-",
    },
    {
      key: "issueDate",
      header: "Issue Date",
      render: (estimate) => formatDate(estimate.issueDate),
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (estimate) => formatDate(estimate.expiryDate),
    },
    {
      key: "status",
      header: "Status",
      render: (estimate) => <DocumentStatusBadge status={estimate.status} />,
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (estimate) =>
        formatCurrency(estimate.totals?.total ?? 0, estimate.currencyCode ?? company?.currency ?? "USD"),
    },
  ];

  return (
    <EntityListPage
      content={
        estimatesQuery.error ? (
          <ErrorState
            title="Unable to load estimates"
            description={estimatesQuery.error.message}
          />
        ) : (
          <DataTable
            columns={columns}
            data={estimatesQuery.data ?? []}
            emptyDescription="Create estimates to prepare quote-to-invoice workflows."
            emptyTitle="No estimates yet"
            getRowKey={(estimate) => estimate.id}
            isLoading={estimatesQuery.isLoading}
          />
        )
      }
      description="Draft, send, and manage sales estimates before converting them into invoices."
      eyebrow="Sales documents"
      headerActions={
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/estimates/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New estimate
          </Link>
        </Button>
      }
      title="Estimates"
      toolbar={
        <FilterBar>
          <SearchInput
            onChange={setSearch}
            placeholder="Search estimate number or reference"
            value={search}
          />
          <Select className="min-w-[180px]" onChange={(e) => setStatus(e.target.value)} value={status}>
            <option value="">All statuses</option>
            {["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Select
            className="min-w-[220px]"
            onChange={(e) => setCustomerId(e.target.value)}
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
