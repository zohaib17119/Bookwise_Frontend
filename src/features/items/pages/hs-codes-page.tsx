import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { CreateEditDrawer } from "@/components/shared/create-edit-drawer";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FormField } from "@/components/shared/form-field";
import { TableActions } from "@/components/shared/table-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { ItemsModuleNav } from "@/features/items/components/items-module-nav";
import {
  useCreateHsCodeCategory,
  useHsCodeCategories,
  useUpdateHsCodeCategory,
} from "@/features/items/hooks/use-hs-code-categories";
import type { HsCodeCategory } from "@/features/items/types/hs-code-category.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";

export function HsCodesPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "items");
  const canManage = canManageEntity(permissions, "items");
  const listQuery = useHsCodeCategories(companyId);
  const createMutation = useCreateHsCodeCategory(companyId);
  const [selected, setSelected] = useState<HsCodeCategory | null>(null);
  const updateMutation = useUpdateHsCodeCategory(companyId, selected?.id ?? null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [code, setCode] = useState("");
  const [categoryName, setCategoryName] = useState("");

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
    setCode("");
    setCategoryName("");
    createMutation.reset();
    updateMutation.reset();
    setDrawerOpen(true);
  };

  const openEdit = (row: HsCodeCategory) => {
    setSelected(row);
    setDrawerMode("edit");
    setCode(row.code);
    setCategoryName(row.categoryName);
    createMutation.reset();
    updateMutation.reset();
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<HsCodeCategory>[] = [
    {
      key: "code",
      header: "HS code",
      render: (row) => <p className="font-medium">{row.code}</p>,
    },
    {
      key: "categoryName",
      header: "Category",
      render: (row) => row.categoryName,
    },
    {
      key: "actions",
      header: "",
      className: "w-[120px]",
      render: (row) => (
        <TableActions canManage={canManage} onEdit={() => openEdit(row)} />
      ),
    },
  ];

  return (
    <>
      <EntityListPage
        content={
          listQuery.error ? (
            <ErrorState title="Unable to load HS codes" description={listQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={listQuery.data ?? []}
              emptyDescription="Add HS codes so items can link to a category by ID."
              emptyTitle="No HS codes yet"
              getRowKey={(row) => row.id}
              isLoading={listQuery.isLoading}
            />
          )
        }
        description="Maintain HS code categories used on inventory items. Editing a code updates linked items."
        eyebrow="Items"
        headerActions={
          <Button disabled={!canManage} onClick={openCreate} type="button">
            <Plus className="mr-2 h-4 w-4" />
            New HS code
          </Button>
        }
        title="HS codes"
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
              disabled={!code.trim() || !categoryName.trim()}
              isLoading={activeMutation.isPending}
              onClick={async () => {
                const payload = { code: code.trim(), categoryName: categoryName.trim() };
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
        title={drawerMode === "create" ? "New HS code" : `Edit ${selected?.code ?? "HS code"}`}
      >
        <div className="space-y-4">
          {activeMutation.error ? (
            <Alert title={activeMutation.error.message} variant="destructive" />
          ) : null}
          <FormField label="HS code">
            <Input onChange={(event) => setCode(event.target.value)} value={code} />
          </FormField>
          <FormField label="Category name">
            <Input onChange={(event) => setCategoryName(event.target.value)} value={categoryName} />
          </FormField>
        </div>
      </CreateEditDrawer>
    </>
  );
}
