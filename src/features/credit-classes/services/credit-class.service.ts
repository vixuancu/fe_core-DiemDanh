import type {
  LopTinChiBuoiHoc,
  UpdateLopTinChiBuoiHocDto,
  CreditClassStudentImportResult,
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
  listSessions(sectionId: string): Promise<LopTinChiBuoiHoc[]>;
  updateSession(sectionId: string, sessionId: string, dto: UpdateLopTinChiBuoiHocDto): Promise<LopTinChiBuoiHoc>;
  importStudentsFromExcel(sectionId: string, file: File): Promise<CreditClassStudentImportResult>;
  downloadStudentImportTemplate(sectionId: string): Promise<Blob>;
}
