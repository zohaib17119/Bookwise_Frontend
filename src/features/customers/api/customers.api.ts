import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  Customer,
  CustomerListParams,
  CustomerPayload,
} from "@/features/customers/types/customer.types";

function buildQuery(params: CustomerListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.includeInactive) query.set("includeInactive", "true");
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getCustomers(companyId: string, params: CustomerListParams = {}) {
  const { data } = await apiClient.get<Customer[]>(
    `/companies/${companyId}/customers${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getCustomer(companyId: string, customerId: string) {
  const { data } = await apiClient.get<Customer>(
    `/companies/${companyId}/customers/${customerId}`,
  );
  return data;
}

export async function createCustomer(companyId: string, payload: CustomerPayload) {
  const { data } = await apiClient.post<Customer>(
    `/companies/${companyId}/customers`,
    payload,
  );
  return data;
}

export async function updateCustomer(
  companyId: string,
  customerId: string,
  payload: CustomerPayload,
) {
  const { data } = await apiClient.patch<Customer>(
    `/companies/${companyId}/customers/${customerId}`,
    payload,
  );
  return data;
}

export async function deleteCustomer(companyId: string, customerId: string) {
  await apiClient.delete(`/companies/${companyId}/customers/${customerId}`);
}
