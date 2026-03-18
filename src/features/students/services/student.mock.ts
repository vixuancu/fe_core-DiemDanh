import type { IStudentService } from './student.service';
import type { SinhVien, CreateSinhVienDto, UpdateSinhVienDto, StudentFilter, PaginatedResult } from '../types';

// ─── Seed data (giữ nguyên từ data.ts cũ) ───────────────────────────────────

let STORE: SinhVien[] = [
  { id: '1', maSV: '22A1001D0043', hoTen: 'Vi Xuân Cử', lop: 'K23-7E1062', email: 'cu.vx@edu.vn', soDienThoai: '0901234567', soAnhKhuonMat: 15 },
  { id: '2', maSV: '22A1001D0044', hoTen: 'Nguyễn Văn An', lop: 'K23-7E1062', email: 'an.nv@edu.vn', soDienThoai: '0901234568', soAnhKhuonMat: 20 },
  { id: '3', maSV: '22A1001D0045', hoTen: 'Trần Thị Bình', lop: 'K23-7E1062', email: 'binh.tt@edu.vn', soDienThoai: '0901234569', soAnhKhuonMat: 18 },
  { id: '4', maSV: '22A1001D0046', hoTen: 'Lê Hoàng Cường', lop: 'K23-7E1061', email: 'cuong.lh@edu.vn', soDienThoai: '0901234570', soAnhKhuonMat: 12 },
  { id: '5', maSV: '22A1001D0047', hoTen: 'Phạm Minh Đức', lop: 'K23-7E1061', email: 'duc.pm@edu.vn', soDienThoai: '0901234571', soAnhKhuonMat: 0 },
  { id: '6', maSV: '22A1001D0048', hoTen: 'Hoàng Thị Em', lop: 'K23-7E1061', email: 'em.ht@edu.vn', soDienThoai: '0901234572', soAnhKhuonMat: 20 },
  { id: '7', maSV: '22A1001D0049', hoTen: 'Ngô Văn Phúc', lop: 'K23-7E1062', email: 'phuc.nv@edu.vn', soDienThoai: '0901234573', soAnhKhuonMat: 10 },
  { id: '8', maSV: '22A1001D0050', hoTen: 'Đặng Thị Giang', lop: 'K23-7E1062', email: 'giang.dt@edu.vn', soDienThoai: '0901234574', soAnhKhuonMat: 16 },
];

let _nextId = 9;
const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Implementation ──────────────────────────────────────────────────────────

export const studentMock: IStudentService = {
  async list({ search = '', lop = '', page = 1, perPage = 10 }: StudentFilter): Promise<PaginatedResult<SinhVien>> {
    await delay();

    const filtered = STORE.filter((sv) => {
      const matchSearch =
        !search ||
        sv.hoTen.toLowerCase().includes(search.toLowerCase()) ||
        sv.maSV.toLowerCase().includes(search.toLowerCase());
      const matchLop = !lop || sv.lop === lop;
      return matchSearch && matchLop;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    return { data, total, page: safePage, perPage, totalPages };
  },

  async getById(id: string): Promise<SinhVien> {
    await delay(200);
    const found = STORE.find((sv) => sv.id === id);
    if (!found) throw new Error(`Sinh viên id=${id} không tồn tại`);
    return { ...found };
  },

  async create(dto: CreateSinhVienDto): Promise<SinhVien> {
    await delay(400);
    // Validate trùng mã SV
    if (STORE.some((sv) => sv.maSV === dto.maSV)) {
      throw new Error(`Mã sinh viên "${dto.maSV}" đã tồn tại`);
    }
    const newSV: SinhVien = { ...dto, id: String(_nextId++), soAnhKhuonMat: 0 };
    STORE.push(newSV);
    return { ...newSV };
  },

  async update(id: string, dto: UpdateSinhVienDto): Promise<SinhVien> {
    await delay(400);
    const idx = STORE.findIndex((sv) => sv.id === id);
    if (idx === -1) throw new Error(`Sinh viên id=${id} không tồn tại`);
    STORE[idx] = { ...STORE[idx], ...dto };
    return { ...STORE[idx] };
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const idx = STORE.findIndex((sv) => sv.id === id);
    if (idx === -1) throw new Error(`Sinh viên id=${id} không tồn tại`);
    STORE.splice(idx, 1);
  },

  async getLopOptions(): Promise<string[]> {
    await delay(100);
    return [...new Set(STORE.map((sv) => sv.lop))].sort();
  },

  async importFromExcel(rows: CreateSinhVienDto[]) {
    await delay(600);
    const errors: string[] = [];
    let imported = 0;
    for (const row of rows) {
      if (STORE.some((sv) => sv.maSV === row.maSV)) {
        errors.push(`Mã SV "${row.maSV}" đã tồn tại, bỏ qua`);
      } else {
        STORE.push({ ...row, id: String(_nextId++), soAnhKhuonMat: 0 });
        imported++;
      }
    }
    return { imported, errors };
  },
};
