import type { IAccountService } from './account.service';
import type { Account, AccountFilter, CreateAccountDto, UpdateAccountDto } from '../types';
import type { PaginatedResult } from '@/shared/types';
import { mockTaiKhoan } from '@/app/components/data';

let STORE: Account[] = [...mockTaiKhoan] as Account[];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const accountMock: IAccountService = {
  async list({ search = '', role = '', trangThai = '', page = 1, perPage = 10 }: AccountFilter): Promise<PaginatedResult<Account>> {
    await delay();

    const filtered = STORE.filter((tk) => {
      let match = true;
      if (search) match = match && (tk.hoTen.toLowerCase().includes(search.toLowerCase()) || tk.email.toLowerCase().includes(search.toLowerCase()));
      if (role) match = match && tk.role === role;
      if (trangThai) match = match && tk.trangThai === trangThai;
      return match;
    });

    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const data = filtered.slice((page - 1) * perPage, page * perPage);

    return {
      data,
      total,
      page,
      perPage,
      totalPages: lastPage,
    };
  },

  async getStats() {
    await delay();
    return {
      total: STORE.length,
      giaoVu: STORE.filter(t => t.role === 'giao_vu').length,
      giangVien: STORE.filter(t => t.role === 'giang_vien').length,
      active: STORE.filter(t => t.trangThai === 'active').length,
      locked: STORE.filter(t => t.trangThai === 'locked').length,
    };
  },

  async getRoles() {
    await delay();
    return [
      { id: 1, role: 'admin' as const, label: 'Quản trị viên' },
      { id: 2, role: 'giao_vu' as const, label: 'Giáo vụ' },
      { id: 3, role: 'giang_vien' as const, label: 'Giảng viên' },
    ];
  },

  async create(dto: CreateAccountDto): Promise<Account> {
    await delay();
    const newAccount: Account = {
      id: Math.random().toString(36).substr(2, 9),
      username: dto.username,
      hoTen: dto.hoTen,
      email: dto.email,
      role: dto.role,
      gioiTinh: dto.gioiTinh ?? null,
      ngaySinh: dto.ngaySinh || '',
      trangThai: 'active',
    };
    STORE = [newAccount, ...STORE];
    return newAccount;
  },

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    await delay();
    const index = STORE.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Account not found');

    const updated = { ...STORE[index], ...dto };
    STORE[index] = updated;
    return updated;
  },

  async delete(id: string): Promise<void> {
    await delay();
    STORE = STORE.filter(t => t.id !== id);
  },

  async resetPassword(id: string): Promise<void> {
    await delay();
    // Simulate API call for password reset
    const account = STORE.find(t => t.id === id);
    if (!account) throw new Error('Account not found');
  }
};
