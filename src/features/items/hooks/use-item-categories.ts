import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createItemCategory,
  deleteItemCategory,
  getItemCategories,
  updateItemCategory,
} from "@/features/items/api/item-categories.api";
import type { ItemCategoryPayload } from "@/features/items/types/item-category.types";
import { queryClient } from "@/lib/query/query-client";

export function useItemCategories(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "item-categories"],
    queryFn: () => getItemCategories(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateItemCategory(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: ItemCategoryPayload) => createItemCategory(companyId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "item-categories"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "items"],
        });
      }
    },
  });
}

export function useUpdateItemCategory(
  companyId: string | undefined,
  itemCategoryId: string | null,
) {
  return useMutation({
    mutationFn: (payload: Partial<ItemCategoryPayload>) =>
      updateItemCategory(companyId!, itemCategoryId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "item-categories"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "items"],
        });
      }
    },
  });
}

export function useDeleteItemCategory(companyId: string | undefined) {
  return useMutation({
    mutationFn: (itemCategoryId: string) => deleteItemCategory(companyId!, itemCategoryId),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "item-categories"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "items"],
        });
      }
    },
  });
}
