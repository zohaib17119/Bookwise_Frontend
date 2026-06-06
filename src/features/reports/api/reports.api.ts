import { apiClient } from "@/lib/api/client";
import type {
  GenericReportResult,
  ReportFilterParams,
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

async function getReport(
  companyId: string,
  path: string,
  params: ReportFilterParams = {},
) {
  const { data } = await apiClient.get<GenericReportResult>(
    `/companies/${companyId}/reports/${path}${buildQuery(params)}`,
  );
  return data;
}

export const getTrialBalanceReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "trial-balance", params);
export const getGeneralLedgerReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "general-ledger", params);
export const getProfitAndLossReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "profit-and-loss", params);
export const getBalanceSheetReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "balance-sheet", params);
export const getArAgingReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "accounts-receivable-aging", params);
export const getApAgingReport = (companyId: string, params: ReportFilterParams) =>
  getReport(companyId, "accounts-payable-aging", params);
