/**
 * Shared domain types & label maps
 * Tất cả feature imports từ đây thay vì từ data.ts
 */

// ─── Auth ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'giao_vu' | 'giang_vien';

export const roleLabels: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  giao_vu: 'Giáo vụ',
  giang_vien: 'Giảng viên',
};

// ─── Điểm danh trạng thái ────────────────────────────────────────────────────

export type TrangThaiDiemDanh = 'co_mat' | 'tre' | 'vang';

export const trangThaiLabels: Record<TrangThaiDiemDanh, string> = {
  co_mat: 'Có mặt',
  tre: 'Đi trễ',
  vang: 'Vắng',
};

export const trangThaiColors: Record<TrangThaiDiemDanh, string> = {
  co_mat: 'bg-green-100 text-green-700',
  tre: 'bg-yellow-100 text-yellow-700',
  vang: 'bg-red-100 text-red-700',
};

// ─── Lịch học ──────────────────────────────────────────────────────────────

export const thuLabels: Record<number, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật',
};

export type CaHoc = 'Sáng' | 'Chiều' | 'Tối';

export const caHocLabels: Record<CaHoc, string> = {
  'Sáng': 'Sáng',
  'Chiều': 'Chiều',
  'Tối': 'Tối',
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
