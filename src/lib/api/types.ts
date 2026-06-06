export type ApiFieldErrors = Record<string, string[]>;

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  fieldErrors?: ApiFieldErrors;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ApiListResponse<T> {
  data: T[];
  total?: number;
}
