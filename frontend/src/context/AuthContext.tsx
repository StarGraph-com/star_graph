"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, mockUser } from "@/data/mockUser";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("stargraph_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("stargraph_user");
      }
    }
  }, []);

  const login = (email?: string) => {
    const activeUser: User = {
      ...mockUser,
      email: email || mockUser.email,
    };
    setUser(activeUser);
    localStorage.setItem("stargraph_user", JSON.stringify(activeUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("stargraph_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

