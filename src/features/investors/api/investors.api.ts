import { apiClient } from "@/lib/api/client";
import { extractListData, extractPaginated } from "@/lib/api/response";
import type {
  CreateInvestmentPayload,
  Investor,
  InvestorInvestment,
  InvestorListParams,
  InvestorPayload,
  UpdateInvestmentPayload,
} from "@/features/investors/types/investor.types";

function buildQuery(params: InvestorListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.includeInactive) query.set("includeInactive", "true");
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getInvestorsPaginated(companyId: string, params: InvestorListParams = {}) {
  const { data } = await apiClient.get<Investor[]>(
    `/companies/${companyId}/investors${buildQuery(params)}`,
  );
  return extractPaginated<Investor>(data);
}

export async function getInvestor(companyId: string, investorId: string) {
  const { data } = await apiClient.get<Investor>(
    `/companies/${companyId}/investors/${investorId}`,
  );
  return data;
}

export async function getNextInvestorCode(companyId: string) {
  const { data } = await apiClient.get<{ code: string }>(
    `/companies/${companyId}/investors/next-code`,
  );
  return data.code;
}

export async function createInvestor(companyId: string, payload: InvestorPayload) {
  const { data } = await apiClient.post<Investor>(`/companies/${companyId}/investors`, payload);
  return data;
}

export async function updateInvestor(
  companyId: string,
  investorId: string,
  payload: Partial<InvestorPayload>,
) {
  const { data } = await apiClient.patch<Investor>(
    `/companies/${companyId}/investors/${investorId}`,
    payload,
  );
  return data;
}

export async function deleteInvestor(companyId: string, investorId: string) {
  const { data } = await apiClient.delete<Investor>(
    `/companies/${companyId}/investors/${investorId}`,
  );
  return data;
}

export async function getInvestorInvestments(
  companyId: string,
  investorId: string,
  params: { page?: number; limit?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await apiClient.get<InvestorInvestment[]>(
    `/companies/${companyId}/investors/${investorId}/investments${suffix}`,
  );
  return extractPaginated<InvestorInvestment>(data);
}

export async function createInvestorInvestment(
  companyId: string,
  investorId: string,
  payload: CreateInvestmentPayload,
) {
  const { data } = await apiClient.post<InvestorInvestment>(
    `/companies/${companyId}/investors/${investorId}/investments`,
    payload,
  );
  return data;
}

export async function updateInvestorInvestment(
  companyId: string,
  investorId: string,
  investmentId: string,
  payload: UpdateInvestmentPayload,
) {
  const { data } = await apiClient.patch<InvestorInvestment>(
    `/companies/${companyId}/investors/${investorId}/investments/${investmentId}`,
    payload,
  );
  return data;
}

export { extractListData };
