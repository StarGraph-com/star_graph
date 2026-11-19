"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResult, AuthUser } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      setUser({ id: "demo-user-123", email: "developer@stargraph.io" });
      setLoadingSession(false);
      return;
    }

    const sb = getSupabase();

    sb.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!active) return;
        if (error) {
          setSessionError(error.message);
          setUser(null);
        } else if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? null });
        } else {
          setUser(null);
        }
      })
      .catch((err) => {
        if (active) setSessionError(err instanceof Error ? err.message : "Failed to load session");
      })
      .finally(() => {
        if (active) setLoadingSession(false);
      });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? null });
      } else {
        setUser(null);
      }
      setLoadingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login({ email, password }: Credentials): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      const demoUser = { id: "demo-user-123", email };
      setUser(demoUser);
      return { user: demoUser };
    }

    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    if (data.user) {
      const authUser = { id: data.user.id, email: data.user.email ?? null };
      setUser(authUser);
      return { user: authUser };
    }
    return { user: null };
  }

  async function register({ email, password }: Credentials): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      const demoUser = { id: "demo-user-123", email };
      setUser(demoUser);
      return { user: demoUser };
    }

    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: email.split("@")[0],
        },
      },
    });

    if (error) throw new Error(error.message);

    if (data.user) {
      try {
        await sb
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              email: data.user.email,
              display_name: email.split("@")[0],
              avatar_color: "#6366F1",
            },
            { onConflict: "id" }
          );
      } catch {
        // Trigger on auth.users will handle if permissions allow
      }

      if (data.session) {
        const authUser = { id: data.user.id, email: data.user.email ?? null };
        setUser(authUser);
        return { user: authUser };
      } else {
        return {
          user: null,
          message: "Check your email for the confirmation link, then sign in.",
        };
      }
    }

    return { user: null };
  }

  async function logout() {
    if (isSupabaseConfigured) {
      const sb = getSupabase();
      await sb.auth.signOut();
    }
    setUser(null);
    setSessionError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingSession,
        sessionError,
        login,
        register,
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
