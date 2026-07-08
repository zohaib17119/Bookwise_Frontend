import axios from "axios";
import type { ApiError, ApiFieldErrors } from "@/lib/api/types";

type BackendErrorBody = {
  message?: string;
  code?: string;
  errors?:
    | ApiFieldErrors
    | {
        formErrors?: string[];
        fieldErrors?: ApiFieldErrors;
      };
};

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as ApiError).message === "string"
  );
}

function extractFieldErrors(errors: BackendErrorBody["errors"]): ApiFieldErrors | undefined {
  if (!errors || typeof errors !== "object") {
    return undefined;
  }

  if ("fieldErrors" in errors) {
    const fieldErrors = (errors as { fieldErrors?: ApiFieldErrors }).fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      return fieldErrors;
    }
  }

  const entries = Object.entries(errors);
  if (!entries.length) {
    return undefined;
  }

  const isFlatFieldMap = entries.every(
    ([, value]) =>
      Array.isArray(value) && value.every((entry) => typeof entry === "string"),
  );

  return isFlatFieldMap ? (errors as ApiFieldErrors) : undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as BackendErrorBody | undefined;

    return {
      message: data?.message ?? error.message ?? "Request failed",
      status: error.response?.status,
      code: data?.code,
      fieldErrors: extractFieldErrors(data?.errors),
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unexpected error" };
}

export function toApiError(error: unknown): ApiError {
  return normalizeApiError(error);
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (!error) {
    return fallback;
  }

  return normalizeApiError(error).message || fallback;
}

export function getFirstFieldError(error: unknown, field: string): string | undefined {
  const apiError = normalizeApiError(error);
  return apiError.fieldErrors?.[field]?.[0];
}
