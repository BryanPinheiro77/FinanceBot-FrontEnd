import { apiRequest } from "@/lib/api";

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  monthlyBaseIncome: number | null;
  telegramId: number | null;
  telegramLinked: boolean;
  telegramLinkCode: string | null;
  telegramLinkCodeExpiresAt: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface TelegramLinkCodeResponse {
  telegramLinkCode: string;
  expiresAt: string;
  message: string;
}

export interface AccountResponse {
  id: number;
  name: string;
  type: "CHECKING_ACCOUNT" | "SAVINGS_ACCOUNT" | "CASH" | "INVESTMENT" | "DIGITAL_WALLET";
  initialBalance: number;
  currentBalance: number;
  createdAt: string;
}

export async function loginRequest(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerRequest(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return apiRequest<CurrentUser>("/users/me");
}

export async function updateMonthlyBaseIncome(monthlyBaseIncome: number) {
  return apiRequest<void>("/users/me/monthly-base-income", {
    method: "PATCH",
    body: JSON.stringify({ monthlyBaseIncome }),
  });
}

export async function getAccounts() {
  return apiRequest<AccountResponse[]>("/accounts");
}

export async function createAccount(name: string) {
  return apiRequest<AccountResponse>("/accounts", {
    method: "POST",
    body: JSON.stringify({
      name,
      type: "CHECKING_ACCOUNT",
      initialBalance: 0,
    }),
  });
}

export async function createTelegramLinkCode() {
  return apiRequest<TelegramLinkCodeResponse>("/users/me/telegram-link-code", {
    method: "POST",
  });
}
