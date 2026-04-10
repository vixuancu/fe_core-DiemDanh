import type { ICreditClassService } from './credit-class.service';
import type {
  LopTinChiBuoiHoc,
  UpdateLopTinChiBuoiHocDto,
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
import { mockSinhVien } from '@/app/components/data';

const MOCK_COURSES = [
  { id: '1', name: 'Khóa luận tốt nghiệp' },
  { id: '2', name: 'Chuyên đề thực tập chuyên ngành' },
  { id: '3', name: 'Trí tuệ nhân tạo' },
  { id: '4', name: 'Lập trình web nâng cao' },
];

const MOCK_LECTURERS = [
  { id: '3', name: 'Đỗ Duy Trình' },
  { id: '5', name: 'Vũ Xuân Hạnh' },
  { id: '6', name: 'Nguyễn Thị Lan' },
];

const MOCK_ROOMS = [
  { id: '1', name: 'A1-101' },
  { id: '2', name: 'A1-102' },
  { id: '3', name: 'B2-201' },
];

let STORE: LopTinChi[] = [
//   { id: '1', maLop: 'K23-7E1062.22-2.2526-1.1_LT', courseId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình', roomId: '1', tenPhongHoc: 'A1-101', dayOfWeek: 2, startDate: '2025-08-20T00:00:00', endDate: '2026-01-05T00:00:00', startPeriod: 1, numberOfPeriods: 3, siSo: 35, hocKy: '2025-2026.2' },
//   { id: '2', maLop: 'K23-7E1061.22-2.2526-3.3_LT', courseId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', giangVienId: '5', tenGiangVien: 'Vũ Xuân Hạnh', roomId: '2', tenPhongHoc: 'A1-102', dayOfWeek: 3, startDate: '2025-08-22T00:00:00', endDate: '2026-01-05T00:00:00', startPeriod: 4, numberOfPeriods: 3, siSo: 40, hocKy: '2025-2026.2' },
//   { id: '3', maLop: 'K23-7E1062.22-2.2526-2.1_LT', courseId: '3', tenMonHoc: 'Trí tuệ nhân tạo', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình', roomId: '3', tenPhongHoc: 'B2-201', dayOfWeek: 4, startDate: '2025-08-21T00:00:00', endDate: '2026-01-05T00:00:00', startPeriod: 7, numberOfPeriods: 3, siSo: 45, hocKy: '2025-2026.2' },
//   { id: '4', maLop: 'K23-7E1061.22-2.2526-4.2_LT', courseId: '4', tenMonHoc: 'Lập trình web nâng cao', giangVienId: '6', tenGiangVien: 'Nguyễn Thị Lan', roomId: '2', tenPhongHoc: 'A1-102', dayOfWeek: 6, startDate: '2025-08-23T00:00:00', endDate: '2026-01-05T00:00:00', startPeriod: 1, numberOfPeriods: 3, siSo: 50, hocKy: '2025-2026.2' },
];

let _nextId = 5;
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const ENROLLMENTS: Record<string, string[]> = {
  '1': ['1', '2', '3'],
  '2': ['4', '5'],
  '3': ['6', '7', '8'],
};

const SESSIONS_STORE: Record<string, LopTinChiBuoiHoc[]> = {};

function ensureSessionStore(sectionId: string): LopTinChiBuoiHoc[] {
  if (SESSIONS_STORE[sectionId]) return SESSIONS_STORE[sectionId];

  const section = STORE.find((item) => item.id === sectionId);
  if (!section) {
    SESSIONS_STORE[sectionId] = [];
    return SESSIONS_STORE[sectionId];
  }

  const data: LopTinChiBuoiHoc[] = (section.schedules ?? []).map((schedule, index) => ({
    id: `${sectionId}-${index + 1}`,
    courseSectionId: sectionId,
    sessionDate: section.startDate,
    roomId: schedule.roomId,
    roomName: schedule.roomName,
    status: 'da_xong',
    statusLabel: 'Đã xong',
    note: '',
  }));
  SESSIONS_STORE[sectionId] = data;
  return data;
}

export const creditClassMock: ICreditClassService = {
  async list({ search = '', page = 1, perPage = 10 }: CreditClassFilter): Promise<PaginatedResult<LopTinChi>> {
    await delay();

    const filtered = STORE.filter((l) =>
      !search ||
      l.tenMonHoc.toLowerCase().includes(search.toLowerCase()) ||
      l.maLop.toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    return { data, total, page: safePage, perPage, totalPages };
  },

  async create(dto: CreateLopTinChiDto): Promise<LopTinChi> {
    await delay(400);
    if (STORE.some((l) => l.maLop === dto.maLop)) {
      throw new Error(`Mã lớp tín chỉ "${dto.maLop}" đã tồn tại`);
    }

    const lecturer = MOCK_LECTURERS.find((g) => g.id === dto.giangVienId);
    if (!lecturer) throw new Error('Giảng viên không hợp lệ');

    const course = MOCK_COURSES.find((c) => c.id === dto.courseId);
    if (!course) throw new Error('Học phần không hợp lệ');

    const room = MOCK_ROOMS.find((r) => r.id === dto.roomId);
    if (!room) throw new Error('Phòng học không hợp lệ');

    const semester = dto.startDate.slice(0, 4) + '-' + dto.endDate.slice(0, 4) + (new Date(dto.startDate).getMonth() + 1 <= 6 ? '.1' : '.2');

    const newClass: LopTinChi = {
      ...dto,
      id: String(_nextId++),
      tenMonHoc: course.name,
      tenGiangVien: lecturer.name,
      tenPhongHoc: room.name,
      siSo: 0,
    //   hocKy: semester,
    };
    STORE.push(newClass);
    return { ...newClass };
  },

  async update(id: string, dto: UpdateLopTinChiDto): Promise<LopTinChi> {
    await delay(400);
    const idx = STORE.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lớp tín chỉ id=${id} không tồn tại`);

    let tenGiangVien = STORE[idx].tenGiangVien;
    if (dto.giangVienId) {
      const gv = MOCK_LECTURERS.find((g) => g.id === dto.giangVienId);
      if (gv) tenGiangVien = gv.name;
    }

    let tenMonHoc = STORE[idx].tenMonHoc;
    if (dto.courseId) {
      const course = MOCK_COURSES.find((c) => c.id === dto.courseId);
      if (course) tenMonHoc = course.name;
    }

    let tenPhongHoc = STORE[idx].tenPhongHoc;
    if (dto.roomId) {
      const room = MOCK_ROOMS.find((r) => r.id === dto.roomId);
      if (room) tenPhongHoc = room.name;
    }

    STORE[idx] = { ...STORE[idx], ...dto, tenGiangVien, tenMonHoc, tenPhongHoc };
    return { ...STORE[idx] };
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const idx = STORE.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lớp tín chỉ id=${id} không tồn tại`);
    STORE.splice(idx, 1);
  },

  async getFormOptions(): Promise<CreditClassFormOptions> {
    await delay(100);
    return {
      courses: MOCK_COURSES,
      lecturers: MOCK_LECTURERS,
      rooms: MOCK_ROOMS,
    };
  },

  async listStudents(sectionId: string, filter: CreditClassStudentFilter): Promise<PaginatedResult<CreditClassStudent>> {
    await delay(150);
    const enrolledIds = ENROLLMENTS[sectionId] ?? [];
    const keyword = (filter.search ?? '').trim().toLowerCase();
    const page = filter.page ?? 1;
    const perPage = filter.perPage ?? 10;

    const filtered = mockSinhVien
      .filter((sv) => enrolledIds.includes(sv.id))
      .filter((sv) => {
        if (!keyword) return true;
        return [sv.maSV, sv.hoTen, sv.lop].join(' ').toLowerCase().includes(keyword);
      })
      .map((sv) => ({
        id: sv.id,
        maSV: sv.maSV,
        hoTen: sv.hoTen,
        lopHanhChinh: sv.lop,
      }));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    return { data, total, page: safePage, perPage, totalPages };
  },

  async addStudent(sectionId: string, studentId: string): Promise<CreditClassStudent> {
    await delay(150);
    const student = mockSinhVien.find((sv) => sv.id === studentId);
    if (!student) {
      throw new Error('Không tìm thấy sinh viên');
    }

    ENROLLMENTS[sectionId] = ENROLLMENTS[sectionId] ?? [];
    if (!ENROLLMENTS[sectionId].includes(studentId)) {
      ENROLLMENTS[sectionId].push(studentId);
    }

    return {
      id: student.id,
      maSV: student.maSV,
      hoTen: student.hoTen,
      lopHanhChinh: student.lop,
    };
  },

  async removeStudent(sectionId: string, studentId: string): Promise<void> {
    await delay(150);
    ENROLLMENTS[sectionId] = (ENROLLMENTS[sectionId] ?? []).filter((id) => id !== studentId);
  },

  async listSessions(sectionId: string): Promise<LopTinChiBuoiHoc[]> {
    await delay(120);
    return [...ensureSessionStore(sectionId)];
  },

  async updateSession(
    sectionId: string,
    sessionId: string,
    dto: UpdateLopTinChiBuoiHocDto,
  ): Promise<LopTinChiBuoiHoc> {
    await delay(120);
    const sessions = ensureSessionStore(sectionId);
    const idx = sessions.findIndex((item) => item.id === sessionId);
    if (idx < 0) throw new Error('Không tìm thấy buổi học');

    const statusLabel = dto.status === 'nghi' ? 'Nghỉ' : dto.status === 'bu' ? 'Bù' : 'Đã xong';
    sessions[idx] = {
      ...sessions[idx],
      status: dto.status,
      statusLabel,
      note: dto.note ?? '',
    };
    return sessions[idx];
  },

  async importStudentsFromExcel(sectionId: string, file: File): Promise<CreditClassStudentImportResult> {
    await delay(200);

    if (!STORE.some((item) => item.id === sectionId)) {
      throw new Error('Không tìm thấy lớp tín chỉ');
    }

    if (!file) {
      throw new Error('Vui lòng chọn file để import');
    }

    return {
      totalRows: 0,
      importedCount: 0,
      failedCount: 0,
      errors: [],
    };
  },

  async downloadStudentImportTemplate(sectionId: string): Promise<Blob> {
    await delay(120);

    if (!STORE.some((item) => item.id === sectionId)) {
      throw new Error('Không tìm thấy lớp tín chỉ');
    }

    const content = 'ma_sinh_vien\n';
    return new Blob([content], {
      type: 'text/csv;charset=utf-8;',
    });
  },
};
