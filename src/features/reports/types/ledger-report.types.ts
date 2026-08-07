export interface LedgerReportEntry {
  journalEntryId?: string;
  entryDate: string;
  entryNumber?: string | null;
  voucherType: string;
  voucherNumber: string;
  description?: string | null;
  debitAmount: string | number;
  creditAmount: string | number;
  runningBalance: string | number;
}

export interface LedgerReportAccountSection {
  account: {
    id: string;
    code: string;
    name: string;
    type?: string;
    normalSide?: string;
  };
  summary?: {
    openingBalance?: string | number;
    closingBalance?: string | number;
    movementDebit?: string | number;
    movementCredit?: string | number;
  };
  entries: LedgerReportEntry[];
}

export interface GeneralLedgerReportResult {
  currencyCode?: string | null;
  accounts: LedgerReportAccountSection[];
}

export function toIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultMonthToTodayRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    fromDate: toIsoDateLocal(monthStart),
    toDate: toIsoDateLocal(now),
  };
}
