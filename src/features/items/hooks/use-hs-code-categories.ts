import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createHsCodeCategory,
  getHsCodeCategories,
  updateHsCodeCategory,
} from "@/features/items/api/hs-code-categories.api";
import type { HsCodeCategoryPayload } from "@/features/items/types/hs-code-category.types";
import { queryClient } from "@/lib/query/query-client";

export function useHsCodeCategories(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "hs-code-categories"],
    queryFn: () => getHsCodeCategories(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateHsCodeCategory(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: HsCodeCategoryPayload) => createHsCodeCategory(companyId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "hs-code-categories"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "items"],
        });
      }
    },
  });
}

export function useUpdateHsCodeCategory(
  companyId: string | undefined,
  hsCodeCategoryId: string | null,
) {
  return useMutation({
    mutationFn: (payload: Partial<HsCodeCategoryPayload>) =>
      updateHsCodeCategory(companyId!, hsCodeCategoryId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "hs-code-categories"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "items"],
        });
      }
    },
  });
}
