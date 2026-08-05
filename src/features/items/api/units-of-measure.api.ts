import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  UnitOfMeasure,
  UnitOfMeasurePayload,
} from "@/features/items/types/unit-of-measure.types";

export async function getUnitsOfMeasure() {
  const { data } = await apiClient.get<UnitOfMeasure[]>("/units-of-measure");
  return Array.isArray(data) ? data : extractListData(data);
}

export async function createUnitOfMeasure(payload: UnitOfMeasurePayload) {
  const { data } = await apiClient.post<UnitOfMeasure>("/units-of-measure", payload);
  return data;
}
