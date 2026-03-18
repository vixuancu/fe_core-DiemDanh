import type { PaginatedResult } from '@/shared/types';
import type { Account, AccountFilter, CreateAccountDto, UpdateAccountDto } from '../types';

export interface IAccountService {
  list(filter: AccountFilter): Promise<PaginatedResult<Account>>;
  getStats(): Promise<{ total: number; giaoVu: number; giangVien: number; active: number; locked: number }>;
  create(dto: CreateAccountDto): Promise<Account>;
  update(id: string, dto: UpdateAccountDto): Promise<Account>;
  delete(id: string): Promise<void>;
  resetPassword(id: string): Promise<void>;
}
