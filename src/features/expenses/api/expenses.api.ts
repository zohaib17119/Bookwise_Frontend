import { apiClient } from "@/lib/api/client";
import { extractListData, extractPaginated } from "@/lib/api/response";
import type {
  Expense,
  ExpenseListParams,
  ExpensePayload,
  ExpenseUpdatePayload,
} from "@/features/expenses/types/expense.types";
import { omitEmptyFields, serializeMoneyField } from "@/features/shared/utils/api-payload";

function buildQuery(params: ExpenseListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.expenseAccountIds !== undefined) query.set("expenseAccountIds", params.expenseAccountIds);
  if (params.paymentAccountIds !== undefined) query.set("paymentAccountIds", params.paymentAccountIds);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  query.set("limit", String(params.limit ?? 25));
  if (params.page) query.set("page", String(params.page));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function serializeExpensePayload(payload: ExpensePayload): ExpensePayload {
  return {
    paymentAccountId: payload.paymentAccountId,
    expenseAccountId: payload.expenseAccountId,
    amount: serializeMoneyField(payload.amount),
    description: payload.description,
    ...omitEmptyFields({
      paymentDate: payload.paymentDate || undefined,
      vendorId: payload.vendorId || undefined,
      currencyCode: payload.currencyCode || undefined,
      exchangeRate: payload.exchangeRate || undefined,
      referenceNumber: payload.referenceNumber || undefined,
      taxRateId: payload.taxRateId || undefined,
    }),
  };
}

export async function getExpenses(companyId: string, params: ExpenseListParams = {}) {
  const { data } = await apiClient.get(`/companies/${companyId}/expenses${buildQuery(params)}`);
  const parsed = extractPaginated<Expense>(data);
  const envelope = (data ?? {}) as Record<string, unknown>;
  const nested =
    envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : envelope;
  const filteredTotalAmount =
    nested.filteredTotalAmount != null
      ? String(nested.filteredTotalAmount)
      : envelope.filteredTotalAmount != null
        ? String(envelope.filteredTotalAmount)
        : "0.00";
  return { ...parsed, filteredTotalAmount };
}

export async function getExpense(companyId: string, expenseId: string) {
  const { data } = await apiClient.get<Expense>(`/companies/${companyId}/expenses/${expenseId}`);
  return data;
}

export async function createExpense(companyId: string, payload: ExpensePayload) {
  const { data } = await apiClient.post<Expense>(
    `/companies/${companyId}/expenses`,
    serializeExpensePayload(payload),
  );
  return data;
}

export async function updateExpense(
  companyId: string,
  expenseId: string,
  payload: ExpenseUpdatePayload,
) {
  const { data } = await apiClient.patch<Expense>(
    `/companies/${companyId}/expenses/${expenseId}`,
    {
      ...payload,
      ...(payload.amount ? { amount: serializeMoneyField(payload.amount) } : {}),
    },
  );
  return data;
}

export async function deleteExpense(companyId: string, expenseId: string) {
  const { data } = await apiClient.delete<Expense>(`/companies/${companyId}/expenses/${expenseId}`);
  return data;
}

export async function getExpenseOptions(companyId: string) {
  const { data } = await apiClient.get(`/companies/${companyId}/expenses?limit=100`);
  return extractListData<Expense>(data);
}
