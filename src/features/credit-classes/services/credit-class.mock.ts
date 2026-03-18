import type { ICreditClassService, GiangVienOption } from './credit-class.service';
import type { LopTinChi, CreateLopTinChiDto, UpdateLopTinChiDto, CreditClassFilter } from '../types';
import type { PaginatedResult } from '@/shared/types';

// ─── Lấy giang vien từ data cũ (làm mock option) ────────────────────────────
// Ta lấy tạm mockGiangVien vào đây, mockGiangVien.hoTen được dùng để gán tenGiangVien
const MOCK_GIANG_VIEN = [
  { id: '3', hoTen: 'Đỗ Duy Trình', trangThai: 'active' },
  { id: '5', hoTen: 'Vũ Xuân Hạnh', trangThai: 'active' },
  { id: '6', hoTen: 'Nguyễn Thị Lan', trangThai: 'active' },
  { id: '7', hoTen: 'Trần Minh Quang', trangThai: 'locked' },
];

let STORE: LopTinChi[] = [
  { id: '1', maLop: 'K23-7E1062.22-2.2526-1.1_LT', tenMonHoc: 'Khóa luận tốt nghiệp', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình', siSo: 35, hocKy: '2025-2026.2' },
  { id: '2', maLop: 'K23-7E1061.22-2.2526-3.3_LT', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', giangVienId: '5', tenGiangVien: 'Vũ Xuân Hạnh', siSo: 40, hocKy: '2025-2026.2' },
  { id: '3', maLop: 'K23-7E1062.22-2.2526-2.1_LT', tenMonHoc: 'Trí tuệ nhân tạo', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình', siSo: 45, hocKy: '2025-2026.2' },
  { id: '4', maLop: 'K23-7E1061.22-2.2526-4.2_LT', tenMonHoc: 'Lập trình web nâng cao', giangVienId: '6', tenGiangVien: 'Nguyễn Thị Lan', siSo: 50, hocKy: '2025-2026.2' },
];

let _nextId = 5;
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

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
    // Validate trùng lớp
    if (STORE.some((l) => l.maLop === dto.maLop)) {
      throw new Error(`Mã lớp tín chỉ "${dto.maLop}" đã tồn tại`);
    }

    const gv = MOCK_GIANG_VIEN.find(g => g.id === dto.giangVienId);
    if (!gv) throw new Error('Giảng viên không hợp lệ');

    const newClass: LopTinChi = {
      ...dto,
      id: String(_nextId++),
      tenGiangVien: gv.hoTen,
      siSo: 0, // Mặc định lớp mới tạo sĩ số 0
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
       const gv = MOCK_GIANG_VIEN.find(g => g.id === dto.giangVienId);
       if (gv) tenGiangVien = gv.hoTen;
    }

    STORE[idx] = { ...STORE[idx], ...dto, tenGiangVien };
    return { ...STORE[idx] };
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const idx = STORE.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lớp tín chỉ id=${id} không tồn tại`);
    STORE.splice(idx, 1);
  },

  async getGiangVienOptions(): Promise<GiangVienOption[]> {
    await delay(100);
    return MOCK_GIANG_VIEN.filter(g => g.trangThai === 'active').map(g => ({
      id: g.id,
      hoTen: g.hoTen
    }));
  },
};
