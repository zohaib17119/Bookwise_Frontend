import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type { Bill, BillListParams, BillPayload } from "@/features/bills/types/bill.types";

function buildQuery(params: BillListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getBills(companyId: string, params: BillListParams = {}) {
  const { data } = await apiClient.get<Bill[]>(
    `/companies/${companyId}/bills${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getBill(companyId: string, billId: string) {
  const { data } = await apiClient.get<Bill>(`/companies/${companyId}/bills/${billId}`);
  return data;
}

export async function createBill(companyId: string, payload: BillPayload) {
  const { data } = await apiClient.post<Bill>(`/companies/${companyId}/bills`, payload);
  return data;
}

export async function updateBill(companyId: string, billId: string, payload: BillPayload) {
  const { data } = await apiClient.patch<Bill>(
    `/companies/${companyId}/bills/${billId}`,
    payload,
  );
  return data;
}

export async function deleteBill(companyId: string, billId: string) {
  await apiClient.delete(`/companies/${companyId}/bills/${billId}`);
}
