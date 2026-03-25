import { config } from '@/shared/config/env';
import { forceLogout, getAccessToken } from '@/features/auth/session';
import type {
  AdministrativeClassFilter,
  AdministrativeClassItem,
  AdministrativeClassPage,
  AdministrativeClassStats,
  CreateAdministrativeClassDto,
  UpdateAdministrativeClassDto,
} from '../types';
import type { IAdministrativeClassService } from './administrative-class.service';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiListEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface BackendAdministrativeClass {
  id: number;
  name: string;
  student_count: number;
  is_cancel: boolean;
}

interface BackendAdministrativeClassStats {
  total: number;
  active_count: number;
  locked_count: number;
}

const API_URL = `${config.apiBaseUrl}/administrative-classes`;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAccessToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const payload = (await res.json().catch(() => ({}))) as Partial<ApiEnvelope<T>>;
  if (res.status === 401) {
    forceLogout();
    throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }
  if (!res.ok || !payload.success) {
    throw new ApiError(payload.message || 'Có lỗi xảy ra từ máy chủ', res.status);
  }
  return payload as ApiEnvelope<T>;
}

async function parseListEnvelope<T>(res: Response): Promise<ApiListEnvelope<T>> {
  const payload = (await res.json().catch(() => ({}))) as Partial<ApiListEnvelope<T>>;
  if (res.status === 401) {
    forceLogout();
    throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }
  if (!res.ok || !payload.success) {
    throw new ApiError(payload.message || 'Có lỗi xảy ra từ máy chủ', res.status);
  }
  return payload as ApiListEnvelope<T>;
}

function mapItem(item: BackendAdministrativeClass): AdministrativeClassItem {
  return {
    id: String(item.id),
    name: item.name,
    studentCount: item.student_count,
    status: item.is_cancel ? 'locked' : 'active',
  };
}

function mapStats(item: BackendAdministrativeClassStats): AdministrativeClassStats {
  return {
    total: item.total,
    active: item.active_count,
    locked: item.locked_count,
  };
}

export const administrativeClassApi: IAdministrativeClassService = {
  async list(filter: AdministrativeClassFilter): Promise<AdministrativeClassPage> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (filter.status) params.set('is_cancel', String(filter.status === 'locked'));
    params.set('page', String(filter.page ?? 1));
    params.set('page_size', String(filter.perPage ?? 10));

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseListEnvelope<BackendAdministrativeClass>(res);
    return {
      data: payload.data.map(mapItem),
      total: payload.total,
      page: payload.page,
      perPage: payload.page_size,
      totalPages: payload.total_pages,
    };
  },

  async getById(id: string): Promise<AdministrativeClassItem> {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<BackendAdministrativeClass>(res);
    return mapItem(payload.data);
  },

  async create(dto: CreateAdministrativeClassDto): Promise<AdministrativeClassItem> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name: dto.name }),
    });
    const payload = await parseEnvelope<BackendAdministrativeClass>(res);
    return mapItem(payload.data);
  },

  async update(id: string, dto: UpdateAdministrativeClassDto): Promise<AdministrativeClassItem> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name: dto.name }),
    });
    const payload = await parseEnvelope<BackendAdministrativeClass>(res);
    return mapItem(payload.data);
  },

  async lock(id: string): Promise<AdministrativeClassItem> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<BackendAdministrativeClass>(res);
    return mapItem(payload.data);
  },

  async unlock(id: string): Promise<AdministrativeClassItem> {
    const res = await fetch(`${API_URL}/${id}/unlock`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<BackendAdministrativeClass>(res);
    return mapItem(payload.data);
  },

  async hardDelete(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/${id}/hard`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await parseEnvelope<null>(res);
  },

  async getStats(filter: Pick<AdministrativeClassFilter, 'search'>): Promise<AdministrativeClassStats> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    const query = params.toString();

    const res = await fetch(`${API_URL}/stats${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<BackendAdministrativeClassStats>(res);
    return mapStats(payload.data);
  },
};
