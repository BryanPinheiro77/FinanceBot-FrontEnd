import type { AccountResponse, CurrentUser } from "@/lib/auth-api";

export function hasCompletedOnboarding(
  user: CurrentUser | null,
  _accounts: AccountResponse[],
) {
  if (!user) {
    return false;
  }

  return user.onboardingCompleted;
}