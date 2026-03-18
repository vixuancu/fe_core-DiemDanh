import { config } from '@/shared/config/env';
import type { IScheduleService, LopTinChiOption, PhongHocOption } from './schedule.service';
import type { LichHoc, CreateLichHocDto, UpdateLichHocDto, ScheduleFilter } from '../types';
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

export const scheduleApi: IScheduleService = {
  async list(filter: ScheduleFilter): Promise<PaginatedResult<LichHoc>> {
    const params = new URLSearchParams({
      ...(filter.search && { search: filter.search }),
      ...(filter.tuNgay && { tuNgay: filter.tuNgay }),
      ...(filter.denNgay && { denNgay: filter.denNgay }),
      ...(filter.giangVienId && { giangVienId: filter.giangVienId }),
      page: String(filter.page ?? 1),
      perPage: String(filter.perPage ?? 10),
    });
    const res = await fetch(`${config.apiBaseUrl}/schedules?${params}`, { headers: getHeaders() });
    return handleResponse<PaginatedResult<LichHoc>>(res);
  },

  async create(dto: CreateLichHocDto): Promise<LichHoc> {
    const res = await fetch(`${config.apiBaseUrl}/schedules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<LichHoc>(res);
  },

  async update(id: string, dto: UpdateLichHocDto): Promise<LichHoc> {
    const res = await fetch(`${config.apiBaseUrl}/schedules/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<LichHoc>(res);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${config.apiBaseUrl}/schedules/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Xóa lịch học thất bại: ${res.status}`);
  },

  async getLopTinChiOptions(): Promise<LopTinChiOption[]> {
    const res = await fetch(`${config.apiBaseUrl}/schedules/lop-tin-chi-options`, { headers: getHeaders() });
    return handleResponse<LopTinChiOption[]>(res);
  },

  async getPhongHocOptions(): Promise<PhongHocOption[]> {
    const res = await fetch(`${config.apiBaseUrl}/schedules/phong-hoc-options`, { headers: getHeaders() });
    return handleResponse<PhongHocOption[]>(res);
  },
};
