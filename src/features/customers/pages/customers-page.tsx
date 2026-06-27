import { useDeferredValue, useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActions } from "@/components/shared/table-actions";
import { formatCurrency } from "@/lib/utils/format";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { CustomerFormDrawer } from "@/features/customers/components/customer-form-drawer";
import {
  useCreateCustomer,
  useCustomersPaginated,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/features/customers/hooks/use-customers";
import type { CustomerFormValues } from "@/features/customers/schemas/customer.schema";
import type { Customer } from "@/features/customers/types/customer.types";

export function CustomersPage() {
  const { companyId, company, currency, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const deferredSearch = useDeferredValue(search);
  const customersQuery = useCustomersPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    includeInactive,
    page,
    limit,
  });
  const createMutation = useCreateCustomer(companyId);
  const updateMutation = useUpdateCustomer(companyId, selectedCustomer?.id ?? null);
  const deleteMutation = useDeleteCustomer(companyId);
  const canView = canViewEntity(permissions, "customers");
  const canManage = canManageEntity(permissions, "customers");

  if (!canView) {
    return (
      <ErrorState
        title="Customers access restricted"
        description="Your current company membership does not include customer directory access."
      />
    );
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (customer) => (
        <div>
          <p className="font-medium">
            {customer.customerCode ? `${customer.customerCode} - ` : ""}
            {customer.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {customer.legalName || `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "No legal name"}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (customer) => (
        <div>
          <p>{customer.email || "No email"}</p>
          <p className="text-xs text-muted-foreground">{customer.phone || customer.mobile || "No phone"}</p>
        </div>
      ),
    },
    {
      key: "openBalance",
      header: "Open balance",
      className: "text-right",
      render: (customer) =>
        formatCurrency(Number(customer.openBalance ?? 0), customer.currencyCode ?? currency),
    },
    {
      key: "currency",
      header: "Currency",
      render: (customer) => customer.currencyCode ?? currency ?? "-",
    },
    {
      key: "terms",
      header: "Terms",
      render: (customer) => `${customer.paymentTermsDays ?? 0} days`,
    },
    {
      key: "status",
      header: "Status",
      render: (customer) => <StatusBadge active={customer.isActive} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (customer) => (
        <TableActions
          canManage={canManage}
          onDelete={() => setDeleteTarget(customer)}
          onEdit={() => {
            setSelectedCustomer(customer);
            setDrawerMode("edit");
            setDrawerOpen(true);
          }}
        />
      ),
    },
  ];

  const activeMutation = drawerMode === "create" ? createMutation : updateMutation;

  return (
    <>
      <EntityListPage
        content={
          customersQuery.error ? (
            <ErrorState
              title="Unable to load customers"
              description={customersQuery.error.message}
            />
          ) : (
            <DataTable
              columns={columns}
              data={customersQuery.data?.items ?? []}
              emptyDescription="Create customers to power quotes, invoices, and receivables."
              emptyTitle="No customers yet"
              getRowKey={(customer) => customer.id}
              isLoading={customersQuery.isLoading}
              pagination={
                customersQuery.data
                  ? {
                      page: customersQuery.data.pagination.page,
                      totalPages: customersQuery.data.pagination.totalPages,
                      total: customersQuery.data.pagination.total,
                      limit: customersQuery.data.pagination.limit,
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
        description="Maintain the sales-side customer directory, contact info, and balance defaults."
        eyebrow="Sales"
        headerActions={
          <Button
            disabled={!canManage}
            onClick={() => {
              setSelectedCustomer(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            New customer
          </Button>
        }
        title="Customers"
        toolbar={
          <FilterBar>
            <SearchInput
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by customer code, display name, email"
              value={search}
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeInactive}
                onChange={(event) => {
                  setIncludeInactive(event.target.checked);
                  setPage(1);
                }}
              />
              Include inactive
            </label>
          </FilterBar>
        }
      />

      <CustomerFormDrawer
        companyCurrency={currency}
        customer={selectedCustomer}
        error={activeMutation.error}
        isPending={activeMutation.isPending}
        mode={drawerMode}
        onClose={() => {
          setDrawerOpen(false);
          activeMutation.reset();
        }}
        onSubmit={async (values: CustomerFormValues) => {
          const payload = {
            ...values,
            customerCode: values.customerCode || undefined,
            legalName: values.legalName || undefined,
            firstName: values.firstName || undefined,
            lastName: values.lastName || undefined,
            email: values.email || undefined,
            phone: values.phone || undefined,
            mobile: values.mobile || undefined,
            website: values.website || undefined,
            taxRegistrationNumber: values.taxRegistrationNumber || undefined,
            currencyCode: values.currencyCode || undefined,
            paymentTermsDays:
              values.paymentTermsDays === undefined || Number.isNaN(values.paymentTermsDays)
                ? null
                : Number(values.paymentTermsDays),
            openingBalance: values.openingBalance || undefined,
            openingBalanceDate: values.openingBalanceDate || undefined,
            billingAddressLine1: values.billingAddressLine1 || undefined,
            billingAddressLine2: values.billingAddressLine2 || undefined,
            billingCity: values.billingCity || undefined,
            billingState: values.billingState || undefined,
            billingPostalCode: values.billingPostalCode || undefined,
            billingCountry: values.billingCountry || undefined,
            shippingAddressLine1: values.shippingAddressLine1 || undefined,
            shippingAddressLine2: values.shippingAddressLine2 || undefined,
            shippingCity: values.shippingCity || undefined,
            shippingState: values.shippingState || undefined,
            shippingPostalCode: values.shippingPostalCode || undefined,
            shippingCountry: values.shippingCountry || undefined,
            notes: values.notes || undefined,
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
        description={`This will soft delete ${deleteTarget?.displayName ?? "this customer"} and preserve historical transactions.`}
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
        title="Delete customer?"
      />

      {deleteMutation.error ? (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
          <Alert title={deleteMutation.error.message} variant="destructive" />
        </div>
      ) : null}
    </>
  );
}
