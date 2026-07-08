export interface UserCompanyMembership {
  companyId: string;
  companyName: string;
  role: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  fullName: string;
  email: string;
  isEmailVerified?: boolean;
  memberships: UserCompanyMembership[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  inviteToken?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface RefreshResponse {
  accessToken: string;
}
