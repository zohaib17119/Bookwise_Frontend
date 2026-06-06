import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getAccountingSettings,
  getCompanySettings,
  updateCompanySettings,
  upsertAccountingSettings,
} from "@/features/settings/api/settings.api";
import type {
  AccountingSettingsPayload,
  CompanySettingsPayload,
} from "@/features/settings/types/settings.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateSettingsQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "accounting-settings"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "tax-settings"] }),
  ]);
}

export function useCompanySettings(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "settings", "company"],
    queryFn: () => getCompanySettings(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useUpdateCompanySettings(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: CompanySettingsPayload) => updateCompanySettings(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateSettingsQueries(companyId);
    },
  });
}

export function useAccountingSettings(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "accounting-settings"],
    queryFn: () => getAccountingSettings(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useUpsertAccountingSettings(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: AccountingSettingsPayload) =>
      upsertAccountingSettings(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateSettingsQueries(companyId);
    },
  });
}
