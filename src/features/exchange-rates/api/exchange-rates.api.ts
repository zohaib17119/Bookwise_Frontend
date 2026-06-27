import { apiClient } from "@/lib/api/client";

export interface ExchangeRateRecord {
  id: string;
  companyId: string;
  baseCurrencyCode: string;
  targetCurrencyCode: string;
  rate: string;
  rateDate: string;
  source?: string | null;
  createdAt: string;
}

export async function getLatestExchangeRate(companyId: string, targetCurrencyCode: string) {
  const { data } = await apiClient.get<ExchangeRateRecord>(
    `/companies/${companyId}/exchange-rates/latest/${targetCurrencyCode}`,
  );
  return data;
}
