import { apiClient } from "@/lib/api/client";
import { extractPaginated } from "@/lib/api/response";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import type { DiscountType } from "@/features/shared/types/documents";

export type CreditNoteListParams = {
  page?: number;
  limit?: number;
  customerId?: string;
};

export type AdjustmentNoteLinePayload = {
  itemId?: string;
  itemName?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountType?: DiscountType;
  discountValue?: string;
  taxRateId?: string;
  taxCodeId?: string;
};

export type CreateCreditNotePayload = {
  originalInvoiceId: string;
  issueDate?: string;
  notes: string;
  sendImmediately?: boolean;
  lines?: AdjustmentNoteLinePayload[];
};

export async function getCreditNotesPaginated(
  companyId: string,
  params: CreditNoteListParams = {},
) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.customerId) query.set("customerId", params.customerId);
  const qs = query.toString();
  const { data } = await apiClient.get<Invoice[]>(
    `/companies/${companyId}/credit-notes${qs ? `?${qs}` : ""}`,
  );
  return extractPaginated<Invoice>(data);
}

export async function createCreditNote(companyId: string, payload: CreateCreditNotePayload) {
  const { data } = await apiClient.post<Invoice>(`/companies/${companyId}/credit-notes`, payload);
  return data;
}
