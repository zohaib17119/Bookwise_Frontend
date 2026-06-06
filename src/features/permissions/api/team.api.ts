import { apiClient } from "@/lib/api/client";

export type CompanyMemberRole = "OWNER" | "ADMIN" | "ACCOUNTANT" | "STAFF" | "VIEWER";
export type CompanyMemberStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "REMOVED";

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyMemberRole;
  status: CompanyMemberStatus;
  invitedByUserId?: string | null;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
  };
}

export interface AddMemberPayload {
  email?: string;
  userId?: string;
  role: CompanyMemberRole;
  status?: CompanyMemberStatus;
}

export interface UpdateMemberPayload {
  role?: CompanyMemberRole;
  status?: CompanyMemberStatus;
}

export async function getCompanyMembers(companyId: string) {
  const { data } = await apiClient.get<CompanyMember[]>(`/companies/${companyId}/members`);
  return data;
}

export async function addCompanyMember(companyId: string, payload: AddMemberPayload) {
  const { data } = await apiClient.post<CompanyMember>(`/companies/${companyId}/members`, payload);
  return data;
}

export async function updateCompanyMember(
  companyId: string,
  memberId: string,
  payload: UpdateMemberPayload
) {
  const { data } = await apiClient.patch<CompanyMember>(
    `/companies/${companyId}/members/${memberId}`,
    payload
  );
  return data;
}
