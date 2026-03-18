import type { IRoomService, CameraOption } from './room.service';
import type { PhongHoc, CreatePhongHocDto, UpdatePhongHocDto, RoomFilter } from '../types';
import type { PaginatedResult } from '@/shared/types';

// Data mock từ data.ts
const MOCK_CAMERA: CameraOption[] = [
  { id: '1', tenCamera: 'Camera FIT.P11', ipAddress: '192.168.1.101' },
  { id: '2', tenCamera: 'Camera FIT.P23', ipAddress: '192.168.1.102' },
  { id: '3', tenCamera: 'Camera A.201', ipAddress: '192.168.1.103' },
  { id: '4', tenCamera: 'Camera A.301', ipAddress: '192.168.1.104' },
  { id: '5', tenCamera: 'Camera A.401', ipAddress: '192.168.1.105' },
];

let STORE: PhongHoc[] = [
  { id: '1', maPhong: 'FIT.P11', tenPhong: 'KGĐ FITHOU-FIT.P11', toaNha: 'FITHOU', tang: 1, sucChua: 60, cameraId: '1' },
  { id: '2', maPhong: 'FIT.P23', tenPhong: 'KGĐ FITHOU-FIT.P23', toaNha: 'FITHOU', tang: 2, sucChua: 80, cameraId: '2' },
  { id: '3', maPhong: 'FIT.P31', tenPhong: 'KGĐ FITHOU-FIT.P31', toaNha: 'FITHOU', tang: 3, sucChua: 50 },
  { id: '4', maPhong: 'A.201', tenPhong: 'Nhà A - Phòng 201', toaNha: 'Nhà A', tang: 2, sucChua: 100, cameraId: '3' },
  { id: '5', maPhong: 'A.301', tenPhong: 'Nhà A - Phòng 301', toaNha: 'Nhà A', tang: 3, sucChua: 120 },
];

let _nextId = 6;
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const roomMock: IRoomService = {
  async list({ search = '', toaNha = '', page = 1, perPage = 10 }: RoomFilter): Promise<PaginatedResult<PhongHoc>> {
    await delay();

    const filtered = STORE.filter((p) => {
      const matchSearch = !search ||
        p.tenPhong.toLowerCase().includes(search.toLowerCase()) ||
        p.maPhong.toLowerCase().includes(search.toLowerCase());
      const matchToaNha = !toaNha || p.toaNha === toaNha;
      return matchSearch && matchToaNha;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * perPage, safePage * perPage);

    return { data, total, page: safePage, perPage, totalPages };
  },

  async create(dto: CreatePhongHocDto): Promise<PhongHoc> {
    await delay(400);
    // Validate trùng
    if (STORE.some((p) => p.maPhong === dto.maPhong)) {
      throw new Error(`Mã phòng "${dto.maPhong}" đã tồn tại`);
    }

    const newRoom: PhongHoc = { ...dto, id: String(_nextId++) };
    STORE.push(newRoom);
    return { ...newRoom };
  },

  async update(id: string, dto: UpdatePhongHocDto): Promise<PhongHoc> {
    await delay(400);
    const idx = STORE.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Phòng học id=${id} không tồn tại`);

    if (dto.maPhong && dto.maPhong !== STORE[idx].maPhong) {
       if (STORE.some((p) => p.maPhong === dto.maPhong)) {
         throw new Error(`Mã phòng "${dto.maPhong}" đã tồn tại`);
       }
    }

    STORE[idx] = { ...STORE[idx], ...dto };
    return { ...STORE[idx] };
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const idx = STORE.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Phòng học id=${id} không tồn tại`);
    STORE.splice(idx, 1);
  },

  async getToaNhaOptions(): Promise<string[]> {
    await delay(100);
    return [...new Set(STORE.map((p) => p.toaNha))].sort();
  },

  async getAvailableCameras(): Promise<CameraOption[]> {
    await delay(200);
    // Tìm các camera chưa được gán cho phòng nào
    const usedCamIds = new Set(STORE.map(p => p.cameraId).filter(Boolean));
    return MOCK_CAMERA.filter(c => !usedCamIds.has(c.id));
  },
};
