export const ACCESS_TOKEN_KEY = 'access_token';
export const AUTH_LOGOUT_EVENT = 'auth:logout';

let logoutEventLock = false;

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
  if (logoutEventLock) return;
  logoutEventLock = true;
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
  window.setTimeout(() => {
    logoutEventLock = false;
  }, 300);
}

export function forceLogout(): void {
  clearAccessToken();
  emitAuthLogout();
}
