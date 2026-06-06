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
  memberships: UserCompanyMembership[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
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
}
