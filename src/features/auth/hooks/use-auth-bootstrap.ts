import { useEffect, useState } from "react";
import { refreshSession } from "@/features/auth/api/auth.api";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { storageKeys } from "@/lib/utils/storage";

let bootstrapPromise: Promise<string | null> | null = null;

async function restoreSession() {
  localStorage.removeItem(storageKeys.authToken);

  try {
    const { accessToken } = await refreshSession();
    useAuthStore.getState().setToken(accessToken);
    return accessToken;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
}

export function useAuthBootstrap() {
  const token = useAuthStore((state) => state.token);
  const [bootstrapping, setBootstrapping] = useState(() => !token);
  const { isLoading } = useCurrentUser();

  useEffect(() => {
    if (token) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;

    if (!bootstrapPromise) {
      bootstrapPromise = restoreSession().finally(() => {
        bootstrapPromise = null;
      });
    }

    bootstrapPromise.then(() => {
      if (!cancelled) {
        setBootstrapping(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return {
    isReady: !bootstrapping && (!token || !isLoading),
  };
}
