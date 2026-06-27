import { useDeferredValue, useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { InventoryMovementTable } from "@/components/accounting/inventory-movement-table";
import { DateRangeToolbar } from "@/components/accounting/date-range-toolbar";
import { EntityListPage } from "@/components/shared/entity-list-page";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { useActiveCompany } from "@/features/companies/hooks/use-active-company";
import { useItemOptions } from "@/features/items/hooks/use-items";
import { useStockMovements } from "@/features/inventory/hooks/use-inventory";
import { canViewEntity } from "@/features/permissions/utils/module-permissions";

export function StockMovementsPage() {
  const { companyId, company, permissions } = useActiveCompany();
  const canView = canViewEntity(permissions, "inventory");
  const [search, setSearch] = useState("");
  const [itemId, setItemId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [movementType, setMovementType] = useState("");
  const [direction, setDirection] = useState("");
  const [sourceModule, setSourceModule] = useState("");
  const deferredSearch = useDeferredValue(search);
  const itemsQuery = useItemOptions(companyId);

  const filters = useMemo(
    () => ({
      search: deferredSearch.trim() || undefined,
      itemId: itemId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      movementType: movementType || undefined,
      direction: direction || undefined,
      sourceModule: sourceModule || undefined,
    }),
    [deferredSearch, direction, fromDate, itemId, movementType, sourceModule, toDate],
  );

  const movementsQuery = useStockMovements(companyId, filters);

  if (!canView) {
    return <ErrorState title="Inventory access restricted" description="Your current company membership does not include inventory visibility." />;
  }

  return (
    <EntityListPage
      content={
        movementsQuery.error ? (
          <ErrorState title="Unable to load stock movements" description={movementsQuery.error.message} />
        ) : movementsQuery.isLoading ? (
          <div className="surface p-6">Loading stock movements...</div>
        ) : (
          <InventoryMovementTable currencyCode={company?.baseCurrencyCode ?? company?.currencyCode} data={movementsQuery.data ?? []} />
        )
      }
      description="Inspect inventory movement history by item, source, and direction."
      eyebrow="Inventory"
      title="Stock Movements"
      toolbar={
        <FilterBar>
          <SearchInput onChange={setSearch} placeholder="Search movement or source" value={search} />
          <Select className="min-w-[180px]" onChange={(event) => setItemId(event.target.value)} value={itemId}>
            <option value="">All items</option>
            {(itemsQuery.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <DateRangeToolbar fromDate={fromDate} onFromDateChange={setFromDate} onToDateChange={setToDate} toDate={toDate} />
          <Select className="min-w-[160px]" onChange={(event) => setMovementType(event.target.value)} value={movementType}>
            <option value="">Movement type</option>
            <option value="sale">Sale</option>
            <option value="purchase">Purchase</option>
            <option value="adjustment">Adjustment</option>
            <option value="transfer">Transfer</option>
          </Select>
          <Select className="min-w-[140px]" onChange={(event) => setDirection(event.target.value)} value={direction}>
            <option value="">Direction</option>
            <option value="IN">In</option>
            <option value="OUT">Out</option>
          </Select>
          <Select className="min-w-[160px]" onChange={(event) => setSourceModule(event.target.value)} value={sourceModule}>
            <option value="">Source module</option>
            <option value="inventory-adjustment">Inventory adjustment</option>
            <option value="invoice">Invoice</option>
            <option value="bill">Bill</option>
          </Select>
        </FilterBar>
      }
    />
  );
}
