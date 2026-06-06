import { useMutation, useQuery } from "@tanstack/react-query";
import {
  clearTransactions,
  completeReconciliation,
  createReconciliation,
  getReconciliation,
  getReconciliations,
  unclearTransactions,
} from "@/features/reconciliations/api/reconciliations.api";
import type { ReconciliationPayload } from "@/features/reconciliations/types/reconciliation.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateReconciliationQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "reconciliations"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bank-transactions"] }),
  ]);
}

export function useReconciliations(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "reconciliations"],
    queryFn: () => getReconciliations(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useReconciliation(companyId: string | undefined, reconciliationSessionId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "reconciliations", reconciliationSessionId],
    queryFn: () => getReconciliation(companyId!, reconciliationSessionId!),
    enabled: Boolean(companyId && reconciliationSessionId),
  });
}

export function useCreateReconciliation(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: ReconciliationPayload) => createReconciliation(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateReconciliationQueries(companyId);
    },
  });
}

export function useClearTransactions(companyId: string | undefined, reconciliationSessionId: string | null) {
  return useMutation({
    mutationFn: (transactionIds: string[]) =>
      clearTransactions(companyId!, reconciliationSessionId!, transactionIds),
    onSuccess: async () => {
      if (companyId) await invalidateReconciliationQueries(companyId);
    },
  });
}

export function useUnclearTransactions(companyId: string | undefined, reconciliationSessionId: string | null) {
  return useMutation({
    mutationFn: (transactionIds: string[]) =>
      unclearTransactions(companyId!, reconciliationSessionId!, transactionIds),
    onSuccess: async () => {
      if (companyId) await invalidateReconciliationQueries(companyId);
    },
  });
}

export function useCompleteReconciliation(companyId: string | undefined, reconciliationSessionId: string | null) {
  return useMutation({
    mutationFn: () => completeReconciliation(companyId!, reconciliationSessionId!),
    onSuccess: async () => {
      if (companyId) await invalidateReconciliationQueries(companyId);
    },
  });
}
