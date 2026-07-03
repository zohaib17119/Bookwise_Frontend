import { apiClient } from "@/lib/api/client";
import { extractListData, extractPaginated } from "@/lib/api/response";
import type {
  Expense,
  ExpenseListParams,
  ExpensePayload,
  ExpenseUpdatePayload,
} from "@/features/expenses/types/expense.types";
import { toDecimalString } from "@/features/shared/utils/decimal-string";

function buildQuery(params: ExpenseListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.vendorId) query.set("vendorId", params.vendorId);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  query.set("limit", String(params.limit ?? 25));
  if (params.page) query.set("page", String(params.page));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function formatAmount(value: number) {
  return toDecimalString(value);
}

export async function getExpenses(companyId: string, params: ExpenseListParams = {}) {
  const { data } = await apiClient.get(`/companies/${companyId}/expenses${buildQuery(params)}`);
  return extractPaginated<Expense>(data);
}

export async function getExpense(companyId: string, expenseId: string) {
  const { data } = await apiClient.get<Expense>(`/companies/${companyId}/expenses/${expenseId}`);
  return data;
}

export async function createExpense(companyId: string, payload: ExpensePayload) {
  const { data } = await apiClient.post<Expense>(`/companies/${companyId}/expenses`, {
    ...payload,
    amount: formatAmount(payload.amount),
  });
  return data;
}

export async function updateExpense(
  companyId: string,
  expenseId: string,
  payload: ExpenseUpdatePayload,
) {
  const { data } = await apiClient.patch<Expense>(
    `/companies/${companyId}/expenses/${expenseId}`,
    payload,
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
