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
import { InvoicesModuleNav } from "@/features/invoices/components/invoices-module-nav";
import {
  useCreateSalesPerson,
  useDeleteSalesPerson,
  useSalesPersons,
  useUpdateSalesPerson,
} from "@/features/sales-persons/hooks/use-sales-persons";
import type { SalesPerson } from "@/features/sales-persons/types/sales-person.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";

export function SalesPersonsPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "invoices");
  const canManage = canManageEntity(permissions, "invoices");
  const listQuery = useSalesPersons(companyId);
  const createMutation = useCreateSalesPerson(companyId);
  const deleteMutation = useDeleteSalesPerson(companyId);
  const [selected, setSelected] = useState<SalesPerson | null>(null);
  const updateMutation = useUpdateSalesPerson(companyId, selected?.id ?? null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SalesPerson | null>(null);

  if (!canView) {
    return (
      <ErrorState
        title="Invoices access restricted"
        description="Your current company membership does not include invoice visibility."
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

  const openEdit = (row: SalesPerson) => {
    setSelected(row);
    setDrawerMode("edit");
    setName(row.name);
    createMutation.reset();
    updateMutation.reset();
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<SalesPerson>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.isDefault ? (
            <p className="text-xs text-muted-foreground">Default for new invoices</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (row) => (
        <TableActions
          canManage={canManage}
          onDelete={row.isDefault ? undefined : () => setDeleteTarget(row)}
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
            <ErrorState
              title="Unable to load sales persons"
              description={listQuery.error.message}
            />
          ) : (
            <DataTable
              columns={columns}
              data={listQuery.data ?? []}
              emptyDescription="Add sales persons to attribute invoices and filter dashboard sales."
              emptyTitle="No sales persons yet"
              getRowKey={(row) => row.id}
              isLoading={listQuery.isLoading}
            />
          )
        }
        description="Track which sales person brought each invoice. General Sales is the default."
        eyebrow="Invoices"
        headerActions={
          <Button disabled={!canManage} onClick={openCreate} type="button">
            <Plus className="mr-2 h-4 w-4" />
            New sales person
          </Button>
        }
        title="Sales persons"
        toolbar={<InvoicesModuleNav />}
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
        title={
          drawerMode === "create"
            ? "New sales person"
            : `Edit ${selected?.name ?? "sales person"}`
        }
      >
        <div className="space-y-4">
          {activeMutation.error ? (
            <Alert title={activeMutation.error.message} variant="destructive" />
          ) : null}
          <FormField label="Name">
            <Input onChange={(event) => setName(event.target.value)} value={name} />
          </FormField>
        </div>
      </CreateEditDrawer>

      <ConfirmDeleteDialog
        description={`Delete sales person “${deleteTarget?.name ?? ""}”? Existing invoices keep the historical name.`}
        open={Boolean(deleteTarget)}
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
        title="Delete sales person"
      />

      {deleteMutation.error ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Alert title={deleteMutation.error.message} variant="destructive" />
        </div>
      ) : null}
    </>
  );
}
