export type ApiFieldErrors = Record<string, string[]>;

export type FbrMissingFieldDetail = {
  entity: string;
  id?: string | null;
  name?: string | null;
  fields: string[];
};

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  fieldErrors?: ApiFieldErrors;
  /** Structured AppError.details from backend (e.g. FBR DI readiness). */
  details?: { missing?: FbrMissingFieldDetail[] } | unknown;
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
