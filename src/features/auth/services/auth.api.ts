import { config } from '@/shared/config/env';
import type { IAuthService, LoginCredentials, User } from '../types';

/**
 * API Auth Adapter — Kết nối backend thật
 * Implement đầy đủ khi backend sẵn sàng
 */
export const authApi: IAuthService = {
  async login({ email, password }: LoginCredentials): Promise<User> {
    const res = await fetch(`${config.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Thông tin đăng nhập không chính xác');
    const data = await res.json();
    // Lưu token vào localStorage
    if (data.accessToken) localStorage.setItem('access_token', data.accessToken);
    return data.user as User;
  },

  async logout() {
    localStorage.removeItem('access_token');
    // Có thể gọi API logout nếu backend yêu cầu
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const res = await fetch(`${config.apiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as User;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${config.apiBaseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!res.ok) throw new Error('Đổi mật khẩu thất bại');
  },
};
