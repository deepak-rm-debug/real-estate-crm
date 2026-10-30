import type { TokenResponse, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ACCESS_KEY = "crm_access";
const REFRESH_KEY = "crm_refresh";
const USER_KEY = "crm_user";

const isBrowser = () => typeof window !== "undefined";

export const tokenStore = {
  getAccess: () => (isBrowser() ? localStorage.getItem(ACCESS_KEY) : null),
  getRefresh: () => (isBrowser() ? localStorage.getItem(REFRESH_KEY) : null),
  getUser: (): User | null => {
    if (!isBrowser()) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  save: (data: TokenResponse) => {
    localStorage.setItem(ACCESS_KEY, data.access_token);
    localStorage.setItem(REFRESH_KEY, data.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    return (first.msg ?? fallback).replace(/^Value error, /, "");
  }
  return fallback;
}

// Only ONE refresh call at a time. Rotation + reuse detection would
// revoke the session if two parallel requests used the same refresh token.
let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        tokenStore.save((await res.json()) as TokenResponse);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

function sessionExpired(): never {
  tokenStore.clear();
  if (isBrowser()) window.location.href = "/login?expired=1";
  throw new ApiError(401, "Session expired. Please login again.");
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean; // false for login/logout calls
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const send = () => {
    const token = tokenStore.getAccess();
    return fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, "Cannot reach the server. Please check your connection and try again.");
  }

  if (res.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (!refreshed) sessionExpired();
    res = await send(); // retry once with the new access token
    if (res.status === 401) sessionExpired();
  }

  if (!res.ok) {
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, extractMessage(parsed, `Request failed (${res.status})`));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}