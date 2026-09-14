import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adoptFbrHsCode,
  listFbrHsUoms,
  listFbrRefHsCodes,
  listFbrRefProvinces,
  listFbrRefSaleTypes,
  listFbrRefUoms,
  syncFbrReference,
} from "@/features/settings/api/fbr-reference.api";

export function useFbrRefProvinces(companyId: string | undefined, q = "", enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "fbr-ref", "provinces", q],
    queryFn: () => listFbrRefProvinces(companyId!, { q: q || undefined, limit: 50 }),
    enabled: Boolean(companyId) && enabled,
    staleTime: 60_000,
  });
}

export function useFbrRefHsCodes(companyId: string | undefined, q = "", enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "fbr-ref", "hs-codes", q],
    queryFn: () => listFbrRefHsCodes(companyId!, { q: q || undefined, page: 1, limit: 40 }),
    enabled: Boolean(companyId) && enabled,
    staleTime: 30_000,
  });
}

export function useFbrRefUoms(companyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "fbr-ref", "uoms"],
    queryFn: () => listFbrRefUoms(companyId!, { limit: 200 }),
    enabled: Boolean(companyId) && enabled,
    staleTime: 60_000,
  });
}

export function useFbrRefSaleTypes(companyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "fbr-ref", "sale-types"],
    queryFn: () => listFbrRefSaleTypes(companyId!, { limit: 200 }),
    enabled: Boolean(companyId) && enabled,
    staleTime: 60_000,
  });
}

export function useFbrHsUoms(
  companyId: string | undefined,
  hsCode: string,
  annexureId?: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ["companies", companyId, "fbr-ref", "hs-uom", hsCode, annexureId ?? null],
    queryFn: () => listFbrHsUoms(companyId!, { hsCode, annexureId }),
    enabled: Boolean(companyId) && Boolean(hsCode.trim()) && enabled,
    staleTime: 60_000,
  });
}

export function useSyncFbrReference(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncFbrReference(companyId!),
    onSuccess: async () => {
      if (!companyId) return;
      await queryClient.invalidateQueries({ queryKey: ["companies", companyId, "fbr-ref"] });
    },
  });
}

export function useAdoptFbrHsCode(companyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { hsCode: string; description?: string }) =>
      adoptFbrHsCode(companyId!, payload),
    onSuccess: async () => {
      if (!companyId) return;
      await queryClient.invalidateQueries({
        queryKey: ["companies", companyId, "hs-code-categories"],
      });
    },
  });
}
