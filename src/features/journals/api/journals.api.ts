import { apiClient } from "@/lib/api/client";
import { extractListData } from "@/lib/api/response";
import type {
  AccountLedgerResult,
  JournalEntry,
  JournalEntryLinePayload,
  JournalEntryPayload,
  JournalListParams,
} from "@/features/journals/types/journal.types";
import { omitEmptyFields, serializeOptionalMoneyField } from "@/features/shared/utils/api-payload";

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

function serializeJournalLine(line: JournalEntryLinePayload): JournalEntryLinePayload {
  return omitEmptyFields({
    accountId: line.accountId,
    description: line.description || undefined,
    debitAmount: serializeOptionalMoneyField(line.debitAmount),
    creditAmount: serializeOptionalMoneyField(line.creditAmount),
  }) as JournalEntryLinePayload;
}

function serializeJournalPayload(payload: JournalEntryPayload): JournalEntryPayload {
  return {
    ...omitEmptyFields({
      entryDate: payload.entryDate || undefined,
      entryNumber: payload.entryNumber || undefined,
      description: payload.description || undefined,
      referenceNumber: payload.referenceNumber || undefined,
    }),
    lines: payload.lines.map(serializeJournalLine),
  };
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
    serializeJournalPayload(payload),
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
    serializeJournalPayload(payload),
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

export async function getLedger(
  companyId: string,
  accountId: string,
  params: { fromDate?: string; toDate?: string } = {},
) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await apiClient.get<AccountLedgerResult>(
    `/companies/${companyId}/accounts/${accountId}/ledger${suffix}`,
  );
  const payload = data as AccountLedgerResult | { data?: AccountLedgerResult };
  const body =
    payload && typeof payload === "object" && "lines" in payload
      ? (payload as AccountLedgerResult)
      : ((payload as { data?: AccountLedgerResult }).data ?? { lines: [] });

  return {
    account: body.account,
    summary: body.summary,
    lines: (body.lines ?? []).map((line) => ({
      ...line,
      entryDate: line.entryDate ?? (line as { journalEntry?: { entryDate?: string } }).journalEntry?.entryDate,
      entryNumber:
        line.entryNumber ?? (line as { journalEntry?: { entryNumber?: string } }).journalEntry?.entryNumber,
      debitAmount: String(line.debitAmount ?? "0.00"),
      creditAmount: String(line.creditAmount ?? "0.00"),
      runningBalance: String(line.runningBalance ?? "0.00"),
      voucherType: line.voucherType ?? line.sourceModule ?? "Journal",
      voucherNumber: line.voucherNumber ?? line.entryNumber ?? "—",
    })),
  };
}
