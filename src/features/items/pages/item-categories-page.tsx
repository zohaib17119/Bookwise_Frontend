import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { TableActions } from "@/components/shared/table-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { ItemsModuleNav } from "@/features/items/components/items-module-nav";
import {
  useCreateItemCategory,
  useDeleteItemCategory,
  useItemCategories,
  useUpdateItemCategory,
} from "@/features/items/hooks/use-item-categories";
import type { ItemCategory } from "@/features/items/types/item-category.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";

export function ItemCategoriesPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "items");
  const canManage = canManageEntity(permissions, "items");
  const listQuery = useItemCategories(companyId);
  const createMutation = useCreateItemCategory(companyId);
  const deleteMutation = useDeleteItemCategory(companyId);
  const [selected, setSelected] = useState<ItemCategory | null>(null);
  const updateMutation = useUpdateItemCategory(companyId, selected?.id ?? null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ItemCategory | null>(null);

  if (!canView) {
    return (
      <ErrorState
        title="Items access restricted"
        description="Your current company membership does not include item visibility."
      />
    );
  }

  const activeMutation = drawerMode === "create" ? createMutation : updateMutation;

  const openCreate = () => {
    setSelected(null);
    setDrawerMode("create");
    setName("");
    createMutation.reset();
    updateMutation.reset();
    setDrawerOpen(true);
  };

  const openEdit = (row: ItemCategory) => {
    setSelected(row);
    setDrawerMode("edit");
    setName(row.name);
    createMutation.reset();
    updateMutation.reset();
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<ItemCategory>[] = [
    {
      key: "name",
      header: "Category",
      render: (row) => <p className="font-medium">{row.name}</p>,
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (row) => (
        <TableActions
          canManage={canManage}
          onDelete={() => setDeleteTarget(row)}
          onEdit={() => openEdit(row)}
        />
      ),
    },
  ];

  return (
    <>
      <EntityListPage
        content={
          listQuery.error ? (
            <ErrorState title="Unable to load categories" description={listQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={listQuery.data ?? []}
              emptyDescription="Group products by category (optional on each item)."
              emptyTitle="No categories yet"
              getRowKey={(row) => row.id}
              isLoading={listQuery.isLoading}
            />
          )
        }
        description="Product categories for inventory items. Not related to FBR HS codes."
        eyebrow="Items"
        headerActions={
          <Button disabled={!canManage} onClick={openCreate} type="button">
            <Plus className="mr-2 h-4 w-4" />
            New category
          </Button>
        }
        title="Categories"
        toolbar={<ItemsModuleNav />}
      />

      <CreateEditDrawer
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setDrawerOpen(false);
                activeMutation.reset();
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={!name.trim()}
              isLoading={activeMutation.isPending}
              onClick={async () => {
                const payload = { name: name.trim() };
                if (drawerMode === "create") {
                  await createMutation.mutateAsync(payload);
                } else if (selected) {
                  await updateMutation.mutateAsync(payload);
                }
                setDrawerOpen(false);
              }}
              type="button"
            >
              {drawerMode === "create" ? "Create" : "Save changes"}
            </Button>
          </div>
        }
        onClose={() => {
          setDrawerOpen(false);
          activeMutation.reset();
        }}
        open={drawerOpen}
        title={drawerMode === "create" ? "New category" : `Edit ${selected?.name ?? "category"}`}
      >
        <div className="space-y-4">
          {activeMutation.error ? (
            <Alert title={activeMutation.error.message} variant="destructive" />
          ) : null}
          <FormField label="Category name">
            <Input onChange={(event) => setName(event.target.value)} value={name} />
          </FormField>
        </div>
      </CreateEditDrawer>

      <ConfirmDeleteDialog
        description={`Delete category “${deleteTarget?.name ?? ""}”? Items using it will have no category.`}
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
        title="Delete category"
      />

      {deleteMutation.error ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Alert title={deleteMutation.error.message} variant="destructive" />
        </div>
      ) : null}
    </>
  );
}
