import { redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/lib/token-storage";

export function requireAnonymous() {
  if (getStoredToken()) {
    throw redirect({ to: "/onboarding" });
  }
}

export function requireAuth() {
  if (!getStoredToken()) {
    throw redirect({ to: "/login" });
  }
}
