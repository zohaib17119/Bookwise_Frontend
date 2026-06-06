import { useQuery } from "@tanstack/react-query";
import { getCompany } from "@/features/companies/api/company.api";

export function useCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId],
    queryFn: () => getCompany(companyId!),
    enabled: Boolean(companyId),
  });
}
