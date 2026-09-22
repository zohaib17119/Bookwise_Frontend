import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adoptFbrHsCode,
  listFbrHsUoms,
  listFbrRefHsCodes,
  listFbrRefProvinces,
  listFbrRefSaleTypes,
  listFbrRefUoms,
  listFbrSaleTypeRates,
  listFbrSroItems,
  listFbrSroSchedules,
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
    queryFn: () => listFbrRefSaleTypes(companyId!, { limit: 300 }),
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

export function useFbrSaleTypeRates(
  companyId: string | undefined,
  saleType: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["companies", companyId, "fbr-ref", "sale-type-rates", saleType],
    queryFn: () => listFbrSaleTypeRates(companyId!, { saleType }),
    enabled: Boolean(companyId) && Boolean(saleType.trim()) && enabled,
    staleTime: 60_000,
  });
}

export function useFbrSroSchedules(
  companyId: string | undefined,
  rateId: number | null,
  rateDescription?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "companies",
      companyId,
      "fbr-ref",
      "sro-schedules",
      rateId,
      rateDescription ?? "",
    ],
    queryFn: () =>
      listFbrSroSchedules(companyId!, {
        rateId: rateId!,
        rateDescription: rateDescription || undefined,
      }),
    enabled: Boolean(companyId) && rateId != null && rateId > 0 && enabled,
    staleTime: 60_000,
  });
}

export function useFbrSroItems(
  companyId: string | undefined,
  sroId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["companies", companyId, "fbr-ref", "sro-items", sroId],
    queryFn: () => listFbrSroItems(companyId!, { sroId: sroId! }),
    enabled: Boolean(companyId) && sroId != null && sroId > 0 && enabled,
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
