import { apiClient } from "@/lib/api/client";
import type {
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  ResendVerificationPayload,
  UserCompanyMembership,
  User,
  VerifyEmailPayload,
} from "@/features/auth/types/auth.types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

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
  tokens: AuthTokens;
}

type ApiAuthResponse = ApiEnvelope<ApiAuthData>;
type ApiCurrentUserResponse = ApiEnvelope<ApiUser | { user: ApiUser }> | ApiUser;

function normalizeUser(user: ApiUser): User {
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

function normalizeAuthResponse(response: ApiAuthResponse): AuthResponse {
  return {
    token: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
    user: normalizeUser(response.user),
  };
}

function normalizeCurrentUser(response: ApiCurrentUserResponse): User {
  if ("data" in response) {
    const payload = response.data;
    return normalizeUser("user" in payload ? payload.user : payload);
  }

  return normalizeUser(response);
}

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<ApiAuthResponse>("/auth/login", payload);
  return normalizeAuthResponse(data);
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post<ApiAuthResponse>("/auth/register", payload);
  return normalizeAuthResponse(data);
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<ApiCurrentUserResponse>("/auth/me");
  return normalizeCurrentUser(data);
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await apiClient.post<ApiAuthResponse>("/auth/verify-email", payload);
  return normalizeAuthResponse(data);
}

export async function resendVerification(payload: ResendVerificationPayload) {
  const { data } = await apiClient.post<{ sent: boolean }>("/auth/resend-verification", payload);
  return data;
}
