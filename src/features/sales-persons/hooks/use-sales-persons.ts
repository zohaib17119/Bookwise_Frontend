import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createSalesPerson,
  deleteSalesPerson,
  getSalesPersons,
  updateSalesPerson,
} from "@/features/sales-persons/api/sales-persons.api";
import type { SalesPersonPayload } from "@/features/sales-persons/types/sales-person.types";
import { queryClient } from "@/lib/query/query-client";

export function useSalesPersons(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "sales-persons"],
    queryFn: () => getSalesPersons(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateSalesPerson(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: SalesPersonPayload) => createSalesPerson(companyId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "sales-persons"],
        });
      }
    },
  });
}

export function useUpdateSalesPerson(
  companyId: string | undefined,
  salesPersonId: string | null,
) {
  return useMutation({
    mutationFn: (payload: Partial<SalesPersonPayload>) =>
      updateSalesPerson(companyId!, salesPersonId!, payload),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "sales-persons"],
        });
      }
    },
  });
}

export function useDeleteSalesPerson(companyId: string | undefined) {
  return useMutation({
    mutationFn: (salesPersonId: string) => deleteSalesPerson(companyId!, salesPersonId),
    onSuccess: async () => {
      if (companyId) {
        await queryClient.invalidateQueries({
          queryKey: ["companies", companyId, "sales-persons"],
        });
      }
    },
  });
}
