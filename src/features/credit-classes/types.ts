import type { PaginatedResult } from '@/shared/types';

// ─── Domain model ─────────────────────────────────────────────────────────────

export interface LopTinChi {
  id: string;
  maLop: string;
  courseId: string;
  tenMonHoc: string;
  giangVienId: string;
  tenGiangVien: string;
  roomId: string;
  tenPhongHoc: string;
  dayOfWeek: number;
  startDate: string;
  endDate: string;
  startPeriod: number;
  numberOfPeriods: number;
  startTime?: string;
  endTime?: string;
  siSo: number;
//   hocKy: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLopTinChiDto {
  maLop: string;
  courseId: string;
  giangVienId: string;
  roomId: string;
  dayOfWeek: number;
  startDate: string;
  endDate: string;
  startPeriod: number;
  numberOfPeriods: number;
  startTime?: string;
  endTime?: string;
}

export type UpdateLopTinChiDto = Partial<CreateLopTinChiDto>;

export interface CreditClassOption {
  id: string;
  name: string;
}

export interface CreditClassFormOptions {
  courses: CreditClassOption[];
  lecturers: CreditClassOption[];
  rooms: CreditClassOption[];
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface CreditClassFilter {
  search?: string;
  giangVienId?: string;
  page?: number;
  perPage?: number;
}
