import type { ApiListResponse, PaginatedResponse } from "@/lib/api/types";

type UnknownListEnvelope<T> =
  | T[]
  | ApiListResponse<T>
  | PaginatedResponse<T>
  | { items: T[]; total?: number };

export function extractListData<T>(response: UnknownListEnvelope<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if ("data" in response && Array.isArray(response.data)) {
    return response.data;
  }

  if ("items" in response && Array.isArray(response.items)) {
    return response.items;
  }

  return [];
}
