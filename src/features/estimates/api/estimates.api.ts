import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  Estimate,
  EstimateLine,
  EstimateListParams,
  EstimatePayload,
  ConvertEstimateToInvoicePayload,
} from "@/features/estimates/types/estimate.types";
import { omitEmptyFields, serializeDocumentLineMoney } from "@/features/shared/utils/api-payload";
import { toOptionalDecimalString } from "@/features/shared/utils/decimal-string";

function buildQuery(params: EstimateListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.customerId) query.set("customerId", params.customerId);
  query.set("limit", String(params.limit ?? 100));
  if (params.page) query.set("page", String(params.page));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function serializeEstimateLine(line: EstimateLine): EstimateLine {
  return omitEmptyFields({
    description: line.description,
    ...serializeDocumentLineMoney(line as unknown as Record<string, unknown>),
    itemId: line.itemId || undefined,
    discountType: line.discountType || undefined,
    taxCodeId: line.taxCodeId || undefined,
    taxCode: line.taxCode || undefined,
    taxRate: line.taxRate || undefined,
  }) as EstimateLine;
}

function serializeEstimatePayload(payload: EstimatePayload): EstimatePayload {
  return {
    customerId: payload.customerId,
    ...omitEmptyFields({
      estimateNumber: payload.estimateNumber || undefined,
      referenceNumber: payload.referenceNumber || undefined,
      issueDate: payload.issueDate || undefined,
      expiryDate: payload.expiryDate || undefined,
      currencyCode: payload.currencyCode || undefined,
      exchangeRate: payload.exchangeRate || undefined,
      notes: payload.notes || undefined,
      terms: payload.terms || undefined,
      discountType: payload.discountType || undefined,
      discountValue: payload.discountValue
        ? toOptionalDecimalString(payload.discountValue)
        : undefined,
    }),
    lines: payload.lines.map(serializeEstimateLine),
  };
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

export async function getNextEstimateNumber(companyId: string) {
  const { data } = await apiClient.get<{ estimateNumber: string }>(
    `/companies/${companyId}/estimates/next-number`,
  );
  return data.estimateNumber;
}

export async function createEstimate(companyId: string, payload: EstimatePayload) {
  const { data } = await apiClient.post<Estimate>(
    `/companies/${companyId}/estimates`,
    serializeEstimatePayload(payload),
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
    serializeEstimatePayload(payload),
  );
  return data;
}

export async function deleteEstimate(companyId: string, estimateId: string) {
  await apiClient.delete(`/companies/${companyId}/estimates/${estimateId}`);
}

export async function convertEstimateToInvoice(
  companyId: string,
  estimateId: string,
  payload: ConvertEstimateToInvoicePayload,
) {
  const { data } = await apiClient.post<{ id: string }>(
    `/companies/${companyId}/estimates/${estimateId}/convert-to-invoice`,
    payload,
  );
  return data;
}
