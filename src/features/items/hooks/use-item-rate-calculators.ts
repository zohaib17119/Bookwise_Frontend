import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createItemRateCalculator,
  deleteItemRateCalculator,
  getItemRateCalculators,
  updateItemRateCalculator,
} from "@/features/items/api/item-rate-calculators.api";
import type { ItemRateCalculatorPayload } from "@/features/items/types/item-rate-calculator.types";
import { queryClient } from "@/lib/query/query-client";

export function useItemRateCalculators(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "item-rate-calculators"],
    queryFn: () => getItemRateCalculators(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateItemRateCalculator(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: ItemRateCalculatorPayload) =>
      createItemRateCalculator(companyId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "item-rate-calculators"],
        });
      }
    },
  });
}

export function useUpdateItemRateCalculator(
  companyId: string | undefined,
  calculatorId: string | null,
) {
  return useMutation({
    mutationFn: (payload: Partial<ItemRateCalculatorPayload>) =>
      updateItemRateCalculator(companyId!, calculatorId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "item-rate-calculators"],
        });
      }
    },
  });
}

export function useDeleteItemRateCalculator(companyId: string | undefined) {
  return useMutation({
    mutationFn: (calculatorId: string) => deleteItemRateCalculator(companyId!, calculatorId),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "item-rate-calculators"],
        });
      }
    },
  });
}
