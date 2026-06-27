import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  JournalEntry,
  JournalEntryPayload,
  JournalListParams,
  LedgerRow,
} from "@/features/journals/types/journal.types";

function buildQuery(params: JournalListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.sourceModule) query.set("sourceModule", params.sourceModule);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  query.set("limit", String(params.limit ?? 100));
  if (params.page) query.set("page", String(params.page));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getJournalEntries(companyId: string, params: JournalListParams = {}) {
  const { data } = await apiClient.get<JournalEntry[]>(
    `/companies/${companyId}/journal-entries${buildQuery(params)}`,
  );
  return extractListData(data);
}

export async function getJournalEntry(companyId: string, journalEntryId: string) {
  const { data } = await apiClient.get<JournalEntry>(
    `/companies/${companyId}/journal-entries/${journalEntryId}`,
  );
  return data;
}

export async function createJournalEntry(
  companyId: string,
  payload: JournalEntryPayload,
) {
  const { data } = await apiClient.post<JournalEntry>(
    `/companies/${companyId}/journal-entries`,
    payload,
  );
  return data;
}

export async function updateJournalEntry(
  companyId: string,
  journalEntryId: string,
  payload: JournalEntryPayload,
) {
  const { data } = await apiClient.patch<JournalEntry>(
    `/companies/${companyId}/journal-entries/${journalEntryId}`,
    payload,
  );
  return data;
}

export async function postJournalEntry(companyId: string, journalEntryId: string) {
  const { data } = await apiClient.post<JournalEntry>(
    `/companies/${companyId}/journal-entries/${journalEntryId}/post`,
  );
  return data;
}

export async function reverseJournalEntry(companyId: string, journalEntryId: string) {
  const { data } = await apiClient.post<JournalEntry>(
    `/companies/${companyId}/journal-entries/${journalEntryId}/reverse`,
  );
  return data;
}

export async function getLedger(companyId: string, accountId: string, params: { fromDate?: string; toDate?: string } = {}) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await apiClient.get<LedgerRow[]>(
    `/companies/${companyId}/accounts/${accountId}/ledger${suffix}`,
  );
  return extractListData(data);
}
