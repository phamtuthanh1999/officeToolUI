export const BASE_URL =
  import.meta.env.VITE_API_URL || "https://officetool.api.ptt.io.vn/api/v1";

// ─── Token store ─────────────────────────────────────────────────────────────
export const tokenStore = {
  getAccess: () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  setAccess: (t: string) => localStorage.setItem("access_token", t),
  setRefresh: (t: string) => localStorage.setItem("refresh_token", t),
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStore.getAccess();
  const headers = new Headers(options.headers as HeadersInit | undefined);

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }

  const contentType = res.headers.get("Content-Type") || "";
  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/zip") ||
    contentType.includes("image/")
  ) {
    return res.blob() as Promise<T>;
  }

  const json = await res.json();
  // Unwrap backend envelope: { status: "success", data: { ... } }
  if (json && typeof json === "object" && json.status === "success" && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

// ─── Download helper ──────────────────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
