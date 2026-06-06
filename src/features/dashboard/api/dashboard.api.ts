import { apiClient } from "@/lib/api/client";
import type {
  AnalyticsPoint,
  DashboardOverview,
} from "@/features/dashboard/types/dashboard.types";

export async function getCompanyDashboard(companyId: string) {
  const { data } = await apiClient.get<DashboardOverview>(
    `/companies/${companyId}/dashboard`,
  );
  return data;
}

export async function getRevenueAnalytics(companyId: string) {
  const { data } = await apiClient.get<AnalyticsPoint[]>(
    `/companies/${companyId}/analytics/revenue`,
  );
  return data;
}

export async function getExpenseAnalytics(companyId: string) {
  const { data } = await apiClient.get<AnalyticsPoint[]>(
    `/companies/${companyId}/analytics/expenses`,
  );
  return data;
}

export async function getCashflowAnalytics(companyId: string) {
  const { data } = await apiClient.get<AnalyticsPoint[]>(
    `/companies/${companyId}/analytics/cashflow`,
  );
  return data;
}
