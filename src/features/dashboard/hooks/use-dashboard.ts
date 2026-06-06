import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getCashflowAnalytics,
  getCompanyDashboard,
  getExpenseAnalytics,
  getRevenueAnalytics,
} from "@/features/dashboard/api/dashboard.api";

export function useCompanyDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "dashboard"],
    queryFn: () => getCompanyDashboard(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useDashboardAnalytics(companyId: string | undefined) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["companies", companyId, "analytics", "revenue"],
        queryFn: () => getRevenueAnalytics(companyId!),
        enabled: Boolean(companyId),
      },
      {
        queryKey: ["companies", companyId, "analytics", "expenses"],
        queryFn: () => getExpenseAnalytics(companyId!),
        enabled: Boolean(companyId),
      },
      {
        queryKey: ["companies", companyId, "analytics", "cashflow"],
        queryFn: () => getCashflowAnalytics(companyId!),
        enabled: Boolean(companyId),
      },
    ],
  });

  return {
    revenue: queries[0],
    expenses: queries[1],
    cashflow: queries[2],
  };
}
