import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  Reconciliation,
  ReconciliationPayload,
} from "@/features/reconciliations/types/reconciliation.types";

export async function getReconciliations(companyId: string) {
  const { data } = await apiClient.get<Reconciliation[]>(
    `/companies/${companyId}/reconciliations`,
  );
  return extractListData(data);
}

export async function getReconciliation(companyId: string, reconciliationSessionId: string) {
  const { data } = await apiClient.get<Reconciliation>(
    `/companies/${companyId}/reconciliations/${reconciliationSessionId}`,
  );
  return data;
}

export async function createReconciliation(companyId: string, payload: ReconciliationPayload) {
  const { data } = await apiClient.post<Reconciliation>(
    `/companies/${companyId}/reconciliations`,
    payload,
  );
  return data;
}

export async function clearTransactions(
  companyId: string,
  reconciliationSessionId: string,
  transactionIds: string[],
) {
  const { data } = await apiClient.post<Reconciliation>(
    `/companies/${companyId}/reconciliations/${reconciliationSessionId}/clear-transactions`,
    { transactionIds },
  );
  return data;
}

export async function unclearTransactions(
  companyId: string,
  reconciliationSessionId: string,
  transactionIds: string[],
) {
  const { data } = await apiClient.post<Reconciliation>(
    `/companies/${companyId}/reconciliations/${reconciliationSessionId}/unclear-transactions`,
    { transactionIds },
  );
  return data;
}

export async function completeReconciliation(companyId: string, reconciliationSessionId: string) {
  const { data } = await apiClient.post<Reconciliation>(
    `/companies/${companyId}/reconciliations/${reconciliationSessionId}/complete`,
  );
  return data;
}
