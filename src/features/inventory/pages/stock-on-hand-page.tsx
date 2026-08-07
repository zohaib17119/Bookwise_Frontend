import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { InventoryStatusBadge } from "@/components/accounting/inventory-status-badge";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useStockOnHand } from "@/features/inventory/hooks/use-inventory";
import type { StockOnHandRow } from "@/features/inventory/types/inventory.types";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";
import { formatCurrency } from "@/lib/utils/format";

export function StockOnHandPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "inventory");
  const stockOnHandQuery = useStockOnHand(companyId);
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(
    () =>
      (stockOnHandQuery.data ?? []).filter((row) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return [row.itemName, row.sku].some((value) => value?.toLowerCase().includes(term));
      }),
    [search, stockOnHandQuery.data],
  );

  if (!canView) {
    return <ErrorState title="Inventory access restricted" description="Your current company membership does not include inventory visibility." />;
  }

  const columns: DataTableColumn<StockOnHandRow>[] = [
    {
      key: "item",
      header: "Item",
      render: (row) => (
        <div>
          <p className="font-medium">{row.itemName || "-"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.sku || "-"}</p>
        </div>
      ),
    },
    { key: "quantity", header: "Quantity on hand", render: (row) => row.quantityOnHand ?? 0 },
    { key: "cost", header: "Average unit cost", render: (row) => formatCurrency(row.averageUnitCost ?? 0, company?.baseCurrencyCode ?? company?.currencyCode ?? "USD") },
    { key: "value", header: "Inventory value", render: (row) => formatCurrency(row.inventoryValue ?? "0.00", company?.baseCurrencyCode ?? company?.currencyCode ?? "USD") },
    {
      key: "status",
      header: "Status",
      render: (row) => <InventoryStatusBadge lowStock={row.lowStock} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        companyId && row.lowStock ? (
          <Button asChild size="sm" variant="outline">
            <Link
              to={`/app/company/${companyId}/bills/new?itemId=${row.itemId}&qty=${Math.max(1, Number(row.reorderLevel ?? 0) - Number(row.quantityOnHand ?? 0))}&from=low-stock`}
            >
              Buy Stock
            </Link>
          </Button>
        ) : null,
    },
  ];

  return (
    <EntityListPage
      content={
        stockOnHandQuery.error ? (
          <ErrorState title="Unable to load stock on hand" description={stockOnHandQuery.error.message} />
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            emptyDescription="Buy stock with a vendor bill (Issue → Receive goods) or post an inventory adjustment for non-purchase corrections."
            emptyTitle="No stock on hand data"
            getRowKey={(row) => row.itemId}
            isLoading={stockOnHandQuery.isLoading}
          />
        )
      }
      description="Review quantities and low-stock signals. Purchased stock: Vendor Bill → Issue → Receive goods. Adjustments are for corrections only."
      eyebrow="Inventory"
      title="Stock on Hand"
      toolbar={
        <FilterBar>
          <SearchInput onChange={setSearch} placeholder="Search item or SKU" value={search} />
          {companyId ? (
            <>
              <Button asChild size="sm" variant="primary">
                <Link to={`/app/company/${companyId}/bills/new?from=buy-stock`}>Buy Stock</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/app/company/${companyId}/inventory/adjustments/new`}>Adjustment only</Link>
              </Button>
            </>
          ) : null}
        </FilterBar>
      }
    />
  );
}
