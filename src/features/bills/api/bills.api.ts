import { apiClient } from "@/lib/api/client";
import { extractListData, extractPaginated } from "@/lib/api/response";
import type { Bill, BillListParams, BillLine, BillPayload } from "@/features/bills/types/bill.types";
import { omitEmptyFields } from "@/features/shared/utils/api-payload";
import { toDecimalString, toOptionalDecimalString } from "@/features/shared/utils/decimal-string";

function buildQuery(params: BillListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.statuses !== undefined) query.set("statuses", params.statuses);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  if (params.vendorIds !== undefined) query.set("vendorIds", params.vendorIds);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
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
      whtEnabled: payload.whtEnabled === true ? true : payload.whtEnabled === false ? false : undefined,
      whtType: payload.whtEnabled ? payload.whtType || undefined : undefined,
      whtRate: payload.whtEnabled && payload.whtRate
        ? toOptionalDecimalString(payload.whtRate)
        : undefined,
      whtBase: payload.whtEnabled ? payload.whtBase || undefined : undefined,
      whtHeldBy: payload.whtEnabled ? payload.whtHeldBy || undefined : undefined,
      incomeWhtEnabled:
        payload.incomeWhtEnabled === true
          ? true
          : payload.incomeWhtEnabled === false
            ? false
            : undefined,
      incomeWhtRate: payload.incomeWhtEnabled && payload.incomeWhtRate
        ? toOptionalDecimalString(payload.incomeWhtRate)
        : undefined,
      incomeWhtBase: payload.incomeWhtEnabled ? payload.incomeWhtBase || undefined : undefined,
      incomeWhtHeldBy: payload.incomeWhtEnabled
        ? payload.incomeWhtHeldBy || payload.whtHeldBy || undefined
        : undefined,
      salesTaxWhtEnabled:
        payload.salesTaxWhtEnabled === true
          ? true
          : payload.salesTaxWhtEnabled === false
            ? false
            : undefined,
      salesTaxWhtRate: payload.salesTaxWhtEnabled && payload.salesTaxWhtRate
        ? toOptionalDecimalString(payload.salesTaxWhtRate)
        : undefined,
      salesTaxWhtBase: payload.salesTaxWhtEnabled
        ? payload.salesTaxWhtBase || undefined
        : undefined,
      salesTaxWhtHeldBy: payload.salesTaxWhtEnabled
        ? payload.salesTaxWhtHeldBy || payload.whtHeldBy || undefined
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

export async function getNextBillNumber(companyId: string) {
  const { data } = await apiClient.get<{ billNumber: string }>(
    `/companies/${companyId}/bills/next-number`,
  );
  return data.billNumber;
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

export async function receiveBillGoods(
  companyId: string,
  billId: string,
  payload?: { lines?: Array<{ billLineId: string; quantity: string }> },
) {
  const { data } = await apiClient.post<Bill>(
    `/companies/${companyId}/bills/${billId}/receive-goods`,
    payload ?? {},
  );
  return data;
}

export async function voidBill(companyId: string, billId: string) {
  const { data } = await apiClient.post<Bill>(`/companies/${companyId}/bills/${billId}/void`);
  return data;
}

export async function markBillTaxReported(companyId: string, billId: string) {
  const { data } = await apiClient.post<Bill>(
    `/companies/${companyId}/bills/${billId}/mark-tax-reported`,
  );
  return data;
}
