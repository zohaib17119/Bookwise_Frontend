import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addCompanyMember,
  getCompanyMembers,
  updateCompanyMember,
  type AddMemberPayload,
  type UpdateMemberPayload,
} from "@/features/permissions/api/team.api";
import { queryClient } from "@/lib/query/query-client";

export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companies", companyId, "members"],
    queryFn: () => getCompanyMembers(companyId!),
    enabled: Boolean(companyId),
  });
}

function invalidateTeamQueries(companyId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "members"] }),
    queryClient.invalidateQueries({ queryKey: ["companies", companyId, "permissions"] }),
  ]);
}

export function useAddCompanyMember(companyId: string | undefined) {
  return useMutation({
    mutationFn: (payload: AddMemberPayload) => addCompanyMember(companyId!, payload),
    onSuccess: async () => {
      if (companyId) await invalidateTeamQueries(companyId);
    },
  });
}

export function useUpdateCompanyMember(companyId: string | undefined) {
  return useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: UpdateMemberPayload }) =>
      updateCompanyMember(companyId!, memberId, payload),
    onSuccess: async () => {
      if (companyId) await invalidateTeamQueries(companyId);
    },
  });
}
