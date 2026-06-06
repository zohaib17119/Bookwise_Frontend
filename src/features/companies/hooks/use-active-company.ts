import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCompany } from "@/features/companies/hooks/use-company";
import { useCompanyPermissions } from "@/features/permissions/hooks/use-company-permissions";

export function useActiveCompany() {
  const { companyId } = useParams();
  const memberships = useAuthStore((state) => state.user?.memberships ?? []);
  const membership = memberships.find((item) => item.companyId === companyId);
  const companyQuery = useCompany(companyId);
  const permissionsQuery = useCompanyPermissions(companyId);

  return useMemo(
    () => ({
      companyId,
      company: companyQuery.data,
      membership,
      role: permissionsQuery.role ?? membership?.role,
      permissions: permissionsQuery.permissions,
      currency: companyQuery.data?.currency ?? "USD",
      isLoading: companyQuery.isLoading || permissionsQuery.isLoading,
      error: companyQuery.error ?? permissionsQuery.error ?? null,
    }),
    [
      companyId,
      companyQuery.data,
      companyQuery.error,
      companyQuery.isLoading,
      membership,
      permissionsQuery.error,
      permissionsQuery.isLoading,
      permissionsQuery.permissions,
      permissionsQuery.role,
    ],
  );
}
