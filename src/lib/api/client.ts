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
  headers: {
    "Content-Type": "application/json",
  },
});

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

    if (normalized.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    return Promise.reject(normalized);
  },
);
