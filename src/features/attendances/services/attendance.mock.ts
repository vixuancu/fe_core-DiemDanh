import type { IAttendanceService, AttendanceStats } from './attendance.service';
import type { DiemDanh, UpdateTrangThaiDto, AttendanceFilter, AttendanceMatrixResponse, AttendanceUpdateCellRequest } from '../types';
import type { PaginatedResult } from '@/shared/types';
import { mockDiemDanh, mockLichHoc, mockSinhVien } from '@/app/components/data'; // Tạm dùng gốc để mock

let STORE: DiemDanh[] = [...mockDiemDanh];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const attendanceMock: IAttendanceService = {
  async list({ lichHocId, maLop, giangVienId, search = '', trangThai = '', tuNgay, denNgay, page = 1, perPage = 10 }: AttendanceFilter): Promise<PaginatedResult<DiemDanh>> {
    await delay();

    const filtered = STORE.filter((d) => {
      let match = true;
      if (lichHocId) match = match && d.lichHocId === lichHocId;
      if (maLop) match = match && d.maLop === maLop;
      // giangVienId logic goes here if STORE had it, but we skip it for mock since it's basic
      if (search) match = match && (d.hoTenSV.toLowerCase().includes(search.toLowerCase()) || d.maSV.toLowerCase().includes(search.toLowerCase()));
      if (trangThai) match = match && d.trangThai === trangThai;
      
      if (tuNgay || denNgay) {
         // Chuyển đổi DD/MM/YYYY trong d.ngay thành Date nếu store dùng định dạng đó,
         // hoặc YYYY-MM-DD. Hiện tại d.ngay trong data.ts là DD/MM/YYYY.
         const parts = d.ngay.split('/');
         if (parts.length === 3) {
           const recordDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
           if (tuNgay) {
              const td = new Date(tuNgay);
              td.setHours(0,0,0,0);
              match = match && recordDate >= td;
           }
           if (denNgay) {
              const dd = new Date(denNgay);
              dd.setHours(23,59,59,999);
              match = match && recordDate <= dd;
           }
         }
      }
      return match;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    return { data, total, page: safePage, perPage, totalPages };
  },

  async getStats(lichHocId: string): Promise<AttendanceStats> {
    await delay(100);
    const lessonData = STORE.filter(d => d.lichHocId === lichHocId);
    return {
      total: lessonData.length,
      coMat: lessonData.filter(d => d.trangThai === 'co_mat').length,
      tre: lessonData.filter(d => d.trangThai === 'tre').length,
      vang: lessonData.filter(d => d.trangThai === 'vang').length,
    };
  },

  async updateStatus(id: string, dto: UpdateTrangThaiDto): Promise<DiemDanh> {
    await delay(400);
    const idx = STORE.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Bản ghi điểm danh id=${id} không tồn tại`);

    STORE[idx] = { ...STORE[idx], trangThai: dto.trangThai, ghiChu: dto.ghiChu ?? STORE[idx].ghiChu };
    return { ...STORE[idx] };
  },

  async syncStudentsForSchedule(lichHocId: string): Promise<void> {
    await delay(500);
    const schedule = mockLichHoc.find(l => l.id === lichHocId);
    if (!schedule) throw new Error('Không tìm thấy lịch học');

    // Chỗ này đáng lẽ BE sẽ join LopTinChi -> SinhVien để lấy danh sách. Ta lấy toàn bộ mockSinhVien giả lập
    const existing = STORE.filter(d => d.lichHocId === lichHocId).map(d => d.sinhVienId);
    const newStudents = mockSinhVien.filter(sv => !existing.includes(sv.id));

    const newRecords = newStudents.map((sv, idx) => ({
      id: `new_dd_${Date.now()}_${idx}`,
      sinhVienId: sv.id,
      maSV: sv.maSV,
      hoTenSV: sv.hoTen,
      lichHocId: schedule.id,
      tenMonHoc: schedule.tenMonHoc,
      maLop: schedule.maLop,
      ngay: schedule.ngayHoc,
      thoiGian: '',
      trangThai: 'vang' as const, // Mặc định vắng nếu chưa điểm danh camera
    }));

    STORE = [...STORE, ...newRecords];
  },

  async getMatrix(courseSectionId: string | number, fromDate?: string, toDate?: string): Promise<AttendanceMatrixResponse> {
    return {
      course_section_id: Number(courseSectionId),
      students: [],
      total_sessions: 0,
    };
  },

  async updateCell(request: AttendanceUpdateCellRequest): Promise<any> {
    return { success: true };
  }
};
