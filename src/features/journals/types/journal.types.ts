import type { BaseEntityListParams } from "@/features/shared/types/common";

export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountCode?: string | null;
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

export interface JournalEntryLinePayload {
  accountId: string;
  description?: string;
  debitAmount?: string | number;
  creditAmount?: string | number;
}

export interface JournalEntryPayload {
  entryDate?: string;
  entryNumber?: string;
  description?: string;
  referenceNumber?: string;
  lines: JournalEntryLinePayload[];
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
  debitAmount?: number | string | null;
  creditAmount?: number | string | null;
  runningBalance?: number | string | null;
  sourceModule?: string | null;
  voucherType?: string | null;
  voucherNumber?: string | null;
}

export interface AccountLedgerResult {
  account?: {
    id: string;
    code: string;
    name: string;
    normalSide?: string;
  };
  summary?: Record<string, string | number | null>;
  lines: LedgerRow[];
}
