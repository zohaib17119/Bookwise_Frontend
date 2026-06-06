import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  Vendor,
  VendorListParams,
  VendorPayload,
} from "@/features/vendors/types/vendor.types";

function buildQuery(params: VendorListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.includeInactive) query.set("includeInactive", "true");
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getVendors(companyId: string, params: VendorListParams = {}) {
  const { data } = await apiClient.get<Vendor[]>(
    `/companies/${companyId}/vendors${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getVendor(companyId: string, vendorId: string) {
  const { data } = await apiClient.get<Vendor>(
    `/companies/${companyId}/vendors/${vendorId}`,
  );
  return data;
}

export async function createVendor(companyId: string, payload: VendorPayload) {
  const { data } = await apiClient.post<Vendor>(
    `/companies/${companyId}/vendors`,
    payload,
  );
  return data;
}

export async function updateVendor(
  companyId: string,
  vendorId: string,
  payload: VendorPayload,
) {
  const { data } = await apiClient.patch<Vendor>(
    `/companies/${companyId}/vendors/${vendorId}`,
    payload,
  );
  return data;
}

export async function deleteVendor(companyId: string, vendorId: string) {
  await apiClient.delete(`/companies/${companyId}/vendors/${vendorId}`);
}
