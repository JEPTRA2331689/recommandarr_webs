import { useAppStore } from "./store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";

// Read/write via Zustand getState() — works in any context, no manual localStorage
export function getToken(): string | null {
  return useAppStore.getState().token;
}

export function setToken(token: string) {
  useAppStore.getState().setToken(token);
}

export function clearToken() {
  useAppStore.getState().clearToken();
}

export function getAccessKey(): string | null {
  return useAppStore.getState().accessKey;
}

export function setAccessKey(key: string) {
  useAppStore.getState().setAccessKey(key);
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, message || res.statusText);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const api = {
  get: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T,>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T,>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
