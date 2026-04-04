import type {
  CreditClassStudent,
  CreditClassStudentFilter,
  CreditClassFormOptions,
  LopTinChi,
  CreateLopTinChiDto,
  UpdateLopTinChiDto,
  CreditClassFilter,
} from '../types';
import type { PaginatedResult } from '@/shared/types';
export interface ICreditClassService {
  list(filter: CreditClassFilter): Promise<PaginatedResult<LopTinChi>>;
  create(dto: CreateLopTinChiDto): Promise<LopTinChi>;
  update(id: string, dto: UpdateLopTinChiDto): Promise<LopTinChi>;
  delete(id: string): Promise<void>;
  getFormOptions(): Promise<CreditClassFormOptions>;
  listStudents(sectionId: string, filter: CreditClassStudentFilter): Promise<PaginatedResult<CreditClassStudent>>;
  addStudent(sectionId: string, studentId: string): Promise<CreditClassStudent>;
  removeStudent(sectionId: string, studentId: string): Promise<void>;
}
