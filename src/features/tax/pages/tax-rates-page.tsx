import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActions } from "@/components/shared/table-actions";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { TaxRateFormDrawer } from "@/features/tax/components/tax-rate-form-drawer";
import {
  useCreateTaxRate,
  useDeleteTaxRate,
  useTaxRates,
  useUpdateTaxRate,
} from "@/features/tax/hooks/use-tax";
import type { TaxRate } from "@/features/tax/types/tax.types";

export function TaxRatesPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "tax");
  const canManage = canManageEntity(permissions, "tax");
  const taxRatesQuery = useTaxRates(companyId);
  const createMutation = useCreateTaxRate(companyId);
  const deleteMutation = useDeleteTaxRate(companyId);
  const [selectedRate, setSelectedRate] = useState<TaxRate | null>(null);
  const updateMutation = useUpdateTaxRate(companyId, selectedRate?.id ?? null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaxRate | null>(null);

  if (!canView) {
    return <ErrorState title="Tax access restricted" description="Your current company membership does not include tax visibility." />;
  }

  const columns: DataTableColumn<TaxRate>[] = [
    {
      key: "name",
      header: "Tax rate",
      render: (rate) => (
        <div>
          <p className="font-medium">{rate.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rate.code || "-"}</p>
        </div>
      ),
    },
    { key: "rate", header: "Rate", render: (rate) => `${rate.ratePercent}%` },
    { key: "scope", header: "Scope", render: (rate) => rate.scope || "General" },
    { key: "status", header: "Status", render: (rate) => <StatusBadge active={rate.isActive} /> },
    {
      key: "actions",
      header: "",
      className: "w-[160px]",
      render: (rate) => (
        <TableActions
          canManage={canManage}
          onDelete={() => setDeleteTarget(rate)}
          onEdit={() => {
            setSelectedRate(rate);
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
          taxRatesQuery.error ? (
            <ErrorState title="Unable to load tax rates" description={taxRatesQuery.error.message} />
          ) : (
            <DataTable
              columns={columns}
              data={taxRatesQuery.data ?? []}
              emptyDescription="Create recoverable and payable tax rates for your tax codes and tax reports."
              emptyTitle="No tax rates yet"
              getRowKey={(rate) => rate.id}
              isLoading={taxRatesQuery.isLoading}
            />
          )
        }
        description="Configure the raw tax percentages used across sales and purchase flows."
        eyebrow="Tax"
        headerActions={
          <Button
            disabled={!canManage}
            onClick={() => {
              setSelectedRate(null);
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            New tax rate
          </Button>
        }
        title="Tax Rates"
      />

      <TaxRateFormDrawer
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
        taxRate={selectedRate}
      />

      <ConfirmDeleteDialog
        description={`This will remove ${deleteTarget?.name ?? "the selected tax rate"} from active configuration.`}
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
        title="Delete tax rate?"
      />
    </>
  );
}
