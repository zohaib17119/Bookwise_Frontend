import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useInventoryValuation } from "@/features/inventory/hooks/use-inventory";
import type { StockOnHandRow } from "@/features/inventory/types/inventory.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";

export function InventoryValuationPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "inventory");
  const valuationQuery = useInventoryValuation(companyId);

  if (!canView) {
    return <ErrorState title="Inventory access restricted" description="Your current company membership does not include inventory visibility." />;
  }

  const columns: DataTableColumn<StockOnHandRow>[] = [
    { key: "item", header: "Item", render: (row) => row.itemName || "-" },
    { key: "qty", header: "Quantity", render: (row) => row.quantityOnHand ?? 0 },
    { key: "cost", header: "Average cost", render: (row) => formatCurrency(row.averageUnitCost ?? 0, company?.currency ?? "USD") },
    { key: "value", header: "Value", render: (row) => formatCurrency(row.inventoryValue ?? 0, company?.currency ?? "USD") },
  ];

  return (
    <PageContainer
      header={
        <PageHeader
          description="Review inventory valuation totals and item-level value composition."
          eyebrow="Inventory"
          title="Inventory Valuation"
        />
      }
    >
      {valuationQuery.error ? (
        <ErrorState title="Unable to load inventory valuation" description={valuationQuery.error.message} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="surface p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Total inventory value</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(valuationQuery.data?.totalInventoryValue ?? 0, valuationQuery.data?.currencyCode ?? company?.currency ?? "USD")}
              </p>
            </div>
            <div className="surface p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Total quantity on hand</p>
              <p className="mt-1 text-lg font-semibold">{valuationQuery.data?.totalQuantityOnHand ?? 0}</p>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={valuationQuery.data?.rows ?? []}
            emptyDescription="No valuation rows were returned for the current company."
            emptyTitle="No inventory valuation data"
            getRowKey={(row) => row.itemId}
            isLoading={valuationQuery.isLoading}
          />
        </div>
      )}
    </PageContainer>
  );
}
