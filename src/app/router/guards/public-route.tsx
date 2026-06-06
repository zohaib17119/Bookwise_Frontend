import { Navigate, Outlet } from "react-router-dom";
import { useAuthBootstrap } from "@/features/auth/hooks/use-auth-bootstrap";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { LoadingState } from "@/components/shared/loading-state";

export function PublicRoute() {
  const token = useAuthStore((state) => state.token);
  const { isReady } = useAuthBootstrap();

  if (!isReady) {
    return <LoadingState title="Preparing application" description="Checking for an existing authenticated session." fullScreen />;
  }

  if (token) {
    return <Navigate replace to="/app/companies" />;
  }

  return <Outlet />;
}
