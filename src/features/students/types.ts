import type { PaginatedResult } from '@/shared/types';

// ─── Domain model ─────────────────────────────────────────────────────────────

export interface SinhVien {
  id: string;
  maSV: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: boolean | null;
  lopHanhChinhId: string;
  lopHanhChinh: string;
  trangThai: 'active' | 'locked';
  soAnhKhuonMat: number;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateSinhVienDto {
  maSV: string;
  hoTen: string;
  ngaySinh?: string;
  gioiTinh?: boolean | null;
  lopHanhChinhId: string;
}

export interface UpdateSinhVienDto extends Partial<CreateSinhVienDto> {
  trangThai?: 'active' | 'locked';
}

export interface LopHanhChinhOption {
  id: string;
  name: string;
}

export interface StudentFaceItem {
  id: string;
  imageUrl: string;
  createdAt?: string;
}

export interface StudentImportErrorItem {
  row: number;
  field: string;
  studentCode?: string;
  message: string;
}

export interface StudentImportResult {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: StudentImportErrorItem[];
}

export interface StudentStats {
  total: number;
  active: number;
  locked: number;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface StudentFilter {
  search?: string;
  lopHanhChinhId?: string;
  trangThai?: 'active' | 'locked' | '';
  page?: number;
  perPage?: number;
}

// ─── Re-export PaginatedResult cho convenience ────────────────────────────────

export type { PaginatedResult };
