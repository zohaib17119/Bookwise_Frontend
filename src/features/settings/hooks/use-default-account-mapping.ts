import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getDefaultAccountMapping,
  upsertDefaultAccountMapping,
  type DefaultAccountMappingPayload,
} from "@/features/settings/api/default-account-mapping.api";
import { queryClient } from "@/lib/query/query-client";

export function useDefaultAccountMapping(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "default-account-mapping"],
    queryFn: () => getDefaultAccountMapping(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useUpsertDefaultAccountMapping(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: DefaultAccountMappingPayload) =>
      upsertDefaultAccountMapping(companyId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "default-account-mapping"],
        });
      }
    },
  });
}
