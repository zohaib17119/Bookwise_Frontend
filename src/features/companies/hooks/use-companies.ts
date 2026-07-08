import { useQuery } from "@tanstack/react-query";
import { getMyCompanies } from "@/features/companies/api/company.api";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies", "me"],
    queryFn: getMyCompanies,
  });
}
