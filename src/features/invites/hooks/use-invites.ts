import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvite,
  createCompanyInvite,
  getCompanyInvites,
  getInvitePreview,
  getMyInvites,
  type CreateInvitePayload,
} from "@/features/invites/api/invite.api";

export function useMyInvites() {
  return useQuery({
    queryKey: ["invites", "me"],
    queryFn: getMyInvites,
  });
}

export function useCompanyInvites(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "invites"],
    queryFn: () => getCompanyInvites(companyId!),
    enabled: Boolean(companyId),
  });
}

export function useInvitePreview(token: string | undefined) {
  return useQuery({
    queryKey: ["invites", token],
    queryFn: () => getInvitePreview(token!),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useCreateCompanyInvite(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvitePayload) => createCompanyInvite(companyId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", companyId, "invites"] });
      queryClient.invalidateQueries({ queryKey: ["companies", companyId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["companies", "me"] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
