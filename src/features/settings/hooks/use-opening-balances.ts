import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getOpeningBalances,
  saveOpeningBalances,
  type OpeningBalancesPayload,
} from "@/features/settings/api/opening-balances.api";
import { queryClient } from "@/lib/query/query-client";

export function useOpeningBalances(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "opening-balances"],
    queryFn: () => getOpeningBalances(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useSaveOpeningBalances(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: OpeningBalancesPayload) => saveOpeningBalances(companyId!, payload),
    onSuccess: async () => {
      if (!companyId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["companies", companyId, "opening-balances"] }),
        queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["companies", companyId, "journals"] }),
      ]);
    },
  });
}
