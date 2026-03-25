import type {
  SinhVien,
  CreateSinhVienDto,
  UpdateSinhVienDto,
  StudentFilter,
  LopHanhChinhOption,
  StudentFaceItem,
  StudentImportResult,
  StudentStats,
  PaginatedResult,
} from '../types';

/**
 * IStudentService — Contract mà cả mock và API đều phải implement.
 *
 * Mọi thay đổi ở tầng UI chỉ cần gọi các method này.
 * Không quan tâm data đến từ đâu (mock file hay REST API).
 */
export interface IStudentService {
  /** Lấy danh sách sinh viên có filter + phân trang */
  list(filter: StudentFilter): Promise<PaginatedResult<SinhVien>>;

  /** Lấy một sinh viên theo id */
  getById(id: string): Promise<SinhVien>;

  /** Thêm sinh viên mới */
  create(dto: CreateSinhVienDto): Promise<SinhVien>;

  /** Cập nhật thông tin sinh viên */
  update(id: string, dto: UpdateSinhVienDto): Promise<SinhVien>;

  /** Xóa sinh viên */
  delete(id: string): Promise<void>;

  /** Lấy danh sách tên lớp (để render filter dropdown) */
  getLopOptions(): Promise<LopHanhChinhOption[]>;

  getStats(filter: Pick<StudentFilter, 'search' | 'lopHanhChinhId'>): Promise<StudentStats>;

  listFaces(studentId: string): Promise<StudentFaceItem[]>;

  addFace(studentId: string, imageUrl: string): Promise<StudentFaceItem>;

  deleteFace(studentId: string, faceId: string): Promise<void>;

  /** Import danh sách từ file Excel */
  importFromExcel(file: File): Promise<StudentImportResult>;

  downloadImportTemplate(): Promise<Blob>;
}
