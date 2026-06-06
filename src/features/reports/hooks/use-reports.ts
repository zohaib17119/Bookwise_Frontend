import { useQuery } from "@tanstack/react-query";
import {
  getApAgingReport,
  getArAgingReport,
  getBalanceSheetReport,
  getGeneralLedgerReport,
  getProfitAndLossReport,
  getTrialBalanceReport,
} from "@/features/reports/api/reports.api";
import type { ReportFilterParams } from "@/features/reports/types/report.types";

export function useTrialBalanceReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "reports", "trial-balance", params],
    queryFn: () => getTrialBalanceReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useGeneralLedgerReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "reports", "general-ledger", params],
    queryFn: () => getGeneralLedgerReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useProfitAndLossReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "reports", "profit-and-loss", params],
    queryFn: () => getProfitAndLossReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useBalanceSheetReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "reports", "balance-sheet", params],
    queryFn: () => getBalanceSheetReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useArAgingReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "reports", "ar-aging", params],
    queryFn: () => getArAgingReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}

export function useApAgingReport(companyId: string | undefined, params: ReportFilterParams) {
  return useQuery({
    queryKey: ["companies", companyId, "reports", "ap-aging", params],
    queryFn: () => getApAgingReport(companyId!, params),
    enabled: Boolean(companyId),
  });
}
