import type {
  AdministrativeClassFilter,
  AdministrativeClassItem,
  AdministrativeClassPage,
  AdministrativeClassStats,
  CreateAdministrativeClassDto,
  UpdateAdministrativeClassDto,
} from '../types';
import type { IAdministrativeClassService } from './administrative-class.service';

const delay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let STORE: AdministrativeClassItem[] = [
  { id: '1', name: '2210A01', studentCount: 42, status: 'active' },
  { id: '2', name: '2210A02', studentCount: 38, status: 'active' },
  { id: '3', name: '2210A03', studentCount: 35, status: 'locked' },
];

let nextId = 4;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export const administrativeClassMock: IAdministrativeClassService = {
  async list(filter: AdministrativeClassFilter): Promise<AdministrativeClassPage> {
    await delay();
    const keyword = normalize(filter.search || '');
    const filtered = STORE.filter((item) => {
      const matchSearch = !keyword || item.name.toLowerCase().includes(keyword);
      const matchStatus = !filter.status || item.status === filter.status;
      return matchSearch && matchStatus;
    });

    const perPage = filter.perPage ?? 10;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(1, filter.page ?? 1), totalPages);
    const start = (page - 1) * perPage;

    return {
      data: filtered.slice(start, start + perPage),
      total,
      page,
      perPage,
      totalPages,
    };
  },

  async getById(id: string): Promise<AdministrativeClassItem> {
    await delay(120);
    const found = STORE.find((item) => item.id === id);
    if (!found) throw new Error('Lớp hành chính không tồn tại');
    return found;
  },

  async create(dto: CreateAdministrativeClassDto): Promise<AdministrativeClassItem> {
    await delay(200);
    const name = dto.name.trim();
    if (!name) throw new Error('Tên lớp hành chính không được để trống');
    if (STORE.some((item) => normalize(item.name) === normalize(name))) {
      throw new Error(`Lớp hành chính với name '${name}' đã tồn tại`);
    }
    const created: AdministrativeClassItem = {
      id: String(nextId++),
      name,
      studentCount: 0,
      status: 'active',
    };
    STORE = [created, ...STORE];
    return created;
  },

  async update(id: string, dto: UpdateAdministrativeClassDto): Promise<AdministrativeClassItem> {
    await delay(200);
    const index = STORE.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Lớp hành chính không tồn tại');
    const name = dto.name.trim();
    if (!name) throw new Error('Tên lớp hành chính không được để trống');
    if (STORE.some((item, i) => i !== index && normalize(item.name) === normalize(name))) {
      throw new Error(`Lớp hành chính với name '${name}' đã tồn tại`);
    }
    STORE[index] = { ...STORE[index], name };
    return STORE[index];
  },

  async lock(id: string): Promise<AdministrativeClassItem> {
    await delay(180);
    const index = STORE.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Lớp hành chính không tồn tại');
    STORE[index] = { ...STORE[index], status: 'locked' };
    return STORE[index];
  },

  async unlock(id: string): Promise<AdministrativeClassItem> {
    await delay(180);
    const index = STORE.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Lớp hành chính không tồn tại');
    STORE[index] = { ...STORE[index], status: 'active' };
    return STORE[index];
  },

  async hardDelete(id: string): Promise<void> {
    await delay(180);
    const index = STORE.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Lớp hành chính không tồn tại');
    if (STORE[index].studentCount > 0) {
      throw new Error('Không thể xóa hẳn lớp hành chính đang có sinh viên');
    }
    STORE.splice(index, 1);
  },

  async getStats(filter: Pick<AdministrativeClassFilter, 'search'>): Promise<AdministrativeClassStats> {
    await delay(120);
    const keyword = normalize(filter.search || '');
    const filtered = STORE.filter((item) => !keyword || item.name.toLowerCase().includes(keyword));
    return {
      total: filtered.length,
      active: filtered.filter((item) => item.status === 'active').length,
      locked: filtered.filter((item) => item.status === 'locked').length,
    };
  },
};
