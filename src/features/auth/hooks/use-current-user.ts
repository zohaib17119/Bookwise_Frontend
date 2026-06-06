import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
    staleTime: 60_000,
    meta: {
      silentError: true,
    },
    select: (user) => {
      setUser(user);
      return user;
    },
  });
}
