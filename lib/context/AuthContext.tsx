"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { JOBKAR_AUTH_EXPIRED_EVENT } from "./client";
import type { User, UserRole } from "./types";
import { signInWithNvoid } from "./auth-client";

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  oauthError: string;
  authError: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  loginWithGoogle: (role?: UserRole | null) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearErrors: () => void;
};

type SessionResponse = {
  authenticated?: boolean;
  roleId?: number;
  user?: {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    slug?: string;
    companyId?: string;
    imageUrl?: string | null;
  };
};

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(session: SessionResponse): User | null {
  const data = session.user;
  if (!session.authenticated || !data) return null;
  return {
    id: String(data.id || ""),
    name: data.fullName || data.name || "Member",
    email: data.email || "",
    role: Number(session.roleId) === 3 ? "recruiter" : "seeker",
    phone: data.phone,
    slug: data.slug,
    companyId: data.companyId,
    imageUrl: data.imageUrl || null,
    profileStrength: 20,
    skills: [],
    education: [],
    experience: [],
    languages: []
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [oauthError, setOauthError] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const syncSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) {
        setUser(null);
        return null;
      }
      const data = await response.json() as SessionResponse;
      const nextUser = mapUser(data);
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void syncSession();
  }, [syncSession]);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setAuthError("Your session expired. Please sign in again.");
      router.replace("/auth/signin");
    };
    window.addEventListener(JOBKAR_AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(JOBKAR_AUTH_EXPIRED_EVENT, handleExpired);
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const session = await signInWithNvoid(email, password);
      const nextUser = mapUser(session);
      if (!nextUser) throw new Error("The authentication service returned an unsupported account.");
      setUser(nextUser);
      router.replace("/");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed.";
      setAuthError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loginWithGoogle = useCallback(async () => {
    const message = "Google OAuth is not configured for this web session.";
    setOauthError(message);
    throw new Error(message);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`/authController/sendCodeForgotPassword?email=${encodeURIComponent(email.trim())}`, {
        method: "POST",
        credentials: "same-origin"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || data.message || "Password recovery could not be requested.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password recovery failed.";
      setAuthError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    setUser(null);
    router.replace("/");
    router.refresh();
  }, [router]);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(current => current ? { ...current, ...data } : current);
  }, []);

  const clearErrors = useCallback(() => {
    setAuthError(null);
    setOauthError("");
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token: null,
      isLoading,
      isAuthenticated: Boolean(user),
      oauthError,
      authError,
      login,
      loginWithGoogle,
      forgotPassword,
      logout,
      updateUser,
      clearErrors
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
