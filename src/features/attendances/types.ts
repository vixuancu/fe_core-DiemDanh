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

export interface AttendanceRecordResponse {
  id: number | null;
  class_session_id: number;
  status: number | null; // 1: C, 2: V, 3: M
  note: string | null;
  session_date: string;
  attendance_created_at: string | null;
}

export interface StudentAttendanceMatrixResponse {
  student_id: number;
  student_code: string;
  full_name: string;
  records: AttendanceRecordResponse[];
}

export interface AttendanceMatrixResponse {
  course_section_id: number;
  students: StudentAttendanceMatrixResponse[];
  total_sessions: number;
}

export interface AttendanceUpdateCellRequest {
  student_id: number;
  class_session_id: number;
  status: number | null;
  note?: string | null;
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
