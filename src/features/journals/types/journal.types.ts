import type { BaseEntityListParams } from "@/features/shared/types/common";

export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountName?: string | null;
  description?: string | null;
  debitAmount: number;
  creditAmount: number;
}

export interface JournalEntry {
  id: string;
  entryDate?: string | null;
  entryNumber?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  status?: "DRAFT" | "POSTED" | "VOID" | "REVERSED" | null;
  sourceModule?: string | null;
  sourceId?: string | null;
  lines: JournalEntryLine[];
}

export interface JournalEntryPayload {
  entryDate?: string;
  entryNumber?: string;
  description?: string;
  referenceNumber?: string;
  lines: JournalEntryLine[];
}

export interface JournalListParams extends BaseEntityListParams {
  status?: string;
  sourceModule?: string;
  fromDate?: string;
  toDate?: string;
}

export interface LedgerRow {
  id: string;
  entryDate?: string | null;
  entryNumber?: string | null;
  description?: string | null;
  debitAmount?: number | null;
  creditAmount?: number | null;
  runningBalance?: number | null;
  sourceModule?: string | null;
}
