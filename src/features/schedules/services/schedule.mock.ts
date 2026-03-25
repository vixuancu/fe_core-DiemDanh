import type { IScheduleService, LopTinChiOption, PhongHocOption } from './schedule.service';
import type { LichHoc, CreateLichHocDto, UpdateLichHocDto, ScheduleFilter } from '../types';
import type { PaginatedResult } from '@/shared/types';
import { parseDateStringToLocalDate } from '@/shared/lib/date-time';

// Data mock options từ data.ts
const MOCK_LOP: LopTinChiOption[] = [
  { id: '1', maLop: 'K23-7E1062.22-2.2526-1.1_LT', tenMonHoc: 'Khóa luận tốt nghiệp', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình' },
  { id: '2', maLop: 'K23-7E1061.22-2.2526-3.3_LT', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', giangVienId: '5', tenGiangVien: 'Vũ Xuân Hạnh' },
  { id: '3', maLop: 'K23-7E1062.22-2.2526-2.1_LT', tenMonHoc: 'Trí tuệ nhân tạo', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình' },
  { id: '4', maLop: 'K23-7E1061.22-2.2526-4.2_LT', tenMonHoc: 'Lập trình web nâng cao', giangVienId: '6', tenGiangVien: 'Nguyễn Thị Lan' },
];

const MOCK_PHONG: PhongHocOption[] = [
  { id: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', maPhong: 'FIT.P11' },
  { id: '2', tenPhong: 'KGĐ FITHOU-FIT.P23', maPhong: 'FIT.P23' },
  { id: '3', tenPhong: 'KGĐ FITHOU-FIT.P31', maPhong: 'FIT.P31' },
  { id: '4', tenPhong: 'Nhà A - Phòng 201', maPhong: 'A.201' },
  { id: '5', tenPhong: 'Nhà A - Phòng 301', maPhong: 'A.301' },
];

let STORE: LichHoc[] = [
  { id: '1', lopTinChiId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', ngayHoc: '2026-03-09', caHoc: 'Tối', tietBatDau: 9, tietKetThuc: 12, thu: 2 },
  { id: '2', lopTinChiId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', tenGiangVien: 'Vũ Xuân Hạnh', phongHocId: '2', tenPhong: 'KGĐ FITHOU-FIT.P23', ngayHoc: '2026-03-10', caHoc: 'Tối', tietBatDau: 9, tietKetThuc: 12, thu: 3 },
  { id: '3', lopTinChiId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', ngayHoc: '2026-03-11', caHoc: 'Sáng', tietBatDau: 1, tietKetThuc: 4, thu: 4 },
  { id: '4', lopTinChiId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', tenGiangVien: 'Nguyễn Thị Lan', phongHocId: '2', tenPhong: 'KGĐ FITHOU-FIT.P23', ngayHoc: '2026-03-12', caHoc: 'Sáng', tietBatDau: 1, tietKetThuc: 4, thu: 5 },
  { id: '5', lopTinChiId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', ngayHoc: '2026-03-13', caHoc: 'Tối', tietBatDau: 9, tietKetThuc: 12, thu: 6 },
  { id: '6', lopTinChiId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', ngayHoc: '2026-03-10', caHoc: 'Chiều', tietBatDau: 5, tietKetThuc: 8, thu: 3 },
  { id: '7', lopTinChiId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', tenGiangVien: 'Nguyễn Thị Lan', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', ngayHoc: '2026-03-10', caHoc: 'Chiều', tietBatDau: 5, tietKetThuc: 8, thu: 3 },
];

let _nextId = 8;
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const scheduleMock: IScheduleService = {
  async list({ search = '', tuNgay, denNgay, giangVienId, page = 1, perPage = 10 }: ScheduleFilter): Promise<PaginatedResult<LichHoc>> {
    await delay();

    const filtered = STORE.filter((l) => {
      let match = true;
      if (search) {
        match = match && (l.tenMonHoc.toLowerCase().includes(search.toLowerCase()) || l.maLop.toLowerCase().includes(search.toLowerCase()));
      }
      if (tuNgay) match = match && l.ngayHoc >= tuNgay;
      if (denNgay) match = match && l.ngayHoc <= denNgay;
      if (giangVienId) {
        // Tìm LopTinChi de lay giangVienId
        const lop = MOCK_LOP.find(lop => lop.id === l.lopTinChiId);
        if (lop) {
           match = match && lop.giangVienId === giangVienId;
        } else {
           match = false;
        }
      }
      return match;
    });

    // Sort by Date (local-safe)
    filtered.sort((a, b) => {
      const da = parseDateStringToLocalDate(a.ngayHoc)?.getTime() ?? 0;
      const db = parseDateStringToLocalDate(b.ngayHoc)?.getTime() ?? 0;
      return da - db;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    return { data, total, page: safePage, perPage, totalPages };
  },

  async create(dto: CreateLichHocDto): Promise<LichHoc> {
    await delay(400);

    const lop = MOCK_LOP.find(l => l.id === dto.lopTinChiId);
    if (!lop) throw new Error('Lớp tín chỉ không hợp lệ');

    const phong = MOCK_PHONG.find(p => p.id === dto.phongHocId);
    if (!phong) throw new Error('Phòng học không hợp lệ');

    const d = parseDateStringToLocalDate(dto.ngayHoc) ?? new Date(dto.ngayHoc);
    const thu = d.getDay() === 0 ? 8 : d.getDay() + 1;

    const newSchedule: LichHoc = {
      ...dto,
      id: String(_nextId++),
      maLop: lop.maLop,
      tenMonHoc: lop.tenMonHoc,
      tenGiangVien: lop.tenGiangVien,
      tenPhong: phong.tenPhong,
      thu,
    };
    STORE.push(newSchedule);
    return { ...newSchedule };
  },

  async update(id: string, dto: UpdateLichHocDto): Promise<LichHoc> {
    await delay(400);
    const idx = STORE.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lịch học id=${id} không tồn tại`);

    let item = { ...STORE[idx] };
    if (dto.lopTinChiId) {
       const lop = MOCK_LOP.find(l => l.id === dto.lopTinChiId);
       if (lop) {
         item.maLop = lop.maLop;
         item.tenMonHoc = lop.tenMonHoc;
         item.tenGiangVien = lop.tenGiangVien;
         item.lopTinChiId = dto.lopTinChiId;
       }
    }
    if (dto.phongHocId) {
      const phong = MOCK_PHONG.find(p => p.id === dto.phongHocId);
      if (phong) {
        item.tenPhong = phong.tenPhong;
        item.phongHocId = dto.phongHocId;
      }
    }
    
    if (dto.ngayHoc) {
      const d = parseDateStringToLocalDate(dto.ngayHoc) ?? new Date(dto.ngayHoc);
      item.thu = d.getDay() === 0 ? 8 : d.getDay() + 1;
      item.ngayHoc = dto.ngayHoc;
    }
    if (dto.caHoc) item.caHoc = dto.caHoc;
    if (dto.tietBatDau) item.tietBatDau = dto.tietBatDau;
    if (dto.tietKetThuc) item.tietKetThuc = dto.tietKetThuc;

    STORE[idx] = item;
    return { ...item };
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const idx = STORE.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lịch học id=${id} không tồn tại`);
    STORE.splice(idx, 1);
  },

  async getLopTinChiOptions(): Promise<LopTinChiOption[]> {
    await delay(100);
    return MOCK_LOP;
  },

  async getPhongHocOptions(): Promise<PhongHocOption[]> {
    await delay(100);
    return MOCK_PHONG;
  },
};
