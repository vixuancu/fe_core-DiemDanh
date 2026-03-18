import type {
  LopTinChi,
  CreateLopTinChiDto,
  UpdateLopTinChiDto,
  CreditClassFilter,
} from '../types';
import type { PaginatedResult, UserRole } from '@/shared/types';

export interface GiangVienOption {
  id: string;
  hoTen: string;
}

/**
 * ICreditClassService — Contract cho LopTinChi
 */
export interface ICreditClassService {
  /** Lấy danh sách lớp tín chỉ có filter + phân trang */
  list(filter: CreditClassFilter): Promise<PaginatedResult<LopTinChi>>;

  /** Thêm lớp tín chỉ mới */
  create(dto: CreateLopTinChiDto): Promise<LopTinChi>;

  /** Cập nhật thông tin lớp tín chỉ */
  update(id: string, dto: UpdateLopTinChiDto): Promise<LopTinChi>;

  /** Xóa lớp tín chỉ */
  delete(id: string): Promise<void>;

  /** Lấy danh sách giảng viên để gán vào lớp */
  getGiangVienOptions(): Promise<GiangVienOption[]>;
}
