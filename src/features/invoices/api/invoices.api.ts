import { apiClient } from "@/lib/api/client";
import { extractListData, extractPaginated } from "@/lib/api/response";
import type {
  Invoice,
  InvoiceLine,
  InvoiceListParams,
  InvoicePayload,
} from "@/features/invoices/types/invoice.types";
import { omitEmptyFields, serializeDocumentLineMoney } from "@/features/shared/utils/api-payload";
import { toOptionalDecimalString } from "@/features/shared/utils/decimal-string";

function buildQuery(params: InvoiceListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.customerId) query.set("customerId", params.customerId);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function serializeInvoiceLine(line: InvoiceLine): InvoiceLine {
  return omitEmptyFields({
    description: line.description,
    ...serializeDocumentLineMoney(line as unknown as Record<string, unknown>),
    itemId: line.itemId || undefined,
    itemName: line.itemName || undefined,
    discountType: line.discountType || undefined,
    taxRateId: line.taxRateId || undefined,
  }) as InvoiceLine;
}

function serializeInvoicePayload(payload: InvoicePayload): InvoicePayload {
  return {
    customerId: payload.customerId,
    ...omitEmptyFields({
      estimateId: payload.estimateId || undefined,
      invoiceNumber: payload.invoiceNumber || undefined,
      referenceNumber: payload.referenceNumber || undefined,
      contactPersonName: payload.contactPersonName || undefined,
      contactMobile: payload.contactMobile || undefined,
      contactPersonDepartment: payload.contactPersonDepartment || undefined,
      deliveryDate: payload.deliveryDate || undefined,
      deliveryChallanNumber: payload.deliveryChallanNumber || undefined,
      issueDate: payload.issueDate || undefined,
      dueDate: payload.dueDate || undefined,
      currencyCode: payload.currencyCode || undefined,
      exchangeRate: payload.exchangeRate || undefined,
      notes: payload.notes || undefined,
      terms: payload.terms || undefined,
      memoOnStatement: payload.memoOnStatement || undefined,
      paymentOptions: payload.paymentOptions?.length ? payload.paymentOptions : undefined,
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
    lines: payload.lines.map(serializeInvoiceLine),
  };
}

export async function getInvoices(companyId: string, params: InvoiceListParams = {}) {
  const { data } = await apiClient.get<Invoice[]>(
    `/companies/${companyId}/invoices${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getInvoicesPaginated(companyId: string, params: InvoiceListParams = {}) {
  const { data } = await apiClient.get<Invoice[]>(
    `/companies/${companyId}/invoices${buildQuery(params)}`,
  );
  return extractPaginated<Invoice>(data);
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
    serializeInvoicePayload(payload),
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
    serializeInvoicePayload(payload),
  );
  return data;
}

export async function deleteInvoice(companyId: string, invoiceId: string) {
  await apiClient.delete(`/companies/${companyId}/invoices/${invoiceId}`);
}

export async function sendInvoice(companyId: string, invoiceId: string) {
  const { data } = await apiClient.post<Invoice>(
    `/companies/${companyId}/invoices/${invoiceId}/send`,
  );
  return data;
}

export async function markInvoiceTaxReported(companyId: string, invoiceId: string) {
  const { data } = await apiClient.post<Invoice>(
    `/companies/${companyId}/invoices/${invoiceId}/mark-tax-reported`,
  );
  return data;
}

export async function submitInvoiceCompliance(companyId: string, invoiceId: string) {
  const { data } = await apiClient.post<{ jobId: string }>(
    `/companies/${companyId}/invoices/${invoiceId}/compliance/submit`,
  );
  return data;
}

export async function getNextInvoiceNumber(companyId: string) {
  const { data } = await apiClient.get<{ nextNumber: number }>(
    `/companies/${companyId}/invoices/next-number`,
  );
  return data;
}
