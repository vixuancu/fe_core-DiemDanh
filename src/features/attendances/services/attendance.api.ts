import { config } from '@/shared/config/env';
import type { IAttendanceService, AttendanceStats } from './attendance.service';
import type { DiemDanh, UpdateTrangThaiDto, AttendanceFilter, AttendanceMatrixResponse, AttendanceUpdateCellRequest } from '../types';
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

export const attendanceApi: IAttendanceService = {
  async list(filter: AttendanceFilter): Promise<PaginatedResult<DiemDanh>> {
    const params = new URLSearchParams({
      ...(filter.lichHocId && { lichHocId: filter.lichHocId }),
      ...(filter.maLop && { maLop: filter.maLop }),
      ...(filter.giangVienId && { giangVienId: filter.giangVienId }),
      ...(filter.search && { search: filter.search }),
      ...(filter.trangThai && { trangThai: filter.trangThai }),
      ...(filter.tuNgay && { tuNgay: filter.tuNgay }),
      ...(filter.denNgay && { denNgay: filter.denNgay }),
      page: String(filter.page ?? 1),
      perPage: String(filter.perPage ?? 10),
    });
    const res = await fetch(`${config.apiBaseUrl}/attendances?${params}`, { headers: getHeaders() });
    return handleResponse<PaginatedResult<DiemDanh>>(res);
  },

  async getStats(lichHocId: string): Promise<AttendanceStats> {
    const res = await fetch(`${config.apiBaseUrl}/attendances/stats/${lichHocId}`, { headers: getHeaders() });
    return handleResponse<AttendanceStats>(res);
  },

  async updateStatus(id: string, dto: UpdateTrangThaiDto): Promise<DiemDanh> {
    const res = await fetch(`${config.apiBaseUrl}/attendances/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    return handleResponse<DiemDanh>(res);
  },

  async syncStudentsForSchedule(lichHocId: string): Promise<void> {
    const res = await fetch(`${config.apiBaseUrl}/attendances/sync/${lichHocId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Thao tác thất bại: ${res.status}`);
  },

  async getMatrix(courseSectionId: string | number, fromDate?: string, toDate?: string): Promise<AttendanceMatrixResponse> {
    const params = new URLSearchParams({ course_section_id: String(courseSectionId) });
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const res = await fetch(`${config.apiBaseUrl}/attendance-management/matrix?${params}`, { headers: getHeaders() });
    const response = await handleResponse<any>(res);
    return response.data; // FastAPI `DataResponse<T>` -> `data`
  },

  async updateCell(request: AttendanceUpdateCellRequest): Promise<any> {
    const res = await fetch(`${config.apiBaseUrl}/attendance-management/cell`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });
    const response = await handleResponse<any>(res);
    return response.data;
  },
};
