import { useMutation } from "@tanstack/react-query";
import { register } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { queryClient } from "@/lib/query/query-client";

export function useRegister() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setTokens({ accessToken: data.token, refreshToken: data.refreshToken });
      setUser(data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}
