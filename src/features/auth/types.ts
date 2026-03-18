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
  email: string;
  password: string;
}

// ─── Service interface ───────────────────────────────────────────────────────

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<User>;
  logout(): Promise<void>;
  /** Lấy user đang đăng nhập (từ token/session) */
  getCurrentUser(): Promise<User | null>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
}
