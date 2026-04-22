import type {
  DiemDanh,
  UpdateTrangThaiDto,
  AttendanceFilter,
  AttendanceMatrixResponse,
  AttendanceUpdateCellRequest,
} from '../types';
import type { PaginatedResult } from '@/shared/types';

export interface AttendanceStats {
  total: number;
  coMat: number;
  tre: number;
  vang: number;
}

/**
 * IAttendanceService
 */
export interface IAttendanceService {
  /** Lấy danh sách SV điểm danh trong 1 buổi (của môt lịch học) */
  list(filter: AttendanceFilter): Promise<PaginatedResult<DiemDanh>>;

  /** Thống kê điểm danh trong buổi học */
  getStats(lichHocId: string): Promise<AttendanceStats>;

  /** Giảng viên cập nhật thủ công trạng thái của SV */
  updateStatus(id: string, dto: UpdateTrangThaiDto): Promise<DiemDanh>;
  
  /** Khởi tạo data điểm danh ban đầu (set mốc vắng cho toàn bộ SV class) */
  syncStudentsForSchedule(lichHocId: string): Promise<void>;

  /** Lấy matrix điểm danh của lớp tín chỉ */
  getMatrix(courseSectionId: string | number, fromDate?: string, toDate?: string): Promise<AttendanceMatrixResponse>;

  /** Update cell trong matrix */
  updateCell(request: AttendanceUpdateCellRequest): Promise<any>;
}
