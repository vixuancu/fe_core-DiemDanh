import { config } from '@/shared/config/env';
import type { IStudentService } from './student.service';
import type { SinhVien, CreateSinhVienDto, UpdateSinhVienDto, StudentFilter, PaginatedResult } from '../types';

/** Helper lấy token */
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

/**
 * Student API Adapter — Kết nối backend thật.
 *
 * Chỉ cần backend expose REST API đúng contract:
 *   GET    /students?search=&lop=&page=&perPage=
 *   GET    /students/:id
 *   POST   /students
 *   PATCH  /students/:id
 *   DELETE /students/:id
 *   GET    /students/lop-options
 *   POST   /students/import
 */
export const studentApi: IStudentService = {
  async list(filter: StudentFilter): Promise<PaginatedResult<SinhVien>> {
    const params = new URLSearchParams({
      ...(filter.search && { search: filter.search }),
      ...(filter.lop && { lop: filter.lop }),
      page: String(filter.page ?? 1),
      perPage: String(filter.perPage ?? 10),
    });
    const res = await fetch(`${config.apiBaseUrl}/students?${params}`, { headers: getHeaders() });
    return handleResponse<PaginatedResult<SinhVien>>(res);
  },

  async getById(id: string): Promise<SinhVien> {
    const res = await fetch(`${config.apiBaseUrl}/students/${id}`, { headers: getHeaders() });
    return handleResponse<SinhVien>(res);
  },

  async create(dto: CreateSinhVienDto): Promise<SinhVien> {
    const res = await fetch(`${config.apiBaseUrl}/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<SinhVien>(res);
  },

  async update(id: string, dto: UpdateSinhVienDto): Promise<SinhVien> {
    const res = await fetch(`${config.apiBaseUrl}/students/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<SinhVien>(res);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${config.apiBaseUrl}/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Xóa sinh viên thất bại: ${res.status}`);
  },

  async getLopOptions(): Promise<string[]> {
    const res = await fetch(`${config.apiBaseUrl}/students/lop-options`, { headers: getHeaders() });
    return handleResponse<string[]>(res);
  },

  async importFromExcel(rows: CreateSinhVienDto[]) {
    const res = await fetch(`${config.apiBaseUrl}/students/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rows }),
    });
    return handleResponse<{ imported: number; errors: string[] }>(res);
  },
};
