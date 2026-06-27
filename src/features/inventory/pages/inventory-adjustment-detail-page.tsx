import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AccountingActionBar } from "@/components/accounting/accounting-action-bar";
import { InventoryStatusBadge } from "@/components/accounting/inventory-status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import {
  useInventoryAdjustment,
  usePostInventoryAdjustment,
  useVoidInventoryAdjustment,
} from "@/features/inventory/hooks/use-inventory";
import type { InventoryAdjustmentLine } from "@/features/inventory/types/inventory.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export function InventoryAdjustmentDetailPage() {
  const { companyId, inventoryAdjustmentId } = useParams();
  const { company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "inventory");
  const canManage = canManageEntity(permissions, "inventory");
  const [confirmMode, setConfirmMode] = useState<"post" | "void" | null>(null);
  const adjustmentQuery = useInventoryAdjustment(companyId, inventoryAdjustmentId ?? null);
  const postMutation = usePostInventoryAdjustment(companyId);
  const voidMutation = useVoidInventoryAdjustment(companyId);

  if (!canView) {
    return <ErrorState title="Inventory access restricted" description="Your current company membership does not include inventory visibility." />;
  }

  if (adjustmentQuery.isLoading) {
    return <PageContainer><div className="surface p-6">Loading inventory adjustment...</div></PageContainer>;
  }

  if (adjustmentQuery.error || !adjustmentQuery.data) {
    return <ErrorState title="Inventory adjustment not found" description={adjustmentQuery.error?.message ?? "The requested adjustment is unavailable."} />;
  }

  const adjustment = adjustmentQuery.data;
  const mutation = confirmMode === "post" ? postMutation : voidMutation;

  const columns: DataTableColumn<InventoryAdjustmentLine>[] = [
    { key: "item", header: "Item", render: (line) => line.itemName || line.itemId },
    { key: "direction", header: "Direction", render: (line) => line.direction },
    { key: "quantity", header: "Quantity", render: (line) => line.quantity },
    { key: "cost", header: "Unit cost", render: (line) => formatCurrency(line.unitCost ?? 0, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD") },
    { key: "notes", header: "Notes", render: (line) => line.notes || "-" },
  ];

  return (
    <PageContainer
      header={
        <PageHeader
          actions={<InventoryStatusBadge status={adjustment.status} />}
          description="Review adjustment lines, posting state, and resulting inventory corrections."
          eyebrow="Inventory"
          title={adjustment.id}
        />
      }
    >
      {(postMutation.error || voidMutation.error) ? (
        <Alert title={postMutation.error?.message || voidMutation.error?.message || "Operation failed"} variant="destructive" />
      ) : null}

      <AccountingActionBar
        actions={
          <>
            <Button asChild variant="ghost">
              <Link to={`/app/company/${companyId}/inventory/adjustments`}>Back to adjustments</Link>
            </Button>
            {canManage && adjustment.status === "DRAFT" ? (
              <Button asChild variant="secondary">
                <Link to={`/app/company/${companyId}/inventory/adjustments/${adjustment.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
            {canManage && adjustment.status === "DRAFT" ? (
              <Button onClick={() => setConfirmMode("post")} type="button">Post adjustment</Button>
            ) : null}
            {canManage && adjustment.status === "POSTED" ? (
              <Button onClick={() => setConfirmMode("void")} type="button" variant="secondary">Void adjustment</Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Adjustment date</p>
          <p className="mt-1 text-sm font-medium">{formatDate(adjustment.adjustmentDate)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Reason</p>
          <p className="mt-1 text-sm font-medium">{adjustment.reason || "-"}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Lines</p>
          <p className="mt-1 text-sm font-medium">{adjustment.lines?.length ?? 0}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-medium">{adjustment.status || "-"}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={adjustment.lines ?? []}
        emptyDescription="No lines were returned for this adjustment."
        emptyTitle="No adjustment lines"
        getRowKey={(line) => line.id ?? `${line.itemId}-${line.direction}-${line.quantity}`}
        isLoading={false}
      />

      <ConfirmDeleteDialog
        description={confirmMode === "post" ? "Posting finalizes the stock movement adjustments." : "Voiding reverses the posted adjustment per backend rules."}
        isPending={mutation.isPending}
        onClose={() => {
          setConfirmMode(null);
          mutation.reset();
        }}
        onConfirm={async () => {
          if (confirmMode === "post") {
            await postMutation.mutateAsync(adjustment.id);
          } else if (confirmMode === "void") {
            await voidMutation.mutateAsync(adjustment.id);
          }
          setConfirmMode(null);
        }}
        open={Boolean(confirmMode)}
        title={confirmMode === "post" ? "Post inventory adjustment?" : "Void inventory adjustment?"}
      />
    </PageContainer>
  );
}
