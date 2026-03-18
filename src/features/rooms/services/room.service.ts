import type {
  PhongHoc,
  CreatePhongHocDto,
  UpdatePhongHocDto,
  RoomFilter,
} from '../types';
import type { PaginatedResult } from '@/shared/types';

export interface CameraOption {
  id: string;
  tenCamera: string;
  ipAddress: string;
}

/**
 * IRoomService — Contract cho PhongHoc
 */
export interface IRoomService {
  list(filter: RoomFilter): Promise<PaginatedResult<PhongHoc>>;
  create(dto: CreatePhongHocDto): Promise<PhongHoc>;
  update(id: string, dto: UpdatePhongHocDto): Promise<PhongHoc>;
  delete(id: string): Promise<void>;
  
  /** Lấy DS tòa nhà để làm filter dropdown */
  getToaNhaOptions(): Promise<string[]>;

  /** Lấy DS camera chưa được gán để gán cho phòng học */
  getAvailableCameras(): Promise<CameraOption[]>;
}
