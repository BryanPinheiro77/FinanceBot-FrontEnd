import type { AccountResponse, CurrentUser } from "@/lib/auth-api";

export function hasCompletedOnboarding(user: CurrentUser | null, accounts: AccountResponse[]) {
  if (!user) {
    return false;
  }

  return !!user.monthlyBaseIncome && user.monthlyBaseIncome > 0 && accounts.length > 0;
}
