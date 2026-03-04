"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { apiClient, setAccessToken } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get<User & { access_token?: string }>(
        "/api/me",
      );
      setUser(res.data);
      if (res.data.access_token) {
        setAccessToken(res.data.access_token);
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null); // Clear token on refresh failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{ user: User; access_token: string }>(
      "/auth/login",
      { email, password },
    );
    setAccessToken(res.data.access_token);
    setUser(res.data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    await apiClient.post("/auth/register", { name, email, password });
    // Auto login after register? Or just redirect to login
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
