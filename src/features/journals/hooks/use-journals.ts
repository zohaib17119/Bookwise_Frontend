import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  getLedger,
  postJournalEntry,
  reverseJournalEntry,
  updateJournalEntry,
} from "@/features/journals/api/journals.api";
import type {
  JournalEntryPayload,
  JournalListParams,
} from "@/features/journals/types/journal.types";
import { queryClient } from "@/lib/query/query-client";

function invalidateJournalQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "journal-entries"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "reports"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "dashboard"] }),
  ]);
}

export function useJournalEntries(companyId: string | undefined, params: JournalListParams) {
  return useQuery({
    queryKey: ["companies", companyId, "journal-entries", params],
    queryFn: () => getJournalEntries(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useJournalEntry(companyId: string | undefined, journalEntryId: string | null) {
  return useQuery({
    queryKey: ["companies", companyId, "journal-entries", journalEntryId],
    queryFn: () => getJournalEntry(companyId!, journalEntryId!),
    enabled: Boolean(companyId && journalEntryId),
  });
}

export function useCreateJournalEntry(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: JournalEntryPayload) => createJournalEntry(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateJournalQueries(companyId);
    },
  });
}

export function useUpdateJournalEntry(companyId: string | undefined, journalEntryId: string | null) {
  return useMutation({
    mutationFn: (payload: JournalEntryPayload) =>
      updateJournalEntry(companyId!, journalEntryId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateJournalQueries(companyId);
    },
  });
}

export function usePostJournalEntry(companyId: string | undefined) {
  return useMutation({
    mutationFn: (journalEntryId: string) => postJournalEntry(companyId!, journalEntryId),
    onSuccess: async () => {
      if (companyId) await invalidateJournalQueries(companyId);
    },
  });
}

export function useReverseJournalEntry(companyId: string | undefined) {
  return useMutation({
    mutationFn: (journalEntryId: string) => reverseJournalEntry(companyId!, journalEntryId),
    onSuccess: async () => {
      if (companyId) await invalidateJournalQueries(companyId);
    },
  });
}

export function useLedger(
  companyId: string | undefined,
  accountId: string | undefined,
  params: { fromDate?: string; toDate?: string },
) {
  return useQuery({
    queryKey: ["companies", companyId, "ledger", accountId, params],
    queryFn: () => getLedger(companyId!, accountId!, params),
    enabled: Boolean(companyId && accountId),
  });
}
