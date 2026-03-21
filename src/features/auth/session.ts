export const ACCESS_TOKEN_KEY = 'access_token';
export const AUTH_LOGOUT_EVENT = 'auth:logout';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function emitAuthLogout(): void {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

export function forceLogout(): void {
  clearAccessToken();
  emitAuthLogout();
}
