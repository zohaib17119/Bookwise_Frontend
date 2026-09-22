import { apiClient } from "@/lib/api/client";

export type FbrRefProvince = { id: string; code: number; description: string };
export type FbrRefHsCode = { id: string; hsCode: string; description: string };
export type FbrRefUom = { id: string; uomId: number; description: string };
export type FbrRefSaleType = { id: string; typeId: number; description: string };

export async function syncFbrReference(companyId: string) {
  const { data } = await apiClient.post<{
    mocked: boolean;
    provinces: number;
    hsCodes: number;
    uoms: number;
    saleTypes: number;
    errors: string[];
  }>(`/companies/${companyId}/fbr/reference/sync`);
  return data;
}

export async function listFbrRefProvinces(companyId: string, params?: { q?: string; limit?: number }) {
  const { data } = await apiClient.get<
    FbrRefProvince[] | { items?: FbrRefProvince[]; data?: { items?: FbrRefProvince[] } }
  >(`/companies/${companyId}/fbr/reference/provinces`, { params });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (data && typeof data === "object" && "data" in data && Array.isArray(data.data?.items)) {
    return data.data.items;
  }
  return [];
}

export async function listFbrRefHsCodes(
  companyId: string,
  params?: { q?: string; page?: number; limit?: number },
) {
  const { data } = await apiClient.get<{
    items: FbrRefHsCode[];
    total: number;
    page: number;
    limit: number;
  }>(`/companies/${companyId}/fbr/reference/hs-codes`, { params });
  return data ?? { items: [], total: 0, page: 1, limit: 25 };
}

export async function listFbrRefUoms(companyId: string, params?: { q?: string; limit?: number }) {
  const { data } = await apiClient.get<{ items: FbrRefUom[] }>(
    `/companies/${companyId}/fbr/reference/uoms`,
    { params },
  );
  return data?.items ?? [];
}

export async function listFbrRefSaleTypes(companyId: string, params?: { q?: string; limit?: number }) {
  const { data } = await apiClient.get<{ items: FbrRefSaleType[] }>(
    `/companies/${companyId}/fbr/reference/sale-types`,
    { params },
  );
  return data?.items ?? [];
}

export async function listFbrHsUoms(
  companyId: string,
  params: { hsCode: string; annexureId?: number },
) {
  const { data } = await apiClient.get<{ items: FbrRefUom[]; mocked?: boolean }>(
    `/companies/${companyId}/fbr/reference/hs-uom`,
    { params },
  );
  return data ?? { items: [], mocked: false };
}

export type FbrSaleTypeRate = { rateId: number; rateDescription: string };
export type FbrSroSchedule = { sroId: number; description: string };
export type FbrSroItem = { sroItemId: number; serialNo: string; description: string };
export type FbrScenarioRequirement = {
  scenarioId: string;
  description: string;
  allowedSaleTypes: string[];
  sroRequired: boolean;
};

export async function listFbrSaleTypeRates(
  companyId: string,
  params: { saleType: string; date?: string },
) {
  const { data } = await apiClient.get<{
    items: FbrSaleTypeRate[];
    mocked?: boolean;
    transTypeId?: number;
    provinceCode?: number;
    scenarioRequirement?: FbrScenarioRequirement | null;
    scenarioRequirements?: FbrScenarioRequirement[];
  }>(`/companies/${companyId}/fbr/reference/sale-type-rates`, { params });
  return (
    data ?? {
      items: [],
      mocked: false,
      scenarioRequirement: null,
      scenarioRequirements: [],
    }
  );
}

export async function listFbrSroSchedules(
  companyId: string,
  params: { rateId: number; date?: string },
) {
  const { data } = await apiClient.get<{
    items: FbrSroSchedule[];
    mocked?: boolean;
    applicable?: boolean;
    required?: boolean;
    scenarioForcesSro?: boolean;
  }>(`/companies/${companyId}/fbr/reference/sro-schedules`, { params });
  return (
    data ?? {
      items: [],
      mocked: false,
      applicable: false,
      required: false,
      scenarioForcesSro: false,
    }
  );
}

export async function listFbrSroItems(
  companyId: string,
  params: { sroId: number; date?: string },
) {
  const { data } = await apiClient.get<{ items: FbrSroItem[]; mocked?: boolean }>(
    `/companies/${companyId}/fbr/reference/sro-items`,
    { params },
  );
  return data ?? { items: [], mocked: false };
}

export async function adoptFbrHsCode(
  companyId: string,
  payload: { hsCode: string; description?: string },
) {
  const { data } = await apiClient.post<{
    hsCodeCategoryId: string;
    hsCode: string;
    categoryName: string;
  }>(`/companies/${companyId}/fbr/reference/hs-codes/adopt`, payload);
  return data;
}
