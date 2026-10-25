import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  getCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "@/lib/auth-api";
import type { CurrentUser, LoginPayload, RegisterPayload } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { clearLegacyAuthToken } from "@/lib/legacy-auth-storage";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<CurrentUser>;
  register: (payload: RegisterPayload) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
  setUser: Dispatch<SetStateAction<CurrentUser | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    clearLegacyAuthToken();

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        return null;
      }

      throw error;
    }
  };

  useEffect(() => {
    let active = true;

    const bootstrapAuth = async () => {
      try {
        const currentUser = await refreshUser();

        if (!active) {
          return;
        }

        setUser(currentUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    const expireSession = () => setUser(null);
    window.addEventListener("financebot:session-expired", expireSession);
    void bootstrapAuth();

    return () => {
      active = false;
      window.removeEventListener("financebot:session-expired", expireSession);
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    await loginRequest(payload);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const register = async (payload: RegisterPayload) => {
    await registerRequest(payload);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    setUser,
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
