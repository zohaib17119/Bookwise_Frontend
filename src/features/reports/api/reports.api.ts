import { apiClient } from "@/lib/api/client";
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
  if (params.postedOnly) query.set("postedOnly", "true");
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

/** Convert an array of {accountCode, accountName, amount} rows to ReportRow[] */
function accountRowsToReportRows(
  rows: Array<{ accountCode?: string; accountName?: string; amount?: string | number }>,
): ReportRow[] {
  return rows.map((row) => ({
    label: row.accountCode ? `${row.accountCode} — ${row.accountName ?? ""}` : (row.accountName ?? ""),
    value: row.amount != null ? Number(row.amount) : null,
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

  const rawTotals = payload.totals as Record<string, string | number> | undefined;
  const totals: Record<string, number | string | null> = {};
  if (rawTotals) {
    for (const [k, v] of Object.entries(rawTotals)) {
      totals[k] = typeof v === "string" ? Number(v) : v;
    }
  }

  return {
    sections,
    totals,
    currencyCode: payload.currencyCode as string | null ?? null,
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

  const rawTotals = payload.totals as Record<string, string | number | boolean> | undefined;
  const totals: Record<string, number | string | null> = {};
  if (rawTotals) {
    for (const [k, v] of Object.entries(rawTotals)) {
      if (typeof v === "boolean") totals[k] = v ? "✓ Balanced" : "✗ Unbalanced";
      else totals[k] = typeof v === "string" ? Number(v) : v;
    }
  }

  return { sections, totals, currencyCode: payload.currencyCode as string | null ?? null };
}

/** Transform Trial Balance backend payload → GenericReportResult */
function transformTrialBalance(payload: Record<string, unknown>): GenericReportResult {
  const rawRows = Array.isArray(payload.rows) ? (payload.rows as Array<Record<string, unknown>>) : [];
  const rows: ReportRow[] = rawRows.map((row) => ({
    label: row.accountCode ? `${row.accountCode} — ${row.accountName ?? ""}` : String(row.accountName ?? ""),
    debit: row.totalDebit != null ? Number(row.totalDebit) : null,
    credit: row.totalCredit != null ? Number(row.totalCredit) : null,
    balance: row.netBalance != null ? Number(row.netBalance) : null,
  }));

  const rawTotals = payload.totals as Record<string, string | number | boolean> | undefined;
  const totals: Record<string, number | string | null> = {};
  if (rawTotals) {
    for (const [k, v] of Object.entries(rawTotals)) {
      if (typeof v === "boolean") totals[k] = v ? "✓ Balanced" : "✗ Unbalanced";
      else totals[k] = typeof v === "string" ? Number(v) : v;
    }
  }

  return { rows, totals, currencyCode: payload.currencyCode as string | null ?? null };
}

/** Transform General Ledger backend payload → GenericReportResult */
function transformGeneralLedger(payload: Record<string, unknown>): GenericReportResult {
  const account = payload.account as Record<string, unknown> | undefined;
  const summary = payload.summary as Record<string, string | number> | undefined;
  const entries = Array.isArray(payload.entries) ? (payload.entries as Array<Record<string, unknown>>) : [];

  const rows: ReportRow[] = entries.map((entry) => ({
    label: String(entry.description ?? entry.entryNumber ?? ""),
    debit: entry.debitAmount != null ? Number(entry.debitAmount) : null,
    credit: entry.creditAmount != null ? Number(entry.creditAmount) : null,
    balance: entry.runningBalance != null ? Number(entry.runningBalance) : null,
  }));

  const totals: Record<string, number | string | null> = {};
  if (account) totals["Account"] = `${account.code ?? ""} — ${account.name ?? ""}`;
  if (summary) {
    for (const [k, v] of Object.entries(summary)) {
      totals[k] = typeof v === "string" ? Number(v) : v;
    }
  }

  return { rows, totals, currencyCode: payload.currencyCode as string | null ?? null };
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
    value: row.totalDue != null ? Number(row.totalDue) : null,
    ["Current"]: row.current != null ? Number(row.current) : null,
    ["1-30"]: row.bucket1To30 != null ? Number(row.bucket1To30) : null,
    ["31-60"]: row.bucket31To60 != null ? Number(row.bucket31To60) : null,
    ["61-90"]: row.bucket61To90 != null ? Number(row.bucket61To90) : null,
    ["91+"]: row.bucket90Plus != null ? Number(row.bucket90Plus) : null,
  }));

  const rawTotals = payload.totals as Record<string, string | number> | undefined;
  const totals: Record<string, number | string | null> = {};
  if (rawTotals) {
    for (const [k, v] of Object.entries(rawTotals)) {
      totals[k] = typeof v === "string" ? Number(v) : v;
    }
  }

  return { rows, totals, currencyCode: payload.currencyCode as string | null ?? null };
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

export const getGeneralLedgerReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "general-ledger", params, transformGeneralLedger);

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
