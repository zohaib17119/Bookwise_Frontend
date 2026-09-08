export interface BaseEntityListParams {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: ListSortDir;
}

export type ListSortDir = "asc" | "desc";
