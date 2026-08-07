import { useQuery } from "@tanstack/react-query";
import { getMyCompanies } from "@/features/companies/api/company.api";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function useCompanies() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ["companies", userId],
    queryFn: getMyCompanies,
    enabled: Boolean(userId),
  });
}
