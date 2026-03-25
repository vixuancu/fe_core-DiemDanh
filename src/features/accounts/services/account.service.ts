import type { PaginatedResult } from '@/shared/types';
import type { Account, AccountFilter, CreateAccountDto, UpdateAccountDto } from '../types';

export interface AccountRoleOption {
  id: number;
  role: 'admin' | 'giao_vu' | 'giang_vien';
  label: string;
}

export interface IAccountService {
  list(filter: AccountFilter): Promise<PaginatedResult<Account>>;
  getStats(): Promise<{ total: number; giaoVu: number; giangVien: number; active: number; locked: number }>;
  getRoles(): Promise<AccountRoleOption[]>;
  create(dto: CreateAccountDto): Promise<Account>;
  update(id: string, dto: UpdateAccountDto): Promise<Account>;
  delete(id: string): Promise<void>;
  resetPassword(id: string): Promise<void>;
}
