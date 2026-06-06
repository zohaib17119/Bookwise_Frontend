import { useQuery } from "@tanstack/react-query";
import { getCompaniesByOwner } from "@/features/companies/api/company.api";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function useCompanies() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["companies", user?.id],
    queryFn: () => getCompaniesByOwner(user!.id),
    enabled: Boolean(user?.id),
  });
}
