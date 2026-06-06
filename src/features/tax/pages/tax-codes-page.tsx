import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { TableActions } from "@/components/shared/table-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { TaxCodeFormDrawer } from "@/features/tax/components/tax-code-form-drawer";
import {
  useCreateTaxCode,
  useDeleteTaxCode,
  useTaxCodes,
  useTaxRates,
  useUpdateTaxCode,
} from "@/features/tax/hooks/use-tax";
import type { TaxCode } from "@/features/tax/types/tax.types";

export function TaxCodesPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "tax");
  const canManage = canManageEntity(permissions, "tax");
  const taxCodesQuery = useTaxCodes(companyId);
  const taxRatesQuery = useTaxRates(companyId);
  const createMutation = useCreateTaxCode(companyId);
  const deleteMutation = useDeleteTaxCode(companyId);
  const [selectedCode, setSelectedCode] = useState<TaxCode | null>(null);
  const updateMutation = useUpdateTaxCode(companyId, selectedCode?.id ?? null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaxCode | null>(null);

  if (!canView) {
    return <ErrorState title="Tax access restricted" description="Your current company membership does not include tax visibility." />;
  }

  const columns: DataTableColumn<TaxCode>[] = [
    {
      key: "name",
      header: "Tax code",
      render: (code) => (
        <div>
          <p className="font-medium">{code.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{code.code || "-"}</p>
        </div>
      ),
    },
    { key: "mode", header: "Mode", render: (code) => code.calculationMode || "Standard" },
    { key: "scope", header: "Scope", render: (code) => code.scope || "General" },
    {
      key: "defaults",
      header: "Defaults",
      render: (code) =>
        [code.isDefaultSales ? "Sales" : null, code.isDefaultPurchase ? "Purchase" : null]
          .filter(Boolean)
          .join(", ") || "-",
    },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (code) => (
        <TableActions
          canManage={canManage}
          onDelete={() => setDeleteTarget(code)}
          onEdit={() => {
            setSelectedCode(code);
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
          taxCodesQuery.error ? (
            <ErrorState title="Unable to load tax codes" description={taxCodesQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={taxCodesQuery.data ?? []}
              emptyDescription="Create tax codes that your documents can assign to line items."
              emptyTitle="No tax codes yet"
              getRowKey={(code) => code.id}
              isLoading={taxCodesQuery.isLoading}
            />
          )
        }
        description="Map reusable tax behaviors for sales and purchase document lines."
        eyebrow="Tax"
        headerActions={
          <Button
            disabled={!canManage}
            onClick={() => {
              setSelectedCode(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            New tax code
          </Button>
        }
        title="Tax Codes"
      />

      <TaxCodeFormDrawer
        error={activeMutation.error}
        isPending={activeMutation.isPending}
        mode={drawerMode}
        onClose={() => {
          setDrawerOpen(false);
          activeMutation.reset();
        }}
        onSubmit={async (values) => {
          const payload = {
            ...values,
            code: values.code || undefined,
            description: values.description || undefined,
            calculationMode: values.calculationMode || undefined,
            scope: values.scope || undefined,
          };

          if (drawerMode === "create") {
            await createMutation.mutateAsync(payload);
          } else {
            await updateMutation.mutateAsync(payload);
          }

          setDrawerOpen(false);
        }}
        open={drawerOpen}
        taxCode={selectedCode}
        taxRates={taxRatesQuery.data ?? []}
      />

      <ConfirmDeleteDialog
        description={`This will remove ${deleteTarget?.name ?? "the selected tax code"} from active configuration.`}
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
        title="Delete tax code?"
      />
    </>
  );
}
