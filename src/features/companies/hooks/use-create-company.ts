import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createCompany } from "@/features/companies/api/company.api";
import { queryClient } from "@/lib/query/query-client";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCompanyStore } from "@/features/companies/store/company.store";

export function useCreateCompany() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);

  return useMutation({
    mutationFn: createCompany,
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ["companies", user?.id] });
      queryClient.setQueryData(["companies", company.id], company);
      setActiveCompanyId(company.id);
      navigate(`/app/company/${company.id}/dashboard`);
    },
  });
}
