import axios from "axios";
import { env } from "@/lib/env";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { normalizeApiError } from "@/lib/api/error";

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

        // 3. Convert enums to UPPERCASE
        if (key === "type" && typeof val === "string") {
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
    window.location.href = "/login";
  }
}

async function refreshAccessToken() {
  const response = await apiClient.post("/auth/refresh");
  const payload = response.data?.data ?? response.data;
  return payload.accessToken as string;
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
  (error) => {
    const normalized = normalizeApiError(error);

    return Promise.reject(normalized);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const normalized = normalizeApiError(error);

    if (normalized.status !== 401 || !originalRequest) {
      return Promise.reject(normalized);
    }

    const requestUrl = originalRequest.url as string | undefined;

    if (requestUrl?.includes("/auth/refresh")) {
      forceLogout();
      return Promise.reject(normalized);
    }

    if (!shouldAttemptRefresh(requestUrl) || originalRequest._retry) {
      if (shouldAttemptRefresh(requestUrl)) {
        forceLogout();
      }

      return Promise.reject(normalized);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      useAuthStore.getState().setToken(newToken);
      flushRefreshQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushRefreshQueue(refreshError);
      forceLogout();
      return Promise.reject(normalizeApiError(refreshError));
    } finally {
      isRefreshing = false;
    }
  },
);
