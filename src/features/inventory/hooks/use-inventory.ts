import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createInventoryAdjustment,
  getInventoryAdjustment,
  getInventoryAdjustments,
  getInventoryValuation,
  getStockMovements,
  getStockOnHand,
  postInventoryAdjustment,
  updateInventoryAdjustment,
  voidInventoryAdjustment,
} from "@/features/inventory/api/inventory.api";
import type {
  InventoryAdjustmentPayload,
  StockMovementParams,
} from "@/features/inventory/types/inventory.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateInventoryQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "inventory"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "items"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useStockOnHand(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "inventory", "stock-on-hand"],
    queryFn: () => getStockOnHand(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useStockMovements(companyId: string | undefined, params: StockMovementParams) {
  return useQuery({
    queryKey: ["companies", companyId, "inventory", "stock-movements", params],
    queryFn: () => getStockMovements(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useInventoryValuation(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "inventory", "valuation"],
    queryFn: () => getInventoryValuation(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useInventoryAdjustments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "inventory", "adjustments"],
    queryFn: () => getInventoryAdjustments(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useInventoryAdjustment(companyId: string | undefined, inventoryAdjustmentId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "inventory", "adjustments", inventoryAdjustmentId],
    queryFn: () => getInventoryAdjustment(companyId!, inventoryAdjustmentId!),
    enabled: Boolean(companyId && inventoryAdjustmentId),
  });
}

export function useCreateInventoryAdjustment(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: InventoryAdjustmentPayload) => createInventoryAdjustment(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateInventoryQueries(companyId);
    },
  });
}

export function useUpdateInventoryAdjustment(companyId: string | undefined, inventoryAdjustmentId: string | null) {
  return useMutation({
    mutationFn: (payload: InventoryAdjustmentPayload) =>
      updateInventoryAdjustment(companyId!, inventoryAdjustmentId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateInventoryQueries(companyId);
    },
  });
}

export function usePostInventoryAdjustment(companyId: string | undefined) {
  return useMutation({
    mutationFn: (inventoryAdjustmentId: string) => postInventoryAdjustment(companyId!, inventoryAdjustmentId),
    onSuccess: async () => {
      if (companyId) await invalidateInventoryQueries(companyId);
    },
  });
}

export function useVoidInventoryAdjustment(companyId: string | undefined) {
  return useMutation({
    mutationFn: (inventoryAdjustmentId: string) => voidInventoryAdjustment(companyId!, inventoryAdjustmentId),
    onSuccess: async () => {
      if (companyId) await invalidateInventoryQueries(companyId);
    },
  });
}
