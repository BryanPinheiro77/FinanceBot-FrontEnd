import { clearStoredToken, getStoredToken } from "@/lib/token-storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export interface ApiErrorPayload {
  title?: string;
  detail?: string;
  message?: string;
  error?: string;
  status?: number;
}

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(message: string, status: number, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function resolveErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
  return payload?.detail || payload?.message || payload?.error || fallback;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;

    try {
      payload = await parseResponse<ApiErrorPayload>(response);
    } catch {
      payload = null;
    }

    if (response.status === 401) {
      clearStoredToken();
    }

    throw new ApiError(
      resolveErrorMessage(payload, "Não foi possível concluir a solicitação."),
      response.status,
      payload,
    );
  }

  return parseResponse<T>(response);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
