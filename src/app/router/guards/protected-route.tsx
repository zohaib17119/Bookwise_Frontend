import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthBootstrap } from "@/features/auth/hooks/use-auth-bootstrap";
import { useProactiveTokenRefresh } from "@/features/auth/hooks/use-proactive-token-refresh";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { LoadingState } from "@/components/shared/loading-state";

export function ProtectedRoute() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const { isReady } = useAuthBootstrap();

  useProactiveTokenRefresh(Boolean(isReady && token));

  if (!isReady) {
    return <LoadingState title="Starting session" description="Bootstrapping your JWT session and user profile." fullScreen />;
  }

  if (!token) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }
  return <Outlet />;
}
