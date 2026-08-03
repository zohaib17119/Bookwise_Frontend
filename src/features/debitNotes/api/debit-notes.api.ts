import { apiClient } from "@/lib/api/client";
import { extractPaginated } from "@/lib/api/response";
import type { CreateCreditNotePayload } from "@/features/creditNotes/api/credit-notes.api";
import type { Invoice } from "@/features/invoices/types/invoice.types";

export type DebitNoteListParams = {
  page?: number;
  limit?: number;
  customerId?: string;
};

export type CreateDebitNotePayload = CreateCreditNotePayload;

export async function getDebitNotesPaginated(
  companyId: string,
  params: DebitNoteListParams = {},
) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.customerId) query.set("customerId", params.customerId);
  const qs = query.toString();
  const { data } = await apiClient.get<Invoice[]>(
    `/companies/${companyId}/debit-notes${qs ? `?${qs}` : ""}`,
  );
  return extractPaginated<Invoice>(data);
}

export async function createDebitNote(companyId: string, payload: CreateDebitNotePayload) {
  const { data } = await apiClient.post<Invoice>(`/companies/${companyId}/debit-notes`, payload);
  return data;
}
