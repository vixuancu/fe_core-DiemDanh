import { config } from '@/shared/config/env';
import type { IAccountService } from './account.service';
import type { Account, AccountFilter, CreateAccountDto, UpdateAccountDto } from '../types';
import type { PaginatedResult } from '@/shared/types';

const API_URL = `${config.apiBaseUrl}/accounts`;

export const accountApi: IAccountService = {
  async list(filter: AccountFilter): Promise<PaginatedResult<Account>> {
    const params = new URLSearchParams({
      ...(filter.search && { search: filter.search }),
      ...(filter.role && { role: filter.role }),
      ...(filter.trangThai && { trangThai: filter.trangThai }),
      page: String(filter.page ?? 1),
      perPage: String(filter.perPage ?? 10),
    });

    const res = await fetch(`${API_URL}?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_URL}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async create(dto: CreateAccountDto): Promise<Account> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create account');
    return res.json();
  },

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update account');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete account');
  },

  async resetPassword(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/${id}/reset-password`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset password');
  }
};
