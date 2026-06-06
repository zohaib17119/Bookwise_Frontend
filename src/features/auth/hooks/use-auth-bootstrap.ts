import { useEffect } from "react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function useAuthBootstrap() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const { isLoading } = useCurrentUser();

  useEffect(() => {
    if (hydrated && !token) {
      useAuthStore.getState().setUser(null);
    }
  }, [hydrated, token]);

  return {
    isReady: hydrated && (!token || !isLoading),
  };
}
