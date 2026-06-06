import { useQuery } from "@tanstack/react-query";
import { getCompanyPermissions } from "@/features/permissions/api/permissions.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { ApiError } from "@/lib/api/types";

export function useCompanyPermissions(companyId: string | undefined) {
  const memberships = useAuthStore((state) => state.user?.memberships ?? []);
  const membership = memberships.find((item) => item.companyId === companyId);
  const membershipPermissions = membership?.permissions ?? [];

  const remoteQuery = useQuery({
    queryKey: ["companies", companyId, "permissions"],
    queryFn: async () => {
      try {
        return await getCompanyPermissions(companyId!);
      } catch (error) {
        const apiError = error as ApiError;

        if (apiError.status === 404 || apiError.status === 405) {
          return {
            role: membership?.role,
            permissions: membershipPermissions,
          };
        }

        throw error;
      }
    },
    enabled: Boolean(companyId),
    staleTime: 60_000,
  });

  return {
    role: remoteQuery.data?.role ?? membership?.role,
    permissions: remoteQuery.data?.permissions ?? membershipPermissions,
    isLoading: remoteQuery.isLoading,
    error: remoteQuery.error,
  };
}
