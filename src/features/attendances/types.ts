import type { PaginatedResult, TrangThaiDiemDanh } from '@/shared/types';

// ─── Domain model ─────────────────────────────────────────────────────────────

export interface DiemDanh {
  id: string;
  sinhVienId: string;
  maSV: string;
  hoTenSV: string;
  lichHocId: string;
  tenMonHoc: string;
  maLop: string;
  ngay: string; // YYYY-MM-DD
  thoiGian: string; // HH:mm:ss
  trangThai: TrangThaiDiemDanh; // 'co_mat' | 'tre' | 'vang'
  ghiChu?: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface UpdateTrangThaiDto {
  trangThai: TrangThaiDiemDanh;
  ghiChu?: string;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface AttendanceFilter {
  lichHocId?: string; // Khi điểm danh 1 buổi
  maLop?: string;     // Khi xem kết quả của cả môn
  giangVienId?: string; // Khi xem lịch sử điểm danh của giảng viên
  search?: string;
  trangThai?: TrangThaiDiemDanh | '';
  tuNgay?: string; // YYYY-MM-DD
  denNgay?: string; // YYYY-MM-DD
  page?: number;
  perPage?: number;
}
