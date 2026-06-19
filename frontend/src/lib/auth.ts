/**
 * Auth token storage (MVP: localStorage).
 * Centralized here so we can later swap to httpOnly cookies without touching callers.
 */
const ACCESS_KEY = "cafe.accessToken";
const REFRESH_KEY = "cafe.refreshToken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function setTokens(tokens: TokenPair): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
