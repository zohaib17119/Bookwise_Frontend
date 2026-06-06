import { apiClient } from "@/lib/api/client";
import { getCompany, updateCompany } from "@/features/companies/api/company.api";
import type {
  AccountingSettings,
  AccountingSettingsPayload,
  CompanySettings,
  CompanySettingsPayload,
} from "@/features/settings/types/settings.types";

export async function getCompanySettings(companyId: string) {
  return (await getCompany(companyId)) as CompanySettings;
}

export async function updateCompanySettings(
  companyId: string,
  payload: CompanySettingsPayload,
) {
  return (await updateCompany(companyId, payload)) as CompanySettings;
}

export async function getAccountingSettings(companyId: string) {
  const { data } = await apiClient.get<AccountingSettings>(`/companies/${companyId}/accounting-settings`);
  return data;
}

export async function upsertAccountingSettings(
  companyId: string,
  payload: AccountingSettingsPayload,
) {
  try {
    const { data } = await apiClient.patch<AccountingSettings>(`/companies/${companyId}/accounting-settings`, payload);
    return data;
  } catch {
    const { data } = await apiClient.post<AccountingSettings>(`/companies/${companyId}/accounting-settings`, payload);
    return data;
  }
}
