import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createExpense,
  deleteExpense,
  getExpense,
  getExpenses,
  updateExpense,
} from "@/features/expenses/api/expenses.api";
import type {
  ExpenseListParams,
  ExpensePayload,
  ExpenseUpdatePayload,
} from "@/features/expenses/types/expense.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateExpenseQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "expenses"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "journals"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "reports"] }),
  ]);
}

export function useExpensesPaginated(companyId: string | undefined, params: ExpenseListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "expenses", params],
    queryFn: () => getExpenses(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useExpense(companyId: string | undefined, expenseId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "expenses", expenseId],
    queryFn: () => getExpense(companyId!, expenseId!),
    enabled: Boolean(companyId && expenseId),
  });
}

export function useCreateExpense(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: ExpensePayload) => createExpense(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateExpenseQueries(companyId);
    },
  });
}

export function useUpdateExpense(companyId: string | undefined, expenseId: string | null) {
  return useMutation({
    mutationFn: (payload: ExpenseUpdatePayload) =>
      updateExpense(companyId!, expenseId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateExpenseQueries(companyId);
    },
  });
}

export function useDeleteExpense(companyId: string | undefined) {
  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(companyId!, expenseId),
    onSuccess: async () => {
      if (companyId) await invalidateExpenseQueries(companyId);
    },
  });
}
