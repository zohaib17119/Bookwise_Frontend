import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  SalesPerson,
  SalesPersonPayload,
} from "@/features/sales-persons/types/sales-person.types";

export async function getSalesPersons(companyId: string) {
  const { data } = await apiClient.get<SalesPerson[]>(`/companies/${companyId}/sales-persons`);
  return extractListData(data);
}

export async function createSalesPerson(companyId: string, payload: SalesPersonPayload) {
  const { data } = await apiClient.post<SalesPerson>(
    `/companies/${companyId}/sales-persons`,
    payload,
  );
  return data;
}

export async function updateSalesPerson(
  companyId: string,
  salesPersonId: string,
  payload: Partial<SalesPersonPayload>,
) {
  const { data } = await apiClient.patch<SalesPerson>(
    `/companies/${companyId}/sales-persons/${salesPersonId}`,
    payload,
  );
  return data;
}

export async function deleteSalesPerson(companyId: string, salesPersonId: string) {
  const { data } = await apiClient.delete<SalesPerson>(
    `/companies/${companyId}/sales-persons/${salesPersonId}`,
  );
  return data;
}
