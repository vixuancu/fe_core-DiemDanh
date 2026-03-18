import { config } from '@/shared/config/env';
import type { IRoomService, CameraOption } from './room.service';
import type { PhongHoc, CreatePhongHocDto, UpdatePhongHocDto, RoomFilter } from '../types';
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

export const roomApi: IRoomService = {
  async list(filter: RoomFilter): Promise<PaginatedResult<PhongHoc>> {
    const params = new URLSearchParams({
      ...(filter.search && { search: filter.search }),
      ...(filter.toaNha && { toaNha: filter.toaNha }),
      page: String(filter.page ?? 1),
      perPage: String(filter.perPage ?? 10),
    });
    const res = await fetch(`${config.apiBaseUrl}/rooms?${params}`, { headers: getHeaders() });
    return handleResponse<PaginatedResult<PhongHoc>>(res);
  },

  async create(dto: CreatePhongHocDto): Promise<PhongHoc> {
    const res = await fetch(`${config.apiBaseUrl}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<PhongHoc>(res);
  },

  async update(id: string, dto: UpdatePhongHocDto): Promise<PhongHoc> {
    const res = await fetch(`${config.apiBaseUrl}/rooms/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<PhongHoc>(res);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${config.apiBaseUrl}/rooms/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Xóa phòng học thất bại: ${res.status}`);
  },

  async getToaNhaOptions(): Promise<string[]> {
    const res = await fetch(`${config.apiBaseUrl}/rooms/toa-nha-options`, { headers: getHeaders() });
    return handleResponse<string[]>(res);
  },

  async getAvailableCameras(): Promise<CameraOption[]> {
    const res = await fetch(`${config.apiBaseUrl}/rooms/available-cameras`, { headers: getHeaders() });
    return handleResponse<CameraOption[]>(res);
  },
};
