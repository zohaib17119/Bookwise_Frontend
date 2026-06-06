import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  Invoice,
  InvoiceListParams,
  InvoicePayload,
} from "@/features/invoices/types/invoice.types";

function buildQuery(params: InvoiceListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.customerId) query.set("customerId", params.customerId);
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getInvoices(companyId: string, params: InvoiceListParams = {}) {
  const { data } = await apiClient.get<Invoice[]>(
    `/companies/${companyId}/invoices${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getInvoice(companyId: string, invoiceId: string) {
  const { data } = await apiClient.get<Invoice>(
    `/companies/${companyId}/invoices/${invoiceId}`,
  );
  return data;
}

export async function createInvoice(companyId: string, payload: InvoicePayload) {
  const { data } = await apiClient.post<Invoice>(
    `/companies/${companyId}/invoices`,
    payload,
  );
  return data;
}

export async function updateInvoice(
  companyId: string,
  invoiceId: string,
  payload: InvoicePayload,
) {
  const { data } = await apiClient.patch<Invoice>(
    `/companies/${companyId}/invoices/${invoiceId}`,
    payload,
  );
  return data;
}

export async function deleteInvoice(companyId: string, invoiceId: string) {
  await apiClient.delete(`/companies/${companyId}/invoices/${invoiceId}`);
}
