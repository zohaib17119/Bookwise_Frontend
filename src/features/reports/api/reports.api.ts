import { apiClient } from "@/lib/api/client";
import type {
  GeneralLedgerReportResult,
  LedgerReportAccountSection,
  LedgerReportEntry,
} from "@/features/reports/types/ledger-report.types";
import type {
  GenericReportResult,
  ReportFilterParams,
  ReportRow,
  ReportSection,
} from "@/features/reports/types/report.types";

function buildQuery(params: ReportFilterParams) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.asOfDate) query.set("asOfDate", params.asOfDate);
  if (params.accountId) query.set("accountId", params.accountId);
  if (params.postedOnly !== undefined) query.set("postedOnly", String(params.postedOnly));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function asMoneyString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function mapTotals(rawTotals: Record<string, string | number | boolean> | undefined) {
  const totals: Record<string, number | string | null> = {};
  if (!rawTotals) return totals;
  for (const [k, v] of Object.entries(rawTotals)) {
    if (typeof v === "boolean") totals[k] = v ? "✓ Balanced" : "✗ Unbalanced";
    else totals[k] = asMoneyString(v);
  }
  return totals;
}

/** Convert an array of {accountCode, accountName, amount} rows to ReportRow[] */
function accountRowsToReportRows(
  rows: Array<{ accountCode?: string; accountName?: string; amount?: string | number }>,
): ReportRow[] {
  return rows.map((row) => ({
    label: row.accountCode ? `${row.accountCode} — ${row.accountName ?? ""}` : (row.accountName ?? ""),
    value: asMoneyString(row.amount),
  }));
}

/** Transform P&L backend payload → GenericReportResult */
function transformProfitAndLoss(payload: Record<string, unknown>): GenericReportResult {
  const income = Array.isArray(payload.income) ? accountRowsToReportRows(payload.income as any[]) : [];
  const cogs = Array.isArray(payload.costOfGoodsSold) ? accountRowsToReportRows(payload.costOfGoodsSold as any[]) : [];
  const expenses = Array.isArray(payload.expenses) ? accountRowsToReportRows(payload.expenses as any[]) : [];

  const sections: ReportSection[] = [];
  if (income.length) sections.push({ title: "Income", rows: income });
  if (cogs.length) sections.push({ title: "Cost of Goods Sold", rows: cogs });
  if (expenses.length) sections.push({ title: "Expenses", rows: expenses });

  return {
    sections,
    totals: mapTotals(payload.totals as Record<string, string | number | boolean> | undefined),
    currencyCode: (payload.currencyCode as string | null) ?? null,
  };
}

/** Transform Balance Sheet backend payload → GenericReportResult */
function transformBalanceSheet(payload: Record<string, unknown>): GenericReportResult {
  const assets = Array.isArray(payload.assets) ? accountRowsToReportRows(payload.assets as any[]) : [];
  const liabilities = Array.isArray(payload.liabilities) ? accountRowsToReportRows(payload.liabilities as any[]) : [];
  const equity = Array.isArray(payload.equity) ? accountRowsToReportRows(payload.equity as any[]) : [];

  const sections: ReportSection[] = [];
  if (assets.length) sections.push({ title: "Assets", rows: assets });
  if (liabilities.length) sections.push({ title: "Liabilities", rows: liabilities });
  if (equity.length) sections.push({ title: "Equity", rows: equity });

  return {
    sections,
    totals: mapTotals(payload.totals as Record<string, string | number | boolean> | undefined),
    currencyCode: (payload.currencyCode as string | null) ?? null,
  };
}

/** Transform Trial Balance backend payload → GenericReportResult */
function transformTrialBalance(payload: Record<string, unknown>): GenericReportResult {
  const rawRows = Array.isArray(payload.rows) ? (payload.rows as Array<Record<string, unknown>>) : [];
  const rows: ReportRow[] = rawRows.map((row) => ({
    label: row.accountCode ? `${row.accountCode} — ${row.accountName ?? ""}` : String(row.accountName ?? ""),
    debit: asMoneyString(row.totalDebit),
    credit: asMoneyString(row.totalCredit),
    balance: asMoneyString(row.netBalance),
  }));

  return {
    rows,
    totals: mapTotals(payload.totals as Record<string, string | number | boolean> | undefined),
    currencyCode: (payload.currencyCode as string | null) ?? null,
  };
}

function mapLedgerEntry(entry: Record<string, unknown>): LedgerReportEntry {
  return {
    journalEntryId: entry.journalEntryId != null ? String(entry.journalEntryId) : undefined,
    entryDate: String(entry.entryDate ?? ""),
    entryNumber: entry.entryNumber != null ? String(entry.entryNumber) : null,
    voucherType: String(entry.voucherType ?? entry.sourceModule ?? "Journal"),
    voucherNumber: String(entry.voucherNumber ?? entry.sourceNumber ?? entry.entryNumber ?? "—"),
    description: entry.description != null ? String(entry.description) : null,
    debitAmount: asMoneyString(entry.debitAmount) ?? "0.00",
    creditAmount: asMoneyString(entry.creditAmount) ?? "0.00",
    runningBalance: asMoneyString(entry.runningBalance) ?? "0.00",
  };
}

function mapLedgerAccountSection(raw: Record<string, unknown>): LedgerReportAccountSection | null {
  const account = raw.account as Record<string, unknown> | undefined;
  if (!account?.id) return null;
  const summary = raw.summary as Record<string, string | number> | undefined;
  const entries = Array.isArray(raw.entries)
    ? (raw.entries as Array<Record<string, unknown>>).map(mapLedgerEntry)
    : [];

  return {
    account: {
      id: String(account.id),
      code: String(account.code ?? ""),
      name: String(account.name ?? ""),
      type: account.type != null ? String(account.type) : undefined,
      normalSide: account.normalSide != null ? String(account.normalSide) : undefined,
    },
    summary: summary
      ? {
          openingBalance: asMoneyString(summary.openingBalance) ?? undefined,
          closingBalance: asMoneyString(summary.closingBalance) ?? undefined,
          movementDebit: asMoneyString(summary.movementDebit) ?? undefined,
          movementCredit: asMoneyString(summary.movementCredit) ?? undefined,
        }
      : undefined,
    entries,
  };
}

/** Transform General Ledger backend payload → multi-account ledger result */
function transformGeneralLedger(payload: Record<string, unknown>): GeneralLedgerReportResult {
  const currencyCode = (payload.currencyCode as string | null) ?? null;

  if (Array.isArray(payload.accounts)) {
    return {
      currencyCode,
      accounts: (payload.accounts as Array<Record<string, unknown>>)
        .map(mapLedgerAccountSection)
        .filter((section): section is LedgerReportAccountSection => Boolean(section)),
    };
  }

  // Legacy single-account shape
  const single = mapLedgerAccountSection(payload);
  return {
    currencyCode,
    accounts: single ? [single] : [],
  };
}

/** Transform AR/AP Aging backend payload → GenericReportResult */
function transformAging(
  payload: Record<string, unknown>,
  summaryKey: "customerSummaries" | "vendorSummaries",
  nameKey: "customerName" | "vendorName",
): GenericReportResult {
  const summaries = Array.isArray(payload[summaryKey])
    ? (payload[summaryKey] as Array<Record<string, unknown>>)
    : [];

  const rows: ReportRow[] = summaries.map((row) => ({
    label: String(row[nameKey] ?? ""),
    value: asMoneyString(row.totalDue),
    ["Current"]: asMoneyString(row.current),
    ["1-30"]: asMoneyString(row.bucket1To30),
    ["31-60"]: asMoneyString(row.bucket31To60),
    ["61-90"]: asMoneyString(row.bucket61To90),
    ["91+"]: asMoneyString(row.bucket90Plus),
  }));

  return {
    rows,
    totals: mapTotals(payload.totals as Record<string, string | number | boolean> | undefined),
    currencyCode: (payload.currencyCode as string | null) ?? null,
  };
}

type ReportTransformer = (payload: Record<string, unknown>) => GenericReportResult;

async function getReport(
  companyId: string,
  path: string,
  params: ReportFilterParams = {},
  transformer?: ReportTransformer,
): Promise<GenericReportResult> {
  const response = await apiClient.get<unknown>(
    `/companies/${companyId}/reports/${path}${buildQuery(params)}`,
  );
  // apiClient.get returns { data: <axios response body> }
  // sendSuccess wraps payload as { success, message, data: <report> }
  const body = response.data as Record<string, unknown>;
  const payload = (body?.data ?? body) as Record<string, unknown>;

  if (transformer) {
    return transformer(payload);
  }
  return payload as GenericReportResult;
}

export const getTrialBalanceReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "trial-balance", params, transformTrialBalance);

export async function getGeneralLedgerReport(
  companyId: string,
  params: ReportFilterParams = {},
): Promise<GeneralLedgerReportResult> {
  const response = await apiClient.get<unknown>(
    `/companies/${companyId}/reports/general-ledger${buildQuery(params)}`,
  );
  const body = response.data as Record<string, unknown>;
  const payload = (body?.data ?? body) as Record<string, unknown>;
  return transformGeneralLedger(payload);
}

export const getProfitAndLossReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "profit-and-loss", params, transformProfitAndLoss);

export const getBalanceSheetReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "balance-sheet", params, transformBalanceSheet);

export const getArAgingReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "accounts-receivable-aging", params, (p) =>
    transformAging(p, "customerSummaries", "customerName"),
  );

export const getApAgingReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "accounts-payable-aging", params, (p) =>
    transformAging(p, "vendorSummaries", "vendorName"),
  );
