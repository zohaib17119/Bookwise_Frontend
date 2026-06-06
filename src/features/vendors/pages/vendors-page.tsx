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
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { VendorFormDrawer } from "@/features/vendors/components/vendor-form-drawer";
import {
  useCreateVendor,
  useDeleteVendor,
  useUpdateVendor,
  useVendors,
} from "@/features/vendors/hooks/use-vendors";
import type { VendorFormValues } from "@/features/vendors/schemas/vendor.schema";
import type { Vendor } from "@/features/vendors/types/vendor.types";

export function VendorsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const deferredSearch = useDeferredValue(search);
  const vendorsQuery = useVendors(companyId, {
    search: deferredSearch.trim() || undefined,
    includeInactive,
  });
  const createMutation = useCreateVendor(companyId);
  const updateMutation = useUpdateVendor(companyId, selectedVendor?.id ?? null);
  const deleteMutation = useDeleteVendor(companyId);
  const canView = canViewEntity(permissions, "vendors");
  const canManage = canManageEntity(permissions, "vendors");

  if (!canView) {
    return (
      <ErrorState
        title="Vendors access restricted"
        description="Your current company membership does not include vendor directory access."
      />
    );
  }

  const columns: DataTableColumn<Vendor>[] = [
    {
      key: "name",
      header: "Vendor",
      render: (vendor) => (
        <div>
          <p className="font-medium">
            {vendor.vendorCode ? `${vendor.vendorCode} - ` : ""}
            {vendor.displayName}
          </p>
          <p className="text-xs text-muted-foreground">{vendor.legalName || "No legal name"}</p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (vendor) => (
        <div>
          <p>{vendor.contactPersonName || vendor.email || "No contact set"}</p>
          <p className="text-xs text-muted-foreground">{vendor.phone || vendor.mobile || "No phone"}</p>
        </div>
      ),
    },
    {
      key: "terms",
      header: "Terms",
      render: (vendor) => `${vendor.paymentTermsDays ?? 0} days`,
    },
    {
      key: "status",
      header: "Status",
      render: (vendor) => <StatusBadge active={vendor.isActive} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (vendor) => (
        <TableActions
          canManage={canManage}
          onDelete={() => setDeleteTarget(vendor)}
          onEdit={() => {
            setSelectedVendor(vendor);
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
          vendorsQuery.error ? (
            <ErrorState
              title="Unable to load vendors"
              description={vendorsQuery.error.message}
            />
          ) : (
            <DataTable
              columns={columns}
              data={vendorsQuery.data ?? []}
              emptyDescription="Create vendors to support purchasing, bills, and item sourcing."
              emptyTitle="No vendors yet"
              getRowKey={(vendor) => vendor.id}
              isLoading={vendorsQuery.isLoading}
            />
          )
        }
        description="Maintain supplier records, payment defaults, and purchasing contacts."
        eyebrow="Purchases"
        headerActions={
          <Button
            disabled={!canManage}
            onClick={() => {
              setSelectedVendor(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            New vendor
          </Button>
        }
        title="Vendors"
        toolbar={
          <FilterBar>
            <SearchInput
              onChange={setSearch}
              placeholder="Search by vendor code, display name, contact"
              value={search}
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
              />
              Include inactive
            </label>
          </FilterBar>
        }
      />

      <VendorFormDrawer
        companyCurrency={company?.currency}
        error={activeMutation.error}
        isPending={activeMutation.isPending}
        mode={drawerMode}
        onClose={() => {
          setDrawerOpen(false);
          activeMutation.reset();
        }}
        onSubmit={async (values: VendorFormValues) => {
          const payload = {
            ...values,
            vendorCode: values.vendorCode || undefined,
            legalName: values.legalName || undefined,
            contactPersonName: values.contactPersonName || undefined,
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
        vendor={selectedVendor}
      />

      <ConfirmDeleteDialog
        description={`This will soft delete ${deleteTarget?.displayName ?? "this vendor"} while preserving historical bills and payments.`}
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
        title="Delete vendor?"
      />

      {deleteMutation.error ? (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
          <Alert title={deleteMutation.error.message} variant="destructive" />
        </div>
      ) : null}
    </>
  );
}
