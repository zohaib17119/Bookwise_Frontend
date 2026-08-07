import { useEffect } from "react";
import { refreshAccessToken } from "@/lib/api/client";
import { useAuthStore } from "@/features/auth/store/auth.store";

/** Refresh this many ms before access JWT `exp` (default ~90s). */
const REFRESH_BEFORE_EXPIRY_MS = 90_000;
/** Fallback interval when JWT `exp` cannot be parsed (13m for a 15m access token). */
const FALLBACK_REFRESH_INTERVAL_MS = 13 * 60 * 1000;
const MIN_REFRESH_DELAY_MS = 5_000;
const NETWORK_RETRY_DELAY_MS = 30_000;

function getAccessTokenExpiryMs(token: string): number | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) {
      return null;
    }

    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp !== "number") {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function delayUntilRefresh(token: string): number {
  const expiryMs = getAccessTokenExpiryMs(token);

  if (expiryMs == null) {
    return FALLBACK_REFRESH_INTERVAL_MS;
  }

  return Math.max(MIN_REFRESH_DELAY_MS, expiryMs - Date.now() - REFRESH_BEFORE_EXPIRY_MS);
}

/**
 * Silently refreshes the access token before it expires so mid-form API calls
 * are less likely to hit a 401 → refresh race.
 */
export function useProactiveTokenRefresh(enabled: boolean) {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const schedule = (currentToken: string) => {
      const delay = delayUntilRefresh(currentToken);
      timerId = setTimeout(async () => {
        if (cancelled) {
          return;
        }

        try {
          const nextToken = await refreshAccessToken();
          if (!cancelled) {
            schedule(nextToken);
          }
        } catch {
          // Definitive auth failures are handled by the API client interceptor.
          // Network / 5xx: retry soon without wiping the session.
          if (!cancelled) {
            timerId = setTimeout(() => {
              const latest = useAuthStore.getState().token;
              if (latest && !cancelled) {
                schedule(latest);
              }
            }, NETWORK_RETRY_DELAY_MS);
          }
        }
      }, delay);
    };

    schedule(token);

    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }, [enabled, token]);
}
