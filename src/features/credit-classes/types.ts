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
  schedules?: LopTinChiSchedule[];
  //   hocKy: string;
}

export interface LopTinChiSchedule {
  id?: string;
  userId?: string;
  userFullName?: string;
  dayOfWeek: number;
  dayOfWeekLabel?: string;
  startPeriod: number;
  endPeriod?: number;
  numberOfPeriods: number;
  startTime?: string;
  endTime?: string;
  roomId?: string;
  roomName?: string;
  displayText?: string;
}

export type BuoiHocStatus =
  | "chua_bat_dau"
  | "chua_xong"
  | "da_xong"
  | "nghi"
  | "bu";

export interface LopTinChiBuoiHoc {
  id: string;
  courseSectionId: string;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  roomId?: string;
  roomName?: string;
  status: BuoiHocStatus;
  statusLabel: string;
  note?: string;
}

export interface UpdateLopTinChiBuoiHocDto {
  status: BuoiHocStatus;
  note?: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLopTinChiScheduleDto {
  userId?: string;
  dayOfWeek: number;
  startPeriod: number;
  numberOfPeriods: number;
  roomId?: string;
}

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
  schedules?: CreateLopTinChiScheduleDto[];
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
  isCancel?: boolean;
  page?: number;
  perPage?: number;
}

export interface CreditClassStudent {
  id: string;
  maSV: string;
  hoTen: string;
  lopHanhChinh: string;
}

export interface CreditClassStudentFilter {
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreditClassStudentImportErrorItem {
  row: number;
  field: string;
  studentCode?: string;
  message: string;
}

export interface CreditClassStudentImportResult {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: CreditClassStudentImportErrorItem[];
}
