import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  Estimate,
  EstimateListParams,
  EstimatePayload,
} from "@/features/estimates/types/estimate.types";

function buildQuery(params: EstimateListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.customerId) query.set("customerId", params.customerId);
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getEstimates(companyId: string, params: EstimateListParams = {}) {
  const { data } = await apiClient.get<Estimate[]>(
    `/companies/${companyId}/estimates${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getEstimate(companyId: string, estimateId: string) {
  const { data } = await apiClient.get<Estimate>(
    `/companies/${companyId}/estimates/${estimateId}`,
  );
  return data;
}

export async function createEstimate(companyId: string, payload: EstimatePayload) {
  const { data } = await apiClient.post<Estimate>(
    `/companies/${companyId}/estimates`,
    payload,
  );
  return data;
}

export async function updateEstimate(
  companyId: string,
  estimateId: string,
  payload: EstimatePayload,
) {
  const { data } = await apiClient.patch<Estimate>(
    `/companies/${companyId}/estimates/${estimateId}`,
    payload,
  );
  return data;
}

export async function deleteEstimate(companyId: string, estimateId: string) {
  await apiClient.delete(`/companies/${companyId}/estimates/${estimateId}`);
}

export async function convertEstimateToInvoice(companyId: string, estimateId: string) {
  const { data } = await apiClient.post<{ invoiceId?: string }>(
    `/companies/${companyId}/estimates/${estimateId}/convert-to-invoice`,
  );
  return data;
}
