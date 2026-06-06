import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  Account,
  AccountListParams,
  AccountPayload,
} from "@/features/accounts/types/account.types";

function buildQuery(params: AccountListParams) {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.type) query.set("type", params.type);
  if (params.includeInactive) query.set("includeInactive", "true");
  if (params.includeSystemGenerated) query.set("includeSystemGenerated", "true");
  if (params.asTree) query.set("asTree", "true");

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getAccounts(companyId: string, params: AccountListParams = {}) {
  const { data } = await apiClient.get<Account[]>(
    `/companies/${companyId}/accounts${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getAccount(companyId: string, accountId: string) {
  const { data } = await apiClient.get<Account>(
    `/companies/${companyId}/accounts/${accountId}`,
  );
  return data;
}

export async function createAccount(companyId: string, payload: AccountPayload) {
  console.log("payloadf",payload)
  const { data } = await apiClient.post<Account>(
    `/companies/${companyId}/accounts`,
    payload,
  );
  return data;
}

export async function updateAccount(
  companyId: string,
  accountId: string,
  payload: AccountPayload,
) {
  const { data } = await apiClient.patch<Account>(
    `/companies/${companyId}/accounts/${accountId}`,
    payload,
  );
  return data;
}

export async function deleteAccount(companyId: string, accountId: string) {
  await apiClient.delete(`/companies/${companyId}/accounts/${accountId}`);
}
