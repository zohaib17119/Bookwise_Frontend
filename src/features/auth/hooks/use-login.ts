import { useMutation } from "@tanstack/react-query";
import { login } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { queryClient } from "@/lib/query/query-client";

export function useLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens({ accessToken: data.token, refreshToken: data.refreshToken });
      setUser(data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}
