import { useDeferredValue, useState } from "react";
import { BadgeDollarSign, Boxes, Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActions } from "@/components/shared/table-actions";
import { useAccountOptions } from "@/features/accounts/hooks/use-accounts";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { ItemFormDrawer } from "@/features/items/components/item-form-drawer";
import {
  useCreateItem,
  useDeleteItem,
  useItemsPaginated,
  useUpdateItem,
} from "@/features/items/hooks/use-items";
import type { ItemFormValues } from "@/features/items/schemas/item.schema";
import type { Item } from "@/features/items/types/item.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { useVendorOptions } from "@/features/vendors/hooks/use-vendors";
import { useTaxRates } from "@/features/tax/hooks/use-tax";

export function ItemsPage() {
  const { companyId, permissions } = useActiveCompany();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [taxableOnly, setTaxableOnly] = useState(false);
  const [trackQuantityOnly, setTrackQuantityOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const deferredSearch = useDeferredValue(search);
  const itemsQuery = useItemsPaginated(companyId, {
    search: deferredSearch.trim() || undefined,
    type: type || undefined,
    includeInactive,
    taxable: taxableOnly ? true : undefined,
    trackQuantity: trackQuantityOnly ? true : undefined,
    page,
    limit,
  });
  const accountsQuery = useAccountOptions(companyId);
  const vendorsQuery = useVendorOptions(companyId);
  const taxRatesQuery = useTaxRates(companyId);
  const createMutation = useCreateItem(companyId);
  const updateMutation = useUpdateItem(companyId, selectedItem?.id ?? null);
  const deleteMutation = useDeleteItem(companyId);
  const canView = canViewEntity(permissions, "items");
  const canManage = canManageEntity(permissions, "items");

  if (!canView) {
    return (
      <ErrorState
        title="Items access restricted"
        description="Your current company membership does not include item catalog access."
      />
    );
  }

  const columns: DataTableColumn<Item>[] = [
    {
      key: "item",
      header: "Item / Service",
      render: (item) => (
        <div>
          <p className="font-medium">
            {item.itemCode ? `${item.itemCode} - ` : ""}
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.sku || item.description || "No SKU or description"}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="capitalize">{item.type.replace("_", " ")}</span>
          {item.trackQuantity ? <Boxes className="h-4 w-4 text-primary" /> : null}
          {item.taxable ? <BadgeDollarSign className="h-4 w-4 text-primary" /> : null}
        </div>
      ),
    },
    {
      key: "pricing",
      header: "Pricing",
      render: (item) => (
        <div>
          <p>Sale: {item.salesPrice ?? 0}</p>
          <p className="text-xs text-muted-foreground">Cost: {item.purchaseCost ?? 0}</p>
        </div>
      ),
    },
    {
      key: "onHand",
      header: "On hand",
      className: "text-right",
      render: (item) =>
        item.trackQuantity ? (item.quantityOnHand ?? "0") : <span className="text-muted-foreground">-</span>,
    },
    {
      key: "vendor",
      header: "Preferred Vendor",
      render: (item) => item.preferredVendorName || "Not set",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge active={item.isActive} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (item) => (
        <TableActions
          canManage={canManage}
          onDelete={() => setDeleteTarget(item)}
          onEdit={() => {
            setSelectedItem(item);
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
          itemsQuery.error ? (
            <ErrorState title="Unable to load items" description={itemsQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={itemsQuery.data?.items ?? []}
              emptyDescription="Create products and services that feed invoices, bills, and inventory workflows."
              emptyTitle="No items yet"
              getRowKey={(item) => item.id}
              isLoading={itemsQuery.isLoading}
              pagination={
                itemsQuery.data
                  ? {
                      page: itemsQuery.data.pagination.page,
                      totalPages: itemsQuery.data.pagination.totalPages,
                      total: itemsQuery.data.pagination.total,
                      limit: itemsQuery.data.pagination.limit,
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
        description="Maintain the company item catalog with sales, purchasing, and account links."
        eyebrow="Inventory"
        headerActions={
          <Button
            disabled={!canManage}
            onClick={() => {
              setSelectedItem(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            New item
          </Button>
        }
        title="Items & Services"
        toolbar={
          <FilterBar>
            <SearchInput
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by item code, name, SKU"
              value={search}
            />
            <Select
              className="min-w-[180px]"
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              value={type}
            >
              <option value="">All item types</option>
              <option value="service">Service</option>
              <option value="non_inventory">Non-inventory</option>
              <option value="inventory">Inventory</option>
            </Select>
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
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={taxableOnly}
                onChange={(event) => {
                  setTaxableOnly(event.target.checked);
                  setPage(1);
                }}
              />
              Taxable only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={trackQuantityOnly}
                onChange={(event) => {
                  setTrackQuantityOnly(event.target.checked);
                  setPage(1);
                }}
              />
              Track quantity
            </label>
          </FilterBar>
        }
      />

      <ItemFormDrawer
        accounts={accountsQuery.data ?? []}
        error={activeMutation.error}
        isPending={activeMutation.isPending}
        item={selectedItem}
        mode={drawerMode}
        onClose={() => {
          setDrawerOpen(false);
          activeMutation.reset();
        }}
        onSubmit={async (values: ItemFormValues) => {
          const payload = {
            ...values,
            itemCode: values.itemCode || undefined,
            description: values.description || undefined,
            sku: values.sku || undefined,
            unitName: values.unitName || undefined,
            salesPrice: values.salesPrice || undefined,
            purchaseCost: values.purchaseCost || undefined,
            incomeAccountId: values.incomeAccountId || undefined,
            expenseAccountId: values.expenseAccountId || undefined,
            assetAccountId: values.assetAccountId || undefined,
            preferredVendorId: values.preferredVendorId || undefined,
            taxRateId: values.taxRateId || undefined,
            quantityOnHand: values.quantityOnHand || undefined,
            reorderLevel: values.reorderLevel || undefined,
          };

          if (drawerMode === "create") {
            await createMutation.mutateAsync(payload);
          } else {
            await updateMutation.mutateAsync(payload);
          }

          setDrawerOpen(false);
        }}
        open={drawerOpen}
        taxRates={taxRatesQuery.data ?? []}
        vendors={vendorsQuery.data ?? []}
      />

      <ConfirmDeleteDialog
        description={`This will soft delete ${deleteTarget?.name ?? "this item"} while preserving transaction history.`}
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
        title="Delete item?"
      />

      {deleteMutation.error ? (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
          <Alert title={deleteMutation.error.message} variant="destructive" />
        </div>
      ) : null}
    </>
  );
}
