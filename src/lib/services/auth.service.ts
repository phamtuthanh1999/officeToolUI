import { apiFetch, tokenStore, BASE_URL, type User, type AuthTokens } from "@/lib/api"; // User used by getMe/updateMe

export async function login(
  email: string,
  password: string
): Promise<{ tokens: AuthTokens }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ tokens: AuthTokens }> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginWithGoogle() {
  window.location.href = `${BASE_URL.replace("/api/v1", "")}/api/v1/auth/google`;
}

export async function logoutApi(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  tokenStore.clear();
}

export async function getMe(): Promise<{ user: User }> {
  return apiFetch("/auth/me");
}

export async function updateMe(data: {
  name?: string;
  email?: string;
}): Promise<{ user: User }> {
  return apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  return apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
