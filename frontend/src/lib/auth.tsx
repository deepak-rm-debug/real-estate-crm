"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api, tokenStore } from "./api";
import type { TokenResponse, User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(tokenStore.getUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    tokenStore.save(data);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await api("/api/auth/logout", { method: "POST", body: { refresh_token: refresh }, auth: false });
      } catch {
        /* even if the server call fails, clear the local session */
      }
    }
    tokenStore.clear();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}