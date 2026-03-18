import type {
  LichHoc,
  CreateLichHocDto,
  UpdateLichHocDto,
  ScheduleFilter,
} from '../types';
import type { PaginatedResult } from '@/shared/types';

export interface LopTinChiOption {
  id: string;
  maLop: string;
  tenMonHoc: string;
  giangVienId: string;
  tenGiangVien: string;
}

export interface PhongHocOption {
  id: string;
  tenPhong: string;
  maPhong: string;
}

/**
 * IScheduleService — Contract cho LichHoc
 */
export interface IScheduleService {
  list(filter: ScheduleFilter): Promise<PaginatedResult<LichHoc>>;
  create(dto: CreateLichHocDto): Promise<LichHoc>;
  update(id: string, dto: UpdateLichHocDto): Promise<LichHoc>;
  delete(id: string): Promise<void>;

  /** DS Lớp tín chỉ để chọn khi tạo lịch */
  getLopTinChiOptions(): Promise<LopTinChiOption[]>;

  /** DS Phòng học để chọn khi tạo lịch */
  getPhongHocOptions(): Promise<PhongHocOption[]>;
}
