import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  updateAccount,
} from "@/features/accounts/api/accounts.api";
import type {
  AccountListParams,
  AccountPayload,
} from "@/features/accounts/types/account.types";
import { queryClient } from "@/lib/query/query-client";

export function useAccounts(
  companyId: string | undefined,
  params: AccountListParams,
) {
  return useQuery({
    queryKey: ["companies", companyId, "accounts", params],
    queryFn: () => getAccounts(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useAccount(companyId: string | undefined, accountId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "accounts", accountId],
    queryFn: () => getAccount(companyId!, accountId!),
    enabled: Boolean(companyId && accountId),
  });
}

export function useAccountOptions(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "accounts", "options"],
    queryFn: () =>
      getAccounts(companyId!, {
        includeInactive: false,
        includeSystemGenerated: true,
      }),
    enabled: Boolean(companyId),
  });
}

export function useParentAccountOptions(
  companyId: string | undefined,
  currentAccountId?: string | null,
) {
  const query = useAccountOptions(companyId);

  return {
    ...query,
    data: (query.data ?? []).filter((account) => account.id !== currentAccountId),
  };
}

function invalidateAccountQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "accounts"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useCreateAccount(companyId: string | undefined) {

  return useMutation({
  
    mutationFn: (payload: AccountPayload) => {
    console.log("payload",payload)
      return  createAccount(companyId!, payload)
    },
    onSuccess: async () => {
      if (companyId) await invalidateAccountQueries(companyId);
    },
  });
}

export function useUpdateAccount(
  companyId: string | undefined,
  accountId: string | null,
) {
  return useMutation({
    mutationFn: (payload: AccountPayload) =>
      updateAccount(companyId!, accountId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateAccountQueries(companyId);
    },
  });
}

export function useDeleteAccount(companyId: string | undefined) {
  return useMutation({
    mutationFn: (accountId: string) => deleteAccount(companyId!, accountId),
    onSuccess: async () => {
      if (companyId) await invalidateAccountQueries(companyId);
    },
  });
}
