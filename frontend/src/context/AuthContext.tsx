"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResult, AuthUser } from "@/lib/auth";

type Credentials = { email: string; password: string };
type AuthContextValue = {
  user: AuthUser | null;
  loadingSession: boolean;
  sessionError: string | null;
  login: (credentials: Credentials) => Promise<AuthResult>;
  register: (credentials: Credentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const unavailable = "Authentication is temporarily unavailable. Try again.";

async function authRequest(options: RequestInit = {}): Promise<AuthResult> {
  const send = async () => {
    const response = await fetch("/api/auth", { ...options, cache: "no-store" });
    if (response.status === 204) return { user: null };

    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message || unavailable);
    if (!result) throw new Error(unavailable);
    return result;
  };

  // A session refresh rotates cookies. Serialize requests across tabs when supported.
  return navigator.locks?.request("stargraph-auth", send) ?? send();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authRequest()
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        if (active) setSessionError(unavailable);
      })
      .finally(() => {
        if (active) setLoadingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function authenticate(action: "login" | "register", credentials: Credentials) {
    const result = await authRequest({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...credentials }),
    });
    if (result.user) {
      setUser(result.user);
      setSessionError(null);
    }
    return result;
  }

  async function logout() {
    await authRequest({ method: "DELETE" });
    setUser(null);
    setSessionError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingSession,
        sessionError,
        login: (credentials) => authenticate("login", credentials),
        register: (credentials) => authenticate("register", credentials),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider.");
  return context;
}
