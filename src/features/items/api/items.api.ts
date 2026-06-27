import { apiClient } from "@/lib/api/client";
import { extractListData, extractPaginated } from "@/lib/api/response";
import type { Item, ItemListParams, ItemPayload } from "@/features/items/types/item.types";

function buildQuery(params: ItemListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.includeInactive) query.set("includeInactive", "true");
  if (params.type) query.set("type", params.type);
  if (typeof params.taxable === "boolean") query.set("taxable", String(params.taxable));
  if (typeof params.trackQuantity === "boolean") {
    query.set("trackQuantity", String(params.trackQuantity));
  }
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getItems(companyId: string, params: ItemListParams = {}) {
  const { data } = await apiClient.get<Item[]>(
    `/companies/${companyId}/items${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getItemsPaginated(companyId: string, params: ItemListParams = {}) {
  const { data } = await apiClient.get<Item[]>(
    `/companies/${companyId}/items${buildQuery(params)}`,
  );
  return extractPaginated<Item>(data);
}

export async function getItem(companyId: string, itemId: string) {
  const { data } = await apiClient.get<Item>(`/companies/${companyId}/items/${itemId}`);
  return data;
}

export async function createItem(companyId: string, payload: ItemPayload) {
  const { data } = await apiClient.post<Item>(`/companies/${companyId}/items`, payload);
  return data;
}

export async function updateItem(companyId: string, itemId: string, payload: ItemPayload) {
  const { data } = await apiClient.patch<Item>(
    `/companies/${companyId}/items/${itemId}`,
    payload,
  );
  return data;
}

export async function deleteItem(companyId: string, itemId: string) {
  await apiClient.delete(`/companies/${companyId}/items/${itemId}`);
}
