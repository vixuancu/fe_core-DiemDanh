import type { IStudentService } from './student.service';
import type {
  CreateSinhVienDto,
  LopHanhChinhOption,
  PaginatedResult,
  SinhVien,
  StudentFaceItem,
  StudentFilter,
  StudentImportResult,
  StudentStats,
  UpdateSinhVienDto,
} from '../types';

const CLASS_OPTIONS: LopHanhChinhOption[] = [
  { id: '1', name: 'K23-7E1062' },
  { id: '2', name: 'K23-7E1061' },
  { id: '3', name: 'K24-7E1011' },
];

let STORE: SinhVien[] = [
  {
    id: '1',
    maSV: '22A1001D0043',
    hoTen: 'Vi Xuân Cử',
    ngaySinh: '2004-01-12',
    gioiTinh: true,
    lopHanhChinhId: '1',
    lopHanhChinh: 'K23-7E1062',
    trangThai: 'active',
    soAnhKhuonMat: 1,
  },
  {
    id: '2',
    maSV: '22A1001D0044',
    hoTen: 'Nguyễn Văn An',
    ngaySinh: '2004-03-05',
    gioiTinh: true,
    lopHanhChinhId: '1',
    lopHanhChinh: 'K23-7E1062',
    trangThai: 'active',
    soAnhKhuonMat: 0,
  },
  {
    id: '3',
    maSV: '22A1001D0045',
    hoTen: 'Trần Thị Bình',
    ngaySinh: '2004-09-21',
    gioiTinh: false,
    lopHanhChinhId: '2',
    lopHanhChinh: 'K23-7E1061',
    trangThai: 'locked',
    soAnhKhuonMat: 2,
  },
];

const FACE_STORE: Record<string, StudentFaceItem[]> = {
  '1': [
    {
      id: '1',
      imageUrl: 'https://example.com/faces/1-1.jpg',
      createdAt: new Date().toISOString(),
    },
  ],
  '2': [],
  '3': [
    {
      id: '2',
      imageUrl: 'https://example.com/faces/3-1.jpg',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      imageUrl: 'https://example.com/faces/3-2.jpg',
      createdAt: new Date().toISOString(),
    },
  ],
};

let nextId = 4;
let nextFaceId = 4;
const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function toViewModel(item: SinhVien): SinhVien {
  return {
    ...item,
    soAnhKhuonMat: FACE_STORE[item.id]?.length ?? 0,
  };
}

function ensureStudent(id: string): SinhVien {
  const found = STORE.find((item) => item.id === id);
  if (!found) throw new Error(`Sinh viên id=${id} không tồn tại`);
  return found;
}

function resolveClass(id: string): LopHanhChinhOption | undefined {
  return CLASS_OPTIONS.find((item) => item.id === id);
}

export const studentMock: IStudentService = {
  async list({ search = '', lopHanhChinhId = '', trangThai = '', page = 1, perPage = 10 }: StudentFilter): Promise<PaginatedResult<SinhVien>> {
    await delay();
    const keyword = search.trim().toLowerCase();

    const filtered = STORE.filter((item) => {
      const matchSearch = !keyword
        || item.hoTen.toLowerCase().includes(keyword)
        || item.maSV.toLowerCase().includes(keyword);
      const matchClass = !lopHanhChinhId || item.lopHanhChinhId === lopHanhChinhId;
      const matchStatus = !trangThai || item.trangThai === trangThai;
      return matchSearch && matchClass && matchStatus;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = filtered.slice((safePage - 1) * perPage, safePage * perPage).map(toViewModel);

    return { data, total, page: safePage, perPage, totalPages };
  },

  async getById(id: string): Promise<SinhVien> {
    await delay(200);
    const found = ensureStudent(id);
    return toViewModel(found);
  },

  async create(dto: CreateSinhVienDto): Promise<SinhVien> {
    await delay(400);
    const maSV = dto.maSV.trim();
    if (STORE.some((item) => item.maSV === maSV)) {
      throw new Error(`Mã sinh viên '${maSV}' đã tồn tại`);
    }

    const classInfo = resolveClass(dto.lopHanhChinhId);
    if (!classInfo) {
      throw new Error('Lớp hành chính không hợp lệ');
    }

    const created: SinhVien = {
      id: String(nextId++),
      maSV,
      hoTen: dto.hoTen,
      ngaySinh: dto.ngaySinh || '',
      gioiTinh: dto.gioiTinh ?? null,
      lopHanhChinhId: dto.lopHanhChinhId,
      lopHanhChinh: classInfo.name,
      trangThai: 'active',
      soAnhKhuonMat: 0,
    };

    STORE = [created, ...STORE];
    FACE_STORE[created.id] = [];
    return toViewModel(created);
  },

  async update(id: string, dto: UpdateSinhVienDto): Promise<SinhVien> {
    await delay(400);
    const index = STORE.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Sinh viên id=${id} không tồn tại`);

    if (dto.maSV && STORE.some((item, i) => i !== index && item.maSV === dto.maSV)) {
      throw new Error(`Mã sinh viên '${dto.maSV}' đã tồn tại`);
    }

    let lopHanhChinh = STORE[index].lopHanhChinh;
    if (dto.lopHanhChinhId) {
      const classInfo = resolveClass(dto.lopHanhChinhId);
      if (!classInfo) {
        throw new Error('Lớp hành chính không hợp lệ');
      }
      lopHanhChinh = classInfo.name;
    }

    const next: SinhVien = {
      ...STORE[index],
      ...(dto.maSV !== undefined ? { maSV: dto.maSV } : {}),
      ...(dto.hoTen !== undefined ? { hoTen: dto.hoTen } : {}),
      ...(dto.ngaySinh !== undefined ? { ngaySinh: dto.ngaySinh } : {}),
      ...(dto.gioiTinh !== undefined ? { gioiTinh: dto.gioiTinh } : {}),
      ...(dto.lopHanhChinhId !== undefined
        ? { lopHanhChinhId: dto.lopHanhChinhId, lopHanhChinh }
        : {}),
      ...(dto.trangThai !== undefined ? { trangThai: dto.trangThai } : {}),
    };

    STORE[index] = next;
    return toViewModel(next);
  },

  async delete(id: string): Promise<void> {
    await delay(250);
    const index = STORE.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Sinh viên id=${id} không tồn tại`);
    STORE.splice(index, 1);
    delete FACE_STORE[id];
  },

  async getLopOptions(): Promise<LopHanhChinhOption[]> {
    await delay(150);
    return [...CLASS_OPTIONS];
  },

  async getStats(filter: Pick<StudentFilter, 'search' | 'lopHanhChinhId'>): Promise<StudentStats> {
    await delay(120);
    const keyword = (filter.search || '').trim().toLowerCase();
    const filtered = STORE.filter((item) => {
      const matchSearch = !keyword
        || item.hoTen.toLowerCase().includes(keyword)
        || item.maSV.toLowerCase().includes(keyword);
      const matchClass = !filter.lopHanhChinhId || item.lopHanhChinhId === filter.lopHanhChinhId;
      return matchSearch && matchClass;
    });

    return {
      total: filtered.length,
      active: filtered.filter((item) => item.trangThai === 'active').length,
      locked: filtered.filter((item) => item.trangThai === 'locked').length,
    };
  },

  async importFromExcel(file: File): Promise<StudentImportResult> {
    await delay(400);

    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx')) {
      throw new Error('Mock chỉ hỗ trợ file .xlsx');
    }

    return {
      totalRows: 0,
      importedCount: 0,
      failedCount: 0,
      errors: [],
    };
  },

  async downloadImportTemplate(): Promise<Blob> {
    await delay(100);
    const content = 'Mã sinh viên,Họ và tên,Ngày sinh,Giới tính,Lớp hành chính\n';
    return new Blob([content], { type: 'text/csv;charset=utf-8;' });
  },

  async listFaces(studentId: string): Promise<StudentFaceItem[]> {
    await delay(150);
    ensureStudent(studentId);
    return [...(FACE_STORE[studentId] ?? [])];
  },

  async addFace(studentId: string, imageUrl: string): Promise<StudentFaceItem> {
    await delay(250);
    ensureStudent(studentId);
    const normalizedUrl = imageUrl.trim();
    const isHttpUrl = normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://');
    const isImageDataUrl = normalizedUrl.startsWith('data:image/');
    if (!isHttpUrl && !isImageDataUrl) {
      throw new Error('Dữ liệu ảnh không hợp lệ');
    }

    const faces = FACE_STORE[studentId] ?? [];
    if (faces.some((item) => item.imageUrl === normalizedUrl)) {
      throw new Error('URL ảnh khuôn mặt đã tồn tại');
    }

    const created: StudentFaceItem = {
      id: String(nextFaceId++),
      imageUrl: normalizedUrl,
      createdAt: new Date().toISOString(),
    };
    FACE_STORE[studentId] = [created, ...faces];
    return created;
  },

  async deleteFace(studentId: string, faceId: string): Promise<void> {
    await delay(200);
    ensureStudent(studentId);
    const faces = FACE_STORE[studentId] ?? [];
    const index = faces.findIndex((item) => item.id === faceId);
    if (index === -1) throw new Error(`Ảnh khuôn mặt id=${faceId} không tồn tại`);
    faces.splice(index, 1);
    FACE_STORE[studentId] = faces;
  },
};
