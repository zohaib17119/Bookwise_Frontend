import { apiClient } from "@/lib/api/client";

export type InviteRole = "ADMIN" | "ACCOUNTANT" | "STAFF" | "VIEWER";

export interface CompanyInvite {
  id: string;
  companyId: string;
  email: string;
  role: InviteRole;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
  invitedByUser: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface InvitePreview {
  token: string;
  email: string;
  role: InviteRole;
  status: string;
  expiresAt: string;
  companyName: string;
  inviterName: string;
  isExpired: boolean;
}

export interface CreateInvitePayload {
  email: string;
  role: InviteRole;
}

export async function createCompanyInvite(companyId: string, payload: CreateInvitePayload) {
  const { data } = await apiClient.post<CompanyInvite>(`/companies/${companyId}/invites`, payload);
  return data;
}

export async function getMyInvites() {
  const { data } = await apiClient.get<CompanyInvite[]>("/invites/me");
  return data;
}

export async function getInvitePreview(token: string) {
  const { data } = await apiClient.get<InvitePreview>(`/invites/${token}`);
  return data;
}

export async function acceptInvite(token: string) {
  const { data } = await apiClient.post<{ invite: CompanyInvite; membership: unknown }>(
    `/invites/${token}/accept`,
  );
  return data;
}

export async function revokeCompanyInvite(companyId: string, inviteId: string) {
  const { data } = await apiClient.delete<CompanyInvite>(
    `/companies/${companyId}/invites/${inviteId}`,
  );
  return data;
}

export async function getCompanyInvites(companyId: string) {
  const { data } = await apiClient.get<CompanyInvite[]>(`/companies/${companyId}/invites`);
  return data;
}
