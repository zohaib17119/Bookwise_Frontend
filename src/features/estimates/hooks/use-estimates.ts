import { useMutation, useQuery } from "@tanstack/react-query";
import {
  convertEstimateToInvoice,
  createEstimate,
  deleteEstimate,
  getEstimate,
  getEstimates,
  updateEstimate,
} from "@/features/estimates/api/estimates.api";
import type {
  EstimateListParams,
  EstimatePayload,
} from "@/features/estimates/types/estimate.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateEstimateQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "estimates"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useEstimates(companyId: string | undefined, params: EstimateListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "estimates", params],
    queryFn: () => getEstimates(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useEstimatesByCustomer(companyId: string | undefined, customerId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "estimates", "by-customer", customerId],
    queryFn: () => getEstimates(companyId!, { customerId, status: "ACCEPTED" }),
    enabled: Boolean(companyId && customerId),
  });
}

export function useEstimate(companyId: string | undefined, estimateId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "estimates", estimateId],
    queryFn: () => getEstimate(companyId!, estimateId!),
    enabled: Boolean(companyId && estimateId),
  });
}

export function useCreateEstimate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: EstimatePayload) => createEstimate(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateEstimateQueries(companyId);
    },
  });
}

export function useUpdateEstimate(companyId: string | undefined, estimateId: string | null) {
  return useMutation({
    mutationFn: (payload: EstimatePayload) =>
      updateEstimate(companyId!, estimateId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateEstimateQueries(companyId);
    },
  });
}

export function useDeleteEstimate(companyId: string | undefined) {
  return useMutation({
    mutationFn: (estimateId: string) => deleteEstimate(companyId!, estimateId),
    onSuccess: async () => {
      if (companyId) await invalidateEstimateQueries(companyId);
    },
  });
}

export function useConvertEstimateToInvoice(companyId: string | undefined) {
  return useMutation({
    mutationFn: (estimateId: string) => convertEstimateToInvoice(companyId!, estimateId),
    onSuccess: async () => {
      if (companyId) {
        await Promise.all([
          invalidateEstimateQueries(companyId),
          queryClient.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] }),
        ]);
      }
    },
  });
}
