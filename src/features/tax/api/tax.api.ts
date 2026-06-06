import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  TaxCode,
  TaxCodePayload,
  TaxRate,
  TaxRatePayload,
  TaxSettings,
  TaxSettingsPayload,
} from "@/features/tax/types/tax.types";
import type { GenericReportResult, ReportFilterParams } from "@/features/reports/types/report.types";

function buildQuery(params: ReportFilterParams) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.asOfDate) query.set("asOfDate", params.asOfDate);
  return query.toString() ? `?${query.toString()}` : "";
}

export async function getTaxRates(companyId: string) {
  const { data } = await apiClient.get<TaxRate[]>(`/companies/${companyId}/tax-rates`);
  return extractListData(data);
}

export async function createTaxRate(companyId: string, payload: TaxRatePayload) {
  const { data } = await apiClient.post<TaxRate>(`/companies/${companyId}/tax-rates`, payload);
  return data;
}

export async function updateTaxRate(companyId: string, taxRateId: string, payload: TaxRatePayload) {
  const { data } = await apiClient.patch<TaxRate>(
    `/companies/${companyId}/tax-rates/${taxRateId}`,
    payload,
  );
  return data;
}

export async function deleteTaxRate(companyId: string, taxRateId: string) {
  await apiClient.delete(`/companies/${companyId}/tax-rates/${taxRateId}`);
}

export async function getTaxCodes(companyId: string) {
  const { data } = await apiClient.get<TaxCode[]>(`/companies/${companyId}/tax-codes`);
  return extractListData(data);
}

export async function createTaxCode(companyId: string, payload: TaxCodePayload) {
  const { data } = await apiClient.post<TaxCode>(`/companies/${companyId}/tax-codes`, payload);
  return data;
}

export async function updateTaxCode(companyId: string, taxCodeId: string, payload: TaxCodePayload) {
  const { data } = await apiClient.patch<TaxCode>(
    `/companies/${companyId}/tax-codes/${taxCodeId}`,
    payload,
  );
  return data;
}

export async function deleteTaxCode(companyId: string, taxCodeId: string) {
  await apiClient.delete(`/companies/${companyId}/tax-codes/${taxCodeId}`);
}

export async function getTaxSettings(companyId: string) {
  const { data } = await apiClient.get<TaxSettings>(`/companies/${companyId}/tax-settings`);
  return data;
}

export async function upsertTaxSettings(companyId: string, payload: TaxSettingsPayload) {
  try {
    const { data } = await apiClient.patch<TaxSettings>(`/companies/${companyId}/tax-settings`, payload);
    return data;
  } catch {
    const { data } = await apiClient.post<TaxSettings>(`/companies/${companyId}/tax-settings`, payload);
    return data;
  }
}

export async function getTaxSummaryReport(companyId: string, params: ReportFilterParams) {
  const { data } = await apiClient.get<GenericReportResult>(
    `/companies/${companyId}/reports/tax-summary${buildQuery(params)}`,
  );
  return data;
}

export async function getTaxDetailReport(companyId: string, params: ReportFilterParams) {
  const { data } = await apiClient.get<GenericReportResult>(
    `/companies/${companyId}/reports/tax-detail${buildQuery(params)}`,
  );
  return data;
}
