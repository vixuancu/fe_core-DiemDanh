import type { PaginatedResult } from '@/shared/types';
import type { UserRole } from '@/shared/types';

export interface Account {
  id: string;
  username: string;
  hoTen: string;
  email: string;
  gioiTinh: boolean | null;
  ngaySinh: string;
  role: UserRole;
  trangThai: 'active' | 'locked';
}

export interface CreateAccountDto {
  username: string;
  hoTen: string;
  email: string;
  password: string;
  role: UserRole;
  gioiTinh?: boolean | null;
  ngaySinh?: string;
}

export interface UpdateAccountDto {
  hoTen?: string;
  gioiTinh?: boolean | null;
  ngaySinh?: string;
  role?: UserRole;
  trangThai?: 'active' | 'locked';
}

export interface AccountFilter {
  search?: string;
  role?: UserRole | '';
  trangThai?: 'active' | 'locked' | '';
  page?: number;
  perPage?: number;
}
