import axios from "axios";
import type { ApiError } from "@/lib/api/types";

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          code?: string;
          errors?: Record<string, string[]>;
        }
      | undefined;

    return {
      message: data?.message ?? error.message ?? "Request failed",
      status: error.response?.status,
      code: data?.code,
      fieldErrors: data?.errors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unexpected error" };
}
