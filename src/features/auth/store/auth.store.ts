import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/features/auth/types/auth.types";
import { storageKeys } from "@/lib/utils/storage";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  hydrated: boolean;
  setToken: (token: string | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string } | null) => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setToken: (token) => set({ token }),
      setTokens: (tokens) =>
        set({
          token: tokens?.accessToken ?? null,
          refreshToken: tokens?.refreshToken ?? null,
        }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: storageKeys.authToken,
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
