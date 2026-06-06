import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InventoryStatusBadge } from "@/components/accounting/inventory-status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useInventoryAdjustments } from "@/features/inventory/hooks/use-inventory";
import type { InventoryAdjustment } from "@/features/inventory/types/inventory.types";
import { canManageEntity, canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatDate } from "@/lib/utils/format";

export function InventoryAdjustmentsPage() {
  const { companyId, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "inventory");
  const canManage = canManageEntity(permissions, "inventory");
  const adjustmentsQuery = useInventoryAdjustments(companyId);

  if (!canView) {
    return <ErrorState title="Inventory access restricted" description="Your current company membership does not include inventory visibility." />;
  }

  const columns: DataTableColumn<InventoryAdjustment>[] = [
    {
      key: "id",
      header: "Adjustment",
      render: (adjustment) => (
        <Link className="font-medium text-primary hover:underline" to={`/app/company/${companyId}/inventory/adjustments/${adjustment.id}`}>
          {adjustment.id}
        </Link>
      ),
    },
    { key: "date", header: "Date", render: (adjustment) => formatDate(adjustment.adjustmentDate) },
    { key: "reason", header: "Reason", render: (adjustment) => adjustment.reason || "-" },
    { key: "lines", header: "Lines", render: (adjustment) => adjustment.lines?.length ?? 0 },
    { key: "status", header: "Status", render: (adjustment) => <InventoryStatusBadge status={adjustment.status} /> },
  ];

  return (
    <EntityListPage
      content={
        adjustmentsQuery.error ? (
          <ErrorState title="Unable to load inventory adjustments" description={adjustmentsQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={adjustmentsQuery.data ?? []}
            emptyDescription="Create draft adjustments to correct quantity and valuation discrepancies."
            emptyTitle="No inventory adjustments yet"
            getRowKey={(adjustment) => adjustment.id}
            isLoading={adjustmentsQuery.isLoading}
          />
        )
      }
      description="Manage manual inventory corrections, postings, and voided stock adjustments."
      eyebrow="Inventory"
      headerActions={
        <Button asChild disabled={!canManage}>
          <Link to={`/app/company/${companyId}/inventory/adjustments/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New adjustment
          </Link>
        </Button>
      }
      title="Inventory Adjustments"
    />
  );
}
