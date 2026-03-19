import type { PaginatedResult } from '@/shared/types';
import type { UserRole } from '@/shared/types';

export interface Account {
  id: string;
  hoTen: string;
  email: string;
  soDienThoai: string;
  role: UserRole;
  ngayTao: string;
  trangThai: 'active' | 'locked';
}

export interface CreateAccountDto {
  hoTen: string;
  email: string;
  role: UserRole;
  soDienThoai?: string;
}

export interface UpdateAccountDto {
  hoTen?: string;
  soDienThoai?: string;
  trangThai?: 'active' | 'locked';
}

export interface AccountFilter {
  search?: string;
  role?: UserRole | '';
  trangThai?: 'active' | 'locked' | '';
  page?: number;
  perPage?: number;
}
