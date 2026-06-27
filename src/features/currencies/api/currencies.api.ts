import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
  decimalPlaces?: number | null;
  isActive: boolean;
}

export async function getCurrencies() {
  const { data } = await apiClient.get<Currency[]>(`/currencies`);
  return extractListData<Currency>(data);
}
