import { config } from '@/shared/config/env';
import type { UserRole } from '@/shared/types';
import type { IAuthService, LoginCredentials, User } from '../types';
import { clearAccessToken, getAccessToken, setAccessToken } from '../session';

/**
 * API Auth Adapter — Kết nối backend thật
 * Implement đầy đủ khi backend sẵn sàng
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BackendUser {
  id: number;
  username: string;
  full_name?: string | null;
  email: string;
  role_id: number;
  role_name?: string | null;
}

interface LoginData {
  token: {
    access_token: string;
    token_type: string;
  };
  user: BackendUser;
}

function normalizeRole(roleName?: string | null): UserRole {
  const role = (roleName || '').trim().toLowerCase();
  if (role === 'admin' || role === 'giao_vu' || role === 'giang_vien') {
    return role;
  }
  return 'giao_vu';
}

function mapUser(user: BackendUser): User {
  return {
    id: String(user.id),
    hoTen: user.full_name?.trim() || user.username,
    email: user.email,
    role: normalizeRole(user.role_name),
  };
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const payload = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !payload.success) {
    throw new Error(payload.message || 'Có lỗi xảy ra từ máy chủ');
  }

  return payload;
}

export const authApi: IAuthService = {
  async login({ username, password }: LoginCredentials): Promise<User> {
    const res = await fetch(`${config.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const payload = await parseEnvelope<LoginData>(res);
    setAccessToken(payload.data.token.access_token);
    return mapUser(payload.data.user);
  },

  async logout() {
    clearAccessToken();
    // Có thể gọi API logout nếu backend yêu cầu
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getAccessToken();
    if (!token) return null;

    const res = await fetch(`${config.apiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAccessToken();
      }
      return null;
    }

    const payload = await parseEnvelope<BackendUser>(res);
    return mapUser(payload.data);
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const token = getAccessToken();
    const res = await fetch(`${config.apiBaseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });

    await parseEnvelope<null>(res);
  },
};
