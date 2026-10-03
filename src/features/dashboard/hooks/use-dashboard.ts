import { useQuery } from "@tanstack/react-query";
import { getCompanyDashboard } from "@/features/dashboard/api/dashboard.api";
import type { DashboardQueryParams } from "@/features/dashboard/types/dashboard.types";

export function useCompanyDashboard(
  companyId: string | undefined,
  params: DashboardQueryParams = {},
) {
  return useQuery({
    queryKey: [
      "companies",
      companyId,
      "dashboard",
      params.fromDate,
      params.toDate,
      ...(params.salesPersonIds ?? []).slice().sort(),
    ],
    queryFn: () => getCompanyDashboard(companyId!, params),
    enabled: Boolean(companyId),
  });
}
