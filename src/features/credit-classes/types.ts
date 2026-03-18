import type { PaginatedResult } from '@/shared/types';

// ─── Domain model ─────────────────────────────────────────────────────────────

export interface LopTinChi {
  id: string;
  maLop: string;
  tenMonHoc: string;
  giangVienId: string;
  tenGiangVien: string;
  siSo: number;
  hocKy: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLopTinChiDto {
  maLop: string;
  tenMonHoc: string;
  giangVienId: string;
  hocKy: string;
}

export type UpdateLopTinChiDto = Partial<CreateLopTinChiDto>;

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface CreditClassFilter {
  search?: string;
  giangVienId?: string;
  page?: number;
  perPage?: number;
}
