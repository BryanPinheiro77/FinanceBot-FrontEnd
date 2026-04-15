import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  getCurrentUser,
  loginRequest,
  registerRequest,
  type CurrentUser,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/token-storage";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<CurrentUser>;
  register: (payload: RegisterPayload) => Promise<CurrentUser>;
  logout: () => void;
  refreshUser: () => Promise<CurrentUser | null>;
  setUser: Dispatch<SetStateAction<CurrentUser | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = getStoredToken();

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredToken();
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
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    setStoredToken(response.token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    setStoredToken(response.token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const logout = () => {
    clearStoredToken();
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
