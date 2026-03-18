import type { PaginatedResult } from '@/shared/types';

// ─── Domain model ─────────────────────────────────────────────────────────────

export interface PhongHoc {
  id: string;
  maPhong: string;
  tenPhong: string;
  toaNha: string;
  tang: number;
  sucChua: number;
  cameraId?: string; // Tên property từ model cũ
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreatePhongHocDto {
  maPhong: string;
  tenPhong: string;
  toaNha: string;
  tang: number;
  sucChua: number;
  cameraId?: string;
}

export type UpdatePhongHocDto = Partial<CreatePhongHocDto>;

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface RoomFilter {
  search?: string;
  toaNha?: string;
  page?: number;
  perPage?: number;
}
