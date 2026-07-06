import { useMutation } from "@tanstack/react-query";
import { resendVerification, verifyEmail } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { queryClient } from "@/lib/query/query-client";

export function useVerifyEmail() {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: resendVerification,
  });
}
