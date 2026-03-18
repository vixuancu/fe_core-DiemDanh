import type { PaginatedResult } from '@/shared/types';

// ─── Domain model ─────────────────────────────────────────────────────────────

export interface SinhVien {
  id: string;
  maSV: string;
  hoTen: string;
  lop: string;
  email: string;
  soDienThoai: string;
  soAnhKhuonMat: number;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateSinhVienDto {
  maSV: string;
  hoTen: string;
  lop: string;
  email: string;
  soDienThoai: string;
}

export type UpdateSinhVienDto = Partial<CreateSinhVienDto>;

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface StudentFilter {
  search?: string;
  lop?: string;
  page?: number;
  perPage?: number;
}

// ─── Re-export PaginatedResult cho convenience ────────────────────────────────

export type { PaginatedResult };
