import { config } from '@/shared/config/env';
import type { ICreditClassService, GiangVienOption } from './credit-class.service';
import type { LopTinChi, CreateLopTinChiDto, UpdateLopTinChiDto, CreditClassFilter } from '../types';
import type { PaginatedResult } from '@/shared/types';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
});

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const creditClassApi: ICreditClassService = {
  async list(filter: CreditClassFilter): Promise<PaginatedResult<LopTinChi>> {
    const params = new URLSearchParams({
      ...(filter.search && { search: filter.search }),
      page: String(filter.page ?? 1),
      perPage: String(filter.perPage ?? 10),
    });
    const res = await fetch(`${config.apiBaseUrl}/credit-classes?${params}`, { headers: getHeaders() });
    return handleResponse<PaginatedResult<LopTinChi>>(res);
  },

  async create(dto: CreateLopTinChiDto): Promise<LopTinChi> {
    const res = await fetch(`${config.apiBaseUrl}/credit-classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<LopTinChi>(res);
  },

  async update(id: string, dto: UpdateLopTinChiDto): Promise<LopTinChi> {
    const res = await fetch(`${config.apiBaseUrl}/credit-classes/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<LopTinChi>(res);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${config.apiBaseUrl}/credit-classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Xóa lớp tín chỉ thất bại: ${res.status}`);
  },

  async getGiangVienOptions(): Promise<GiangVienOption[]> {
    const res = await fetch(`${config.apiBaseUrl}/credit-classes/giang-vien-options`, { headers: getHeaders() });
    return handleResponse<GiangVienOption[]>(res);
  },
};
