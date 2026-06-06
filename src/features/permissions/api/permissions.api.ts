import { apiClient } from "@/lib/api/client";

export interface CompanyPermissionsResponse {
  role?: string;
  permissions: string[];
}

export async function getCompanyPermissions(companyId: string) {
  const { data } = await apiClient.get<CompanyPermissionsResponse>(
    `/companies/${companyId}/me/permissions`,
  );

  return data;
}
