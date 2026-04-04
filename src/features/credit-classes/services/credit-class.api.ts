import { config } from '@/shared/config/env';
import { forceLogout, getAuthHeaders } from '@/features/auth/session';
import { parseEnvelope, parseListEnvelope } from '@/shared/model/api-error.model';
import type { ICreditClassService } from './credit-class.service';
import type {
  CreditClassStudentImportResult,
  CreditClassStudent,
  CreditClassStudentFilter,
  CreditClassFilter,
  CreditClassFormOptions,
  CreateLopTinChiDto,
  LopTinChi,
  UpdateLopTinChiDto,
} from '../types';
import type { PaginatedResult } from '@/shared/types';

const API_URL = `${config.apiBaseUrl}/course-sections`;

interface CourseSectionResponse {
  id: number;
  name: string;
  course_id: number;
  course_name: string;
  user_id: number;
  user_full_name?: string;
  room_id: number;
  room_name: string;
  day_of_week: number;
  start_date: string;
  end_date: string;
  start_period: number;
  number_of_periods: number;
  start_time?: string;
  end_time?: string;
  hoc_ky: string;
  si_so: number;
}

interface CourseSectionOptionResponse {
  id: number;
  name: string;
}

interface CourseSectionFormOptionsResponse {
  courses: CourseSectionOptionResponse[];
  lecturers: CourseSectionOptionResponse[];
  rooms: CourseSectionOptionResponse[];
}

interface CourseSectionStudentResponse {
  id: number;
  student_code: string;
  full_name: string;
  administrative_class_name?: string | null;
}

interface BackendImportError {
  row: number;
  field: string;
  student_code?: string | null;
  message: string;
}

interface BackendImportResult {
  total_rows: number;
  imported_count: number;
  failed_count: number;
  errors: BackendImportError[];
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function mapCourseSection(item: CourseSectionResponse): LopTinChi {
  return {
    id: String(item.id),
    maLop: item.name,
    courseId: String(item.course_id),
    tenMonHoc: item.course_name,
    giangVienId: String(item.user_id),
    tenGiangVien: item.user_full_name || 'Chưa rõ',
    roomId: String(item.room_id),
    tenPhongHoc: item.room_name,
    dayOfWeek: item.day_of_week,
    startDate: item.start_date,
    endDate: item.end_date,
    startPeriod: item.start_period,
    numberOfPeriods: item.number_of_periods,
    startTime: item.start_time,
    endTime: item.end_time,
    siSo: item.si_so,
    // hocKy: item.hoc_ky,
  };
}

function mapCourseSectionStudent(item: CourseSectionStudentResponse): CreditClassStudent {
  return {
    id: String(item.id),
    maSV: item.student_code,
    hoTen: item.full_name,
    lopHanhChinh: item.administrative_class_name || 'Chưa phân lớp',
  };
}

function mapImportResult(item: BackendImportResult): CreditClassStudentImportResult {
  return {
    totalRows: item.total_rows,
    importedCount: item.imported_count,
    failedCount: item.failed_count,
    errors: item.errors.map((error) => ({
      row: error.row,
      field: error.field,
      studentCode: error.student_code || undefined,
      message: error.message,
    })),
  };
}

function mapCreatePayload(dto: CreateLopTinChiDto) {
  return {
    name: dto.maLop,
    course_id: Number(dto.courseId),
    user_id: Number(dto.giangVienId),
    room_id: Number(dto.roomId),
    day_of_week: dto.dayOfWeek,
    start_date: dto.startDate,
    end_date: dto.endDate,
    start_period: dto.startPeriod,
    number_of_periods: dto.numberOfPeriods,
    start_time: dto.startTime || null,
    end_time: dto.endTime || null,
  };
}

function mapUpdatePayload(dto: UpdateLopTinChiDto) {
  const payload: Record<string, unknown> = {};
  if (dto.maLop !== undefined) payload.name = dto.maLop;
  if (dto.courseId !== undefined) payload.course_id = Number(dto.courseId);
  if (dto.giangVienId !== undefined) payload.user_id = Number(dto.giangVienId);
  if (dto.roomId !== undefined) payload.room_id = Number(dto.roomId);
  if (dto.dayOfWeek !== undefined) payload.day_of_week = dto.dayOfWeek;
  if (dto.startDate !== undefined) payload.start_date = dto.startDate;
  if (dto.endDate !== undefined) payload.end_date = dto.endDate;
  if (dto.startPeriod !== undefined) payload.start_period = dto.startPeriod;
  if (dto.numberOfPeriods !== undefined) payload.number_of_periods = dto.numberOfPeriods;
  if (dto.startTime !== undefined) payload.start_time = dto.startTime || null;
  if (dto.endTime !== undefined) payload.end_time = dto.endTime || null;
  return payload;
}

export const creditClassApi: ICreditClassService = {
  async list(filter: CreditClassFilter): Promise<PaginatedResult<LopTinChi>> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (typeof filter.isCancel === 'boolean') params.set('is_cancel', String(filter.isCancel));
    params.set('page', String(filter.page ?? 1));
    params.set('page_size', String(filter.perPage ?? 10));

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseListEnvelope<CourseSectionResponse>(res);

    return {
      data: payload.data.map(mapCourseSection),
      total: payload.total,
      page: payload.page,
      perPage: payload.page_size,
      totalPages: payload.total_pages,
    };
  },

  async create(dto: CreateLopTinChiDto): Promise<LopTinChi> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(mapCreatePayload(dto)),
    });
    const payload = await parseEnvelope<CourseSectionResponse>(res);
    return mapCourseSection(payload.data);
  },

  async update(id: string, dto: UpdateLopTinChiDto): Promise<LopTinChi> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(mapUpdatePayload(dto)),
    });
    const payload = await parseEnvelope<CourseSectionResponse>(res);
    return mapCourseSection(payload.data);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await parseEnvelope<void>(res);
  },

  async getFormOptions(): Promise<CreditClassFormOptions> {
    const res = await fetch(`${API_URL}/options`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<CourseSectionFormOptionsResponse>(res);

    return {
      courses: payload.data.courses.map((item) => ({ id: String(item.id), name: item.name })),
      lecturers: payload.data.lecturers.map((item) => ({ id: String(item.id), name: item.name })),
      rooms: payload.data.rooms.map((item) => ({ id: String(item.id), name: item.name })),
    };
  },

  async listStudents(sectionId: string, filter: CreditClassStudentFilter): Promise<PaginatedResult<CreditClassStudent>> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    params.set('page', String(filter.page ?? 1));
    params.set('page_size', String(filter.perPage ?? 10));

    const res = await fetch(`${API_URL}/${sectionId}/students?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseListEnvelope<CourseSectionStudentResponse>(res);

    return {
      data: payload.data.map(mapCourseSectionStudent),
      total: payload.total,
      page: payload.page,
      perPage: payload.page_size,
      totalPages: payload.total_pages,
    };
  },

  async addStudent(sectionId: string, studentId: string): Promise<CreditClassStudent> {
    const res = await fetch(`${API_URL}/${sectionId}/students`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ student_id: Number(studentId) }),
    });
    const payload = await parseEnvelope<CourseSectionStudentResponse>(res);
    return mapCourseSectionStudent(payload.data);
  },

  async removeStudent(sectionId: string, studentId: string): Promise<void> {
    const res = await fetch(`${API_URL}/${sectionId}/students/${studentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await parseEnvelope<void>(res);
  },

  async importStudentsFromExcel(sectionId: string, file: File): Promise<CreditClassStudentImportResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const res = await fetch(`${API_URL}/${sectionId}/students/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const payload = await parseEnvelope<BackendImportResult>(res);
    return mapImportResult(payload.data);
  },

  async downloadStudentImportTemplate(sectionId: string): Promise<Blob> {
    const res = await fetch(`${API_URL}/${sectionId}/students/import/template`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      forceLogout();
      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      throw new ApiError(payload.message || 'Tải file mẫu thất bại', res.status);
    }

    return await res.blob();
  },
};
