import type { ApiListResponse, PaginatedResponse } from "@/lib/api/types";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

type UnknownListEnvelope<T> =
  | T[]
  | ApiListResponse<T>
  | PaginatedResponse<T>
  | { items: T[]; total?: number }
  | { data: { items: T[]; pagination?: PaginationMeta } };

export function extractListData<T>(response: UnknownListEnvelope<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === "object") {
    const envelope = response as Record<string, unknown>;

    if (Array.isArray(envelope.data)) {
      return envelope.data as T[];
    }

    // Nested paginated envelope: { data: { items: [...] } }
    if (envelope.data && typeof envelope.data === "object" && Array.isArray((envelope.data as Record<string, unknown>).items)) {
      return (envelope.data as { items: T[] }).items;
    }

    if (Array.isArray(envelope.items)) {
      return envelope.items as T[];
    }
  }

  return [];
}

function findPaginationMeta(response: unknown): PaginationMeta | undefined {
  if (!response || typeof response !== "object") return undefined;
  const envelope = response as Record<string, unknown>;

  if (envelope.pagination && typeof envelope.pagination === "object") {
    return envelope.pagination as PaginationMeta;
  }

  if (
    envelope.data &&
    typeof envelope.data === "object" &&
    (envelope.data as Record<string, unknown>).pagination &&
    typeof (envelope.data as Record<string, unknown>).pagination === "object"
  ) {
    return (envelope.data as { pagination: PaginationMeta }).pagination;
  }

  return undefined;
}

export function extractPaginated<T>(response: UnknownListEnvelope<T>): PaginatedResult<T> {
  const items = extractListData<T>(response);
  const meta = findPaginationMeta(response);

  const total = meta?.total ?? items.length;
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? (items.length || 25);
  const totalPages = meta?.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return { items, pagination: { total, page, limit, totalPages } };
}
