import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  ItemCategory,
  ItemCategoryPayload,
} from "@/features/items/types/item-category.types";

export async function getItemCategories(companyId: string) {
  const { data } = await apiClient.get<ItemCategory[]>(
    `/companies/${companyId}/item-categories`,
  );
  return extractListData(data);
}

export async function createItemCategory(companyId: string, payload: ItemCategoryPayload) {
  const { data } = await apiClient.post<ItemCategory>(
    `/companies/${companyId}/item-categories`,
    payload,
  );
  return data;
}

export async function updateItemCategory(
  companyId: string,
  itemCategoryId: string,
  payload: Partial<ItemCategoryPayload>,
) {
  const { data } = await apiClient.patch<ItemCategory>(
    `/companies/${companyId}/item-categories/${itemCategoryId}`,
    payload,
  );
  return data;
}

export async function deleteItemCategory(companyId: string, itemCategoryId: string) {
  const { data } = await apiClient.delete<ItemCategory>(
    `/companies/${companyId}/item-categories/${itemCategoryId}`,
  );
  return data;
}
