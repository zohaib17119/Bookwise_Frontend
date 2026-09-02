import { apiClient } from "@/lib/api/client";

export type OpeningBalanceAmounts = {
  cash: string;
  bank: string;
  accountsReceivable: string;
  accountsPayable: string;
  inventory: string;
  purchaseTaxRecoverable: string;
  taxPayable: string;
  openingBalanceEquity?: string;
};

export type OpeningBalancesResponse = {
  asOfDate: string | null;
  journalEntryId: string | null;
  amounts: OpeningBalanceAmounts;
};

export type OpeningBalancesPayload = {
  asOfDate: string;
  cash?: string;
  bank?: string;
  accountsReceivable?: string;
  accountsPayable?: string;
  inventory?: string;
  purchaseTaxRecoverable?: string;
  taxPayable?: string;
};

export async function getOpeningBalances(companyId: string) {
  const { data } = await apiClient.get<OpeningBalancesResponse>(
    `/companies/${companyId}/opening-balances`,
  );
  return data;
}

export async function saveOpeningBalances(companyId: string, payload: OpeningBalancesPayload) {
  const { data } = await apiClient.put<OpeningBalancesResponse>(
    `/companies/${companyId}/opening-balances`,
    payload,
  );
  return data;
}
