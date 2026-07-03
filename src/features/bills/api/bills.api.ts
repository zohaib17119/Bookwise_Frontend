import { apiClient } from "@/lib/api/client";
import { extractListData, extractPaginated } from "@/lib/api/response";
import type { Bill, BillListParams, BillLine, BillPayload } from "@/features/bills/types/bill.types";
import { omitEmptyFields } from "@/features/shared/utils/api-payload";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";

function buildQuery(params: BillListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function serializeBillLine(line: BillLine): BillLine {
  return omitEmptyFields({
    description: line.description,
    quantity: toDecimalString(line.quantity),
    unitCost: toDecimalString(line.unitCost ?? ""),
    itemId: line.itemId || undefined,
    expenseAccountId: line.expenseAccountId || undefined,
    taxCodeId: line.taxCodeId || undefined,
    discountType: line.discountType || undefined,
    discountValue: line.discountValue
      ? toOptionalDecimalString(line.discountValue)
      : undefined,
  }) as BillLine;
}

function serializeBillPayload(payload: BillPayload): BillPayload {
  return {
    vendorId: payload.vendorId,
    ...omitEmptyFields({
      billNumber: payload.billNumber || undefined,
      referenceNumber: payload.referenceNumber || undefined,
      issueDate: payload.issueDate || undefined,
      dueDate: payload.dueDate || undefined,
      currencyCode: payload.currencyCode || undefined,
      exchangeRate: payload.exchangeRate || undefined,
      notes: payload.notes || undefined,
      discountType: payload.discountType || undefined,
      discountValue: payload.discountValue
        ? toOptionalDecimalString(payload.discountValue)
        : undefined,
    }),
    lines: payload.lines.map(serializeBillLine),
  };
}

export async function getBills(companyId: string, params: BillListParams = {}) {
  const { data } = await apiClient.get<Bill[]>(
    `/companies/${companyId}/bills${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getBillsPaginated(companyId: string, params: BillListParams = {}) {
  const { data } = await apiClient.get<Bill[]>(
    `/companies/${companyId}/bills${buildQuery(params)}`,
  );
  return extractPaginated<Bill>(data);
}

export async function getBill(companyId: string, billId: string) {
  const { data } = await apiClient.get<Bill>(`/companies/${companyId}/bills/${billId}`);
  return data;
}

export async function createBill(companyId: string, payload: BillPayload) {
  const { data } = await apiClient.post<Bill>(
    `/companies/${companyId}/bills`,
    serializeBillPayload(payload),
  );
  return data;
}

export async function updateBill(companyId: string, billId: string, payload: BillPayload) {
  const { data } = await apiClient.patch<Bill>(
    `/companies/${companyId}/bills/${billId}`,
    serializeBillPayload(payload),
  );
  return data;
}

export async function deleteBill(companyId: string, billId: string) {
  await apiClient.delete(`/companies/${companyId}/bills/${billId}`);
}

export async function issueBill(companyId: string, billId: string) {
  const { data } = await apiClient.post<Bill>(`/companies/${companyId}/bills/${billId}/issue`);
  return data;
}
