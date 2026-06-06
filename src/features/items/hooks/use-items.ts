import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createItem,
  deleteItem,
  getItem,
  getItems,
  updateItem,
} from "@/features/items/api/items.api";
import type { ItemListParams, ItemPayload } from "@/features/items/types/item.types";
import { queryClient } from "@/lib/query/query-client";

export function useItems(companyId: string | undefined, params: ItemListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "items", params],
    queryFn: () => getItems(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useItem(companyId: string | undefined, itemId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "items", itemId],
    queryFn: () => getItem(companyId!, itemId!),
    enabled: Boolean(companyId && itemId),
  });
}

export function useItemOptions(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "items", "options"],
    queryFn: () => getItems(companyId!, { includeInactive: false }),
    enabled: Boolean(companyId),
  });
}

function invalidateItemQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "items"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useCreateItem(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: ItemPayload) => createItem(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateItemQueries(companyId);
    },
  });
}

export function useUpdateItem(companyId: string | undefined, itemId: string | null) {
  return useMutation({
    mutationFn: (payload: ItemPayload) => updateItem(companyId!, itemId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateItemQueries(companyId);
    },
  });
}

export function useDeleteItem(companyId: string | undefined) {
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(companyId!, itemId),
    onSuccess: async () => {
      if (companyId) await invalidateItemQueries(companyId);
    },
  });
}
