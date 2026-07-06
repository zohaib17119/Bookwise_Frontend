import { apiClient } from "@/lib/api/client";
import type {
  AuthResponse,
  LoginPayload,
  RefreshResponse,
  RegisterPayload,
  ResendVerificationPayload,
  UserCompanyMembership,
  User,
  VerifyEmailPayload,
} from "@/features/auth/types/auth.types";

interface ApiUser {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  isEmailVerified?: boolean;
  memberships?: UserCompanyMembership[];
}

interface ApiAuthData {
  user: ApiUser;
  accessToken: string;
}

interface ApiCurrentUserResponse {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  isEmailVerified?: boolean;
  memberships?: UserCompanyMembership[];
}

function normalizeUser(user: ApiUser | ApiCurrentUserResponse): User {
  const fullName = user.fullName ?? user.name ?? user.email;

  return {
    id: user.id,
    name: user.name ?? fullName,
    fullName,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    memberships: user.memberships ?? [],
  };
}

function normalizeAuthResponse(data: ApiAuthData): AuthResponse {
  return {
    token: data.accessToken,
    user: normalizeUser(data.user),
  };
}

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<ApiAuthData>("/auth/login", payload);
  return normalizeAuthResponse(data);
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post<ApiAuthData>("/auth/register", payload);
  return normalizeAuthResponse(data);
}

export async function refreshSession() {
  const { data } = await apiClient.post<RefreshResponse>("/auth/refresh");
  return data;
}

export async function logout() {
  await apiClient.post<{ loggedOut: boolean }>("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<ApiCurrentUserResponse>("/auth/me");
  return normalizeUser(data);
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await apiClient.post<ApiAuthData>("/auth/verify-email", payload);
  return normalizeAuthResponse(data);
}

export async function resendVerification(payload: ResendVerificationPayload) {
  const { data } = await apiClient.post<{ sent: boolean }>("/auth/resend-verification", payload);
  return data;
}
