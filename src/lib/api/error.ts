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
        missing?: Array<{
          entity: string;
          id?: string | null;
          name?: string | null;
          fields: string[];
        }>;
      }
    | unknown;
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

function extractDetails(errors: BackendErrorBody["errors"]): ApiError["details"] | undefined {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return undefined;
  }
  return errors as ApiError["details"];
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
      details: extractDetails(data?.errors),
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

/** Format FBR DI readiness `errors.missing` for invoice/create UX. */
export function formatFbrMissingDetails(error: unknown): string | null {
  const apiError = normalizeApiError(error);
  const details = apiError.details;
  if (!details || typeof details !== "object" || !("missing" in details)) return null;
  const missing = (details as { missing?: unknown }).missing;
  if (!Array.isArray(missing) || missing.length === 0) return null;

  const lines = missing.map((entry) => {
    const row = entry as {
      entity?: string;
      name?: string | null;
      fields?: string[];
    };
    const who = row.name ? `${row.entity ?? "record"} "${row.name}"` : row.entity ?? "record";
    const fields = Array.isArray(row.fields) ? row.fields.join(", ") : "required fields";
    return `${who}: add ${fields}`;
  });
  return `FBR Digital Invoicing is enabled — ${lines.join("; ")}`;
}
