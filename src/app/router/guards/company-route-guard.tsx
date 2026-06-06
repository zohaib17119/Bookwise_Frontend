import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import type { ApiError } from "@/lib/api/types";
import { ErrorState } from "@/components/shared/error-state";
import { useCompany } from "@/features/companies/hooks/use-company";
import { LoadingState } from "@/components/shared/loading-state";
import { useCompanyStore } from "@/features/companies/store/company.store";

export function CompanyRouteGuard() {
  const { companyId } = useParams();
  const setActiveCompanyId = useCompanyStore((state) => state.setActiveCompanyId);
  const companyQuery = useCompany(companyId);

  useEffect(() => {
    if (companyId) {
      setActiveCompanyId(companyId);
    }
  }, [companyId, setActiveCompanyId]);

  if (!companyId) {
    return <Navigate replace to="/app/companies" />;
  }

  if (companyQuery.isLoading) {
    return <LoadingState title="Loading company context" description="Resolving active company and membership access." />;
  }

  if (companyQuery.error || !companyQuery.data) {
    const error = companyQuery.error as ApiError | null;

    if (error?.status === 403) {
      return <Navigate replace to="/forbidden" />;
    }

    return (
      <ErrorState
        title="Company access issue"
        description={companyQuery.error?.message ?? "The selected company could not be loaded."}
      />
    );
  }

  return <Outlet />;
}
