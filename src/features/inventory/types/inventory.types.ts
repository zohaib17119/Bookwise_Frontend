import type { BaseEntityListParams } from "@/features/shared/types/common";

export interface StockOnHandRow {
  itemId: string;
  itemName?: string | null;
  sku?: string | null;
  quantityOnHand?: number | null;
  averageUnitCost?: number | null;
  inventoryValue?: number | null;
  reorderLevel?: number | null;
  lowStock?: boolean;
}

export interface StockMovement {
  id: string;
  itemId?: string | null;
  itemName?: string | null;
  movementDate?: string | null;
  movementType?: string | null;
  direction?: string | null;
  quantity?: number | null;
  unitCost?: number | null;
  sourceModule?: string | null;
}

export interface InventoryValuationSummary {
  totalInventoryValue?: number | null;
  totalQuantityOnHand?: number | null;
  currencyCode?: string | null;
  rows?: StockOnHandRow[];
}

export interface InventoryAdjustmentLine {
  id?: string;
  itemId: string;
  itemName?: string | null;
  quantity: number;
  direction: "IN" | "OUT";
  unitCost?: number | null;
  notes?: string | null;
}

export interface InventoryAdjustment {
  id: string;
  adjustmentDate?: string | null;
  reason?: string | null;
  notes?: string | null;
  status?: "DRAFT" | "POSTED" | "VOID" | null;
  lines: InventoryAdjustmentLine[];
}

export interface InventoryAdjustmentPayload {
  adjustmentDate?: string;
  reason?: string;
  notes?: string;
  lines: InventoryAdjustmentLine[];
}

export interface StockMovementParams extends BaseEntityListParams {
  itemId?: string;
  fromDate?: string;
  toDate?: string;
  movementType?: string;
  direction?: string;
  sourceModule?: string;
}
