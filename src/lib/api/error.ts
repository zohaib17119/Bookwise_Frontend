import axios from "axios";
import type { ApiError, ApiFieldErrors } from "@/lib/api/types";

export const USER_FACING_FALLBACK = "Something went wrong";

type BackendErrorBody = {
  message?: string;
  code?: string;
  error?: string | { message?: string };
  errors?:
    | ApiFieldErrors
    | {
        formErrors?: string[];
        fieldErrors?: ApiFieldErrors;
      };
};

const TECHNICAL_MESSAGE_PATTERNS = [
  /^Request failed with status code \d+$/i,
  /^Network Error$/i,
  /^timeout of \d+ms exceeded$/i,
  /^Unexpected error$/i,
  /^Request failed$/i,
];

export function isTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message.trim()));
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    !axios.isAxiosError(value) &&
    !(value instanceof Error) &&
    "message" in value &&
    typeof (value as ApiError).message === "string"
  );
}

function parseErrorBody(data: unknown): BackendErrorBody | undefined {
  if (!data) {
    return undefined;
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      return typeof parsed === "object" && parsed !== null
        ? (parsed as BackendErrorBody)
        : undefined;
    } catch {
      return { message: data };
    }
  }

  if (typeof data === "object") {
    return data as BackendErrorBody;
  }

  return undefined;
}

export function extractBackendMessage(data: unknown): string | undefined {
  const body = parseErrorBody(data);
  if (!body) {
    return undefined;
  }

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  if (typeof body.error === "string" && body.error.trim()) {
    return body.error.trim();
  }

  if (
    body.error &&
    typeof body.error === "object" &&
    typeof body.error.message === "string" &&
    body.error.message.trim()
  ) {
    return body.error.message.trim();
  }

  return undefined;
}

function toUserFacingMessage(message: string | undefined): string {
  if (!message || isTechnicalErrorMessage(message)) {
    return USER_FACING_FALLBACK;
  }

  return message;
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

function getUserFacingFallback(): string {
  return USER_FACING_FALLBACK;
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return {
      ...error,
      message: toUserFacingMessage(error.message),
    };
  }

  if (axios.isAxiosError(error)) {
    const data = parseErrorBody(error.response?.data);
    const backendMessage = extractBackendMessage(error.response?.data);

    return {
      message: toUserFacingMessage(backendMessage ?? getUserFacingFallback()),
      status: error.response?.status,
      code: data?.code,
      fieldErrors: extractFieldErrors(data?.errors),
    };
  }

  if (error instanceof Error) {
    return { message: toUserFacingMessage(error.message) };
  }

  return { message: USER_FACING_FALLBACK };
}

export function toApiError(error: unknown): ApiError {
  return normalizeApiError(error);
}

export function getApiErrorMessage(
  error: unknown,
  fallback = USER_FACING_FALLBACK,
): string {
  if (!error) {
    return fallback;
  }

  const message = normalizeApiError(error).message;
  return message && !isTechnicalErrorMessage(message) ? message : fallback;
}

export function getFirstFieldError(error: unknown, field: string): string | undefined {
  const apiError = normalizeApiError(error);
  return apiError.fieldErrors?.[field]?.[0];
}

export function firstFieldErrorMessage(error: unknown): string | undefined {
  const apiError = normalizeApiError(error);
  if (!apiError.fieldErrors) return undefined;
  for (const messages of Object.values(apiError.fieldErrors)) {
    if (messages?.[0]) return messages[0];
  }
  return undefined;
}
