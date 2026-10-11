import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  ItemRateCalculator,
  ItemRateCalculatorPayload,
} from "@/features/items/types/item-rate-calculator.types";

export async function getItemRateCalculators(companyId: string) {
  const { data } = await apiClient.get<ItemRateCalculator[]>(
    `/companies/${companyId}/item-rate-calculators`,
  );
  return extractListData(data);
}

export async function createItemRateCalculator(
  companyId: string,
  payload: ItemRateCalculatorPayload,
) {
  const { data } = await apiClient.post<ItemRateCalculator>(
    `/companies/${companyId}/item-rate-calculators`,
    payload,
  );
  return data;
}

export async function updateItemRateCalculator(
  companyId: string,
  calculatorId: string,
  payload: Partial<ItemRateCalculatorPayload>,
) {
  const { data } = await apiClient.patch<ItemRateCalculator>(
    `/companies/${companyId}/item-rate-calculators/${calculatorId}`,
    payload,
  );
  return data;
}

export async function deleteItemRateCalculator(companyId: string, calculatorId: string) {
  const { data } = await apiClient.delete<ItemRateCalculator>(
    `/companies/${companyId}/item-rate-calculators/${calculatorId}`,
  );
  return data;
}
