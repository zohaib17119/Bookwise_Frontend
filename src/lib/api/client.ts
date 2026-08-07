import axios from "axios";
import { env } from "@/lib/env";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { isApiError, normalizeApiError } from "@/lib/api/error";

function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }

  if (typeof obj === "object") {
    if (obj instanceof Date) return obj;

    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];

        // 1. Omit empty string or map to null for specific fields
        if (val === "") {
          if (
            key === "salesTaxPayableAccountId" ||
            key === "purchaseTaxRecoverableAccountId" ||
            key === "parentAccountId" ||
            key === "lockDate"
          ) {
            cleaned[key] = null;
          }
          continue;
        }

        // 2. Convert specific number fields to string if backend expects decimal string
        const stringFields = [
          "openingBalance",
          "salesPrice",
          "purchaseCost",
          "quantityOnHand",
          "reorderLevel",
          "quantity",
          "unitPrice",
          "unitCost",
          "discountValue",
          "taxRate",
          "exchangeRate",
          "statementEndingBalance",
          "matchedAmount",
        ];
        if (stringFields.includes(key) && typeof val === "number") {
          cleaned[key] = val.toString();
          continue;
        }

        // 3. Convert enums to UPPERCASE (skip invoice-template block types — camelCase)
        const invoiceTemplateBlockTypes = new Set([
          "letterhead",
          "logo",
          "companyDetails",
          "customerDetails",
          "shippingDetails",
          "invoiceMeta",
          "lineTable",
          "totals",
          "notes",
          "footer",
        ]);
        if (key === "type" && typeof val === "string") {
          if (invoiceTemplateBlockTypes.has(val)) {
            cleaned[key] = val;
            continue;
          }
          cleaned[key] = val.toUpperCase().replace("-", "_");
          continue;
        }
        if (
          (key === "direction" ||
            key === "source" ||
            key === "status" ||
            key === "calculationMode" ||
            key === "scope" ||
            key === "normalSide" ||
            key === "accountingMethod" ||
            key === "accountCodeStrategy") &&
          typeof val === "string"
        ) {
          cleaned[key] = val.toUpperCase();
          continue;
        }
        if (key === "discountType" && typeof val === "string") {
          cleaned[key] = val === "amount" ? "FIXED" : val.toUpperCase();
          continue;
        }

        // 4. Map frontend keys to backend keys
        if (key === "linkedAccountId") {
          cleaned["accountId"] = val;
          continue;
        }

        // 5. Map taxRateIds -> rates
        if (key === "taxRateIds" && Array.isArray(val)) {
          cleaned["rates"] = val.map((id, index) => ({
            taxRateId: id,
            sortOrder: index + 1,
          }));
          continue;
        }

        // 6. Map endDate -> statementEndingDate (for reconciliation)
        if (key === "endDate" && (obj.bankAccountId || obj.statementEndingBalance !== undefined)) {
          cleaned["statementEndingDate"] = val;
          continue;
        }

        cleaned[key] = sanitizePayload(val);
      }
    }
    return cleaned;
  }

  return obj;
}

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Bare client for refresh — no auth interceptors / no expired Bearer header. */
const refreshClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

refreshClient.interceptors.response.use((response) => {
  if (
    response.data &&
    typeof response.data === "object" &&
    "success" in response.data &&
    "data" in response.data
  ) {
    response.data = response.data.data;
  }
  return response;
});

const AUTH_PATHS_WITHOUT_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-verification",
];

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function shouldAttemptRefresh(url?: string) {
  if (!url) {
    return true;
  }

  return !AUTH_PATHS_WITHOUT_REFRESH.some((path) => url.includes(path));
}

function flushRefreshQueue(error: unknown, token?: string) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
      return;
    }

    resolve(token);
  });
  refreshQueue = [];
}

function forceLogout() {
  useAuthStore.getState().clearAuth();

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function isDefinitiveAuthRefreshFailure(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 401 || status === 403;
  }

  if (isApiError(error)) {
    return error.status === 401 || error.status === 403;
  }

  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}

async function postRefreshAccessToken(): Promise<string> {
  const response = await refreshClient.post("/auth/refresh");
  // refreshClient unwraps `{ success, data }` → `data` in its response interceptor.
  const payload = response.data as { accessToken: string };
  return payload.accessToken;
}

/** Single-flight refresh shared by the 401 interceptor and proactive refresh. */
export async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await postRefreshAccessToken();
    useAuthStore.getState().setToken(newToken);
    flushRefreshQueue(null, newToken);
    return newToken;
  } catch (refreshError) {
    flushRefreshQueue(refreshError);
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (
    config.data &&
    typeof config.data === "object" &&
    !(config.data instanceof FormData) &&
    !(config.data instanceof ArrayBuffer) &&
    !(config.data instanceof Blob)
  ) {
    config.data = sanitizePayload(config.data);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (!axios.isAxiosError(error) && isApiError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = axios.isAxiosError(error) ? error.config : undefined;
    const normalized = normalizeApiError(error);
    const retryableRequest = originalRequest as typeof originalRequest & { _retry?: boolean };

    if (normalized.status !== 401 || !retryableRequest) {
      return Promise.reject(normalized);
    }

    const requestUrl = retryableRequest.url as string | undefined;

    // Refresh itself failed via main client (shouldn't happen with bare client).
    if (requestUrl?.includes("/auth/refresh")) {
      if (isDefinitiveAuthRefreshFailure(error) || isDefinitiveAuthRefreshFailure(normalized)) {
        forceLogout();
      }
      return Promise.reject(normalized);
    }

    if (!shouldAttemptRefresh(requestUrl) || retryableRequest._retry) {
      if (shouldAttemptRefresh(requestUrl) && retryableRequest._retry) {
        // Already retried once after refresh — definitive session loss.
        forceLogout();
      }
      return Promise.reject(normalized);
    }

    retryableRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      retryableRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(retryableRequest);
    } catch (refreshError) {
      if (isDefinitiveAuthRefreshFailure(refreshError)) {
        forceLogout();
      }
      return Promise.reject(normalizeApiError(refreshError));
    }
  },
);
