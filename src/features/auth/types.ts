import type { UserRole } from '@/shared/types';

// ─── Domain models ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  hoTen: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ForgotPasswordConfirmPayload {
  email: string;
  otp: string;
  newPassword: string;
}

// ─── Service interface ───────────────────────────────────────────────────────

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<User>;
  logout(): Promise<void>;
  /** Lấy user đang đăng nhập (từ token/session) */
  getCurrentUser(): Promise<User | null>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(payload: ForgotPasswordConfirmPayload): Promise<void>;
}
