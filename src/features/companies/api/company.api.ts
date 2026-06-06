import { apiClient } from "@/lib/api/client";
import type {
  Company,
  CreateCompanyPayload,
} from "@/features/companies/types/company.types";

export async function getCompaniesByOwner(ownerUserId: string) {
  const { data } = await apiClient.get<Company[]>(
    `/companies/owner/${ownerUserId}`,
  );
  return data;
}

export async function getCompany(companyId: string) {
  const { data } = await apiClient.get<Company>(`/companies/${companyId}`);
  return data;
}

export async function createCompany(payload: CreateCompanyPayload) {
  const { data } = await apiClient.post<Company>("/companies", payload);
  return data;
}

export async function updateCompany(
  companyId: string,
  payload: Partial<Company>,
) {
  const { data } = await apiClient.patch<Company>(`/companies/${companyId}`, payload);
  return data;
}

export async function deleteCompany(companyId: string) {
  await apiClient.delete(`/companies/${companyId}`);
}
