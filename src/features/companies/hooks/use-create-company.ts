import { useMutation } from "@tanstack/react-query";
import { createCompany } from "@/features/companies/api/company.api";
import { queryClient } from "@/lib/query/query-client";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCompanyStore } from "@/features/companies/store/company.store";

export function useCreateCompany() {
  const user = useAuthStore((state) => state.user);
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);

  return useMutation({
    mutationFn: createCompany,
    // Note: navigation is intentionally NOT done here. The create page shows a
    // "Setup complete" confirmation first, then navigates on user action.
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ["companies", user?.id] });
      queryClient.setQueryData(["companies", company.id], company);
      setActiveCompanyId(company.id);
    },
  });
}
