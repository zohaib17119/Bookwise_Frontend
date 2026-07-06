import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout as logoutRequest } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCompanyStore } from "@/features/companies/store/company.store";
import { queryClient } from "@/lib/query/query-client";

export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      setActiveCompanyId(null);
      clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
}
