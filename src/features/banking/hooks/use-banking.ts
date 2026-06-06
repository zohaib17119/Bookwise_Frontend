import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createBankAccount,
  createBankTransaction,
  deleteBankAccount,
  deleteBankTransaction,
  getBankAccounts,
  getBankTransaction,
  getBankTransactions,
  getUnmatchedBankTransactions,
  matchBankTransaction,
  unmatchBankTransaction,
  updateBankAccount,
  updateBankTransaction,
} from "@/features/banking/api/banking.api";
import type {
  BankAccountPayload,
  BankTransactionListParams,
  BankTransactionPayload,
} from "@/features/banking/types/banking.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateBankingQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bank-accounts"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "bank-transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "reconciliations"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useBankAccounts(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "bank-accounts"],
    queryFn: () => getBankAccounts(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useCreateBankAccount(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: BankAccountPayload) => createBankAccount(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}

export function useUpdateBankAccount(companyId: string | undefined, bankAccountId: string | null) {
  return useMutation({
    mutationFn: (payload: BankAccountPayload) => updateBankAccount(companyId!, bankAccountId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}

export function useDeleteBankAccount(companyId: string | undefined) {
  return useMutation({
    mutationFn: (bankAccountId: string) => deleteBankAccount(companyId!, bankAccountId),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}

export function useBankTransactions(companyId: string | undefined, params: BankTransactionListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "bank-transactions", params],
    queryFn: () => getBankTransactions(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useBankTransaction(companyId: string | undefined, bankTransactionId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "bank-transactions", bankTransactionId],
    queryFn: () => getBankTransaction(companyId!, bankTransactionId!),
    enabled: Boolean(companyId && bankTransactionId),
  });
}

export function useCreateBankTransaction(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: BankTransactionPayload) => createBankTransaction(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}

export function useUpdateBankTransaction(companyId: string | undefined, bankTransactionId: string | null) {
  return useMutation({
    mutationFn: (payload: BankTransactionPayload) =>
      updateBankTransaction(companyId!, bankTransactionId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}

export function useDeleteBankTransaction(companyId: string | undefined) {
  return useMutation({
    mutationFn: (bankTransactionId: string) => deleteBankTransaction(companyId!, bankTransactionId),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}

export function useUnmatchedBankTransactions(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "bank-transactions", "unmatched"],
    queryFn: () => getUnmatchedBankTransactions(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useMatchBankTransaction(companyId: string | undefined) {
  return useMutation({
    mutationFn: (bankTransactionId: string) => matchBankTransaction(companyId!, bankTransactionId),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}

export function useUnmatchBankTransaction(companyId: string | undefined) {
  return useMutation({
    mutationFn: (bankTransactionId: string) => unmatchBankTransaction(companyId!, bankTransactionId),
    onSuccess: async () => {
      if (companyId) await invalidateBankingQueries(companyId);
    },
  });
}
