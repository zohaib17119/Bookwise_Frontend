import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  BankAccount,
  BankAccountPayload,
  BankTransaction,
  BankTransactionListParams,
  BankTransactionPayload,
} from "@/features/banking/types/banking.types";

function buildTransactionQuery(params: BankTransactionListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.bankAccountId) query.set("bankAccountId", params.bankAccountId);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (typeof params.isMatched === "boolean") query.set("isMatched", String(params.isMatched));
  if (typeof params.isCleared === "boolean") query.set("isCleared", String(params.isCleared));
  if (params.type) query.set("type", params.type);
  if (params.direction) query.set("direction", params.direction);
  if (params.source) query.set("source", params.source);
  return query.toString() ? `?${query.toString()}` : "";
}

export async function getBankAccounts(companyId: string) {
  const { data } = await apiClient.get<BankAccount[]>(`/companies/${companyId}/bank-accounts`);
  return extractListData(data);
}

export async function createBankAccount(companyId: string, payload: BankAccountPayload) {
  const { data } = await apiClient.post<BankAccount>(`/companies/${companyId}/bank-accounts`, payload);
  return data;
}

export async function updateBankAccount(companyId: string, bankAccountId: string, payload: BankAccountPayload) {
  const { data } = await apiClient.patch<BankAccount>(
    `/companies/${companyId}/bank-accounts/${bankAccountId}`,
    payload,
  );
  return data;
}

export async function deleteBankAccount(companyId: string, bankAccountId: string) {
  await apiClient.delete(`/companies/${companyId}/bank-accounts/${bankAccountId}`);
}

export async function getBankTransactions(companyId: string, params: BankTransactionListParams = {}) {
  const { data } = await apiClient.get<BankTransaction[]>(
    `/companies/${companyId}/bank-transactions${buildTransactionQuery(params)}`,
  );
  return extractListData(data);
}

export async function getBankTransaction(companyId: string, bankTransactionId: string) {
  const { data } = await apiClient.get<BankTransaction>(
    `/companies/${companyId}/bank-transactions/${bankTransactionId}`,
  );
  return data;
}

export async function createBankTransaction(companyId: string, payload: BankTransactionPayload) {
  const { data } = await apiClient.post<BankTransaction>(
    `/companies/${companyId}/bank-transactions`,
    payload,
  );
  return data;
}

export async function updateBankTransaction(companyId: string, bankTransactionId: string, payload: BankTransactionPayload) {
  const { data } = await apiClient.patch<BankTransaction>(
    `/companies/${companyId}/bank-transactions/${bankTransactionId}`,
    payload,
  );
  return data;
}

export async function deleteBankTransaction(companyId: string, bankTransactionId: string) {
  await apiClient.delete(`/companies/${companyId}/bank-transactions/${bankTransactionId}`);
}

export async function getUnmatchedBankTransactions(companyId: string) {
  const { data } = await apiClient.get<BankTransaction[]>(
    `/companies/${companyId}/bank-transactions/unmatched`,
  );
  return extractListData(data);
}

export async function matchBankTransaction(companyId: string, bankTransactionId: string) {
  const { data } = await apiClient.post<BankTransaction>(
    `/companies/${companyId}/bank-transactions/${bankTransactionId}/match`,
  );
  return data;
}

export async function unmatchBankTransaction(companyId: string, bankTransactionId: string) {
  const { data } = await apiClient.post<BankTransaction>(
    `/companies/${companyId}/bank-transactions/${bankTransactionId}/unmatch`,
  );
  return data;
}
