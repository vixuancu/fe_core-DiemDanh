import type { PaginatedResult } from '@/shared/types';

// ─── Domain model ─────────────────────────────────────────────────────────────

export interface LichHoc {
  id: string;
  lopTinChiId: string;
  tenMonHoc: string;
  maLop: string;
  tenGiangVien: string;
  phongHocId: string;
  tenPhong: string;
  ngayHoc: string;
  caHoc: 'Sáng' | 'Chiều' | 'Tối';
  tietBatDau: number;
  tietKetThuc: number;
  thu: number; // 2-8 (Mon-Sun)
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLichHocDto {
  lopTinChiId: string;
  phongHocId: string;
  ngayHoc: string; // YYYY-MM-DD
  caHoc: 'Sáng' | 'Chiều' | 'Tối';
  tietBatDau: number;
  tietKetThuc: number;
}

export type UpdateLichHocDto = Partial<CreateLichHocDto>;

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface ScheduleFilter {
  search?: string;     // Theo tên môn hoặc mã lớp
  tuNgay?: string;     // YYYY-MM-DD
  denNgay?: string;    // YYYY-MM-DD
  giangVienId?: string; // Dùng cho role giảng viên để lọc lịch của mình
  page?: number;
  perPage?: number;
}
