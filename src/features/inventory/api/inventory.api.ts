import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  InventoryAdjustment,
  InventoryAdjustmentPayload,
  InventoryValuationSummary,
  StockMovement,
  StockMovementParams,
  StockOnHandRow,
} from "@/features/inventory/types/inventory.types";

function buildMovementQuery(params: StockMovementParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.itemId) query.set("itemId", params.itemId);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.movementType) query.set("movementType", params.movementType);
  if (params.direction) query.set("direction", params.direction);
  if (params.sourceModule) query.set("sourceModule", params.sourceModule);
  return query.toString() ? `?${query.toString()}` : "";
}

export async function getStockOnHand(companyId: string) {
  const { data } = await apiClient.get<StockOnHandRow[]>(
    `/companies/${companyId}/inventory/stock-on-hand`,
  );
  return extractListData(data);
}

export async function getStockMovements(companyId: string, params: StockMovementParams = {}) {
  const { data } = await apiClient.get<StockMovement[]>(
    `/companies/${companyId}/stock-movements${buildMovementQuery(params)}`,
  );
  return extractListData(data);
}

export async function getInventoryValuation(companyId: string) {
  const { data } = await apiClient.get<InventoryValuationSummary>(
    `/companies/${companyId}/inventory/valuation-summary`,
  );
  return data;
}

export async function getInventoryAdjustments(companyId: string) {
  const { data } = await apiClient.get<InventoryAdjustment[]>(
    `/companies/${companyId}/inventory-adjustments`,
  );
  return extractListData(data);
}

export async function getInventoryAdjustment(companyId: string, inventoryAdjustmentId: string) {
  const { data } = await apiClient.get<InventoryAdjustment>(
    `/companies/${companyId}/inventory-adjustments/${inventoryAdjustmentId}`,
  );
  return data;
}

export async function createInventoryAdjustment(
  companyId: string,
  payload: InventoryAdjustmentPayload,
) {
  const { data } = await apiClient.post<InventoryAdjustment>(
    `/companies/${companyId}/inventory-adjustments`,
    payload,
  );
  return data;
}

export async function updateInventoryAdjustment(
  companyId: string,
  inventoryAdjustmentId: string,
  payload: InventoryAdjustmentPayload,
) {
  const { data } = await apiClient.patch<InventoryAdjustment>(
    `/companies/${companyId}/inventory-adjustments/${inventoryAdjustmentId}`,
    payload,
  );
  return data;
}

export async function postInventoryAdjustment(companyId: string, inventoryAdjustmentId: string) {
  const { data } = await apiClient.post<InventoryAdjustment>(
    `/companies/${companyId}/inventory-adjustments/${inventoryAdjustmentId}/post`,
  );
  return data;
}

export async function voidInventoryAdjustment(companyId: string, inventoryAdjustmentId: string) {
  const { data } = await apiClient.post<InventoryAdjustment>(
    `/companies/${companyId}/inventory-adjustments/${inventoryAdjustmentId}/void`,
  );
  return data;
}
