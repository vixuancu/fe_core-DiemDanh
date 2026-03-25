import { config } from '@/shared/config/env';
import type { AccountRoleOption, IAccountService } from './account.service';
import type { Account, AccountFilter, CreateAccountDto, UpdateAccountDto } from '../types';
import type { PaginatedResult } from '@/shared/types';
import { forceLogout, getAccessToken } from '@/features/auth/session';
import { toDateInputValue } from '@/shared/lib/date-time';

const API_URL = `${config.apiBaseUrl}/accounts`;

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

interface BackendAccount {
    id: number;
    username: string;
    full_name?: string | null;
    email: string;
    gender?: boolean | null;
    birth_of_date?: string | null;
    role_id: number;
    role_name?: string | null;
    is_cancel: boolean;
}

interface BackendRole {
    id: number;
    role_name: string;
}

class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

function toAscii(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[^\u0000-\u007E]/g, '')
        .toLowerCase();
}

function normalizeRole(roleName?: string | null): Account['role'] {
    const raw = toAscii((roleName || '').trim());
    if (raw === 'admin') return 'admin';
    if (raw === 'giao_vu' || raw === 'giao vu') return 'giao_vu';
    if (raw === 'giang_vien' || raw === 'giang vien') return 'giang_vien';
    return 'giao_vu';
}

function roleLabel(role: Account['role']): string {
    if (role === 'admin') return 'Quản trị viên';
    if (role === 'giao_vu') return 'Giáo vụ';
    return 'Giảng viên';
}

let roleIdByRole: Partial<Record<Account['role'], number>> = {};

function resolveRoleId(role: Account['role']): number {
    const resolved = roleIdByRole[role];
    if (!resolved) {
        throw new ApiError('Không thể xác định role_id. Vui lòng tải lại trang.', 500);
    }
    return resolved;
}

function mapAccount(item: BackendAccount): Account {
    return {
        id: String(item.id),
        username: item.username,
        hoTen: item.full_name?.trim() || item.username,
        email: item.email,
        gioiTinh: item.gender ?? null,
        ngaySinh: toDateInputValue(item.birth_of_date),
        role: normalizeRole(item.role_name),
        trangThai: item.is_cancel ? 'locked' : 'active',
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

function getAuthHeaders(extra?: HeadersInit): HeadersInit {
    const token = getAccessToken();
    return {
        ...(extra || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export const accountApi: IAccountService = {
    async list(filter: AccountFilter): Promise<PaginatedResult<Account>> {
        const params = new URLSearchParams();
        if (filter.search) params.set('search', filter.search);
        if (filter.role) params.set('role_name', filter.role);
        if (filter.trangThai) params.set('is_cancel', String(filter.trangThai === 'locked'));
        params.set('page', String(filter.page ?? 1));
        params.set('page_size', String(filter.perPage ?? 10));

        const res = await fetch(`${API_URL}?${params.toString()}`, {
            headers: getAuthHeaders(),
        });
        const payload = await parseListEnvelope<BackendAccount>(res);
        const data = payload.data.map(mapAccount);

        return {
            data,
            total: payload.total,
            page: payload.page,
            perPage: payload.page_size,
            totalPages: payload.total_pages,
        };
    },

    async getStats() {
        const pageSize = 100;
        let currentPage = 1;
        let totalPages = 1;
        const all: Account[] = [];

        while (currentPage <= totalPages) {
            const params = new URLSearchParams({
                page: String(currentPage),
                page_size: String(pageSize),
            });
            const res = await fetch(`${API_URL}?${params.toString()}`, {
                headers: getAuthHeaders(),
            });
            const payload = await parseListEnvelope<BackendAccount>(res);
            all.push(...payload.data.map(mapAccount));
            totalPages = payload.total_pages;
            currentPage += 1;
        }

        return {
            total: all.length,
            giaoVu: all.filter((t) => t.role === 'giao_vu').length,
            giangVien: all.filter((t) => t.role === 'giang_vien').length,
            active: all.filter((t) => t.trangThai === 'active').length,
            locked: all.filter((t) => t.trangThai === 'locked').length,
        };
    },

    async create(dto: CreateAccountDto): Promise<Account> {
        const body = {
            username: dto.username,
            email: dto.email,
            password: dto.password,
            full_name: dto.hoTen || null,
            gender: dto.gioiTinh ?? null,
            birth_of_date: dto.ngaySinh ? `${dto.ngaySinh}T00:00:00` : null,
            role_id: roleToRoleId(dto.role),
        };

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        const payload = await parseEnvelope<BackendAccount>(res);
        return mapAccount(payload.data);
    },

    async update(id: string, dto: UpdateAccountDto): Promise<Account> {
        const body: Record<string, unknown> = {
            full_name: dto.hoTen,
            gender: dto.gioiTinh,
            birth_of_date: dto.ngaySinh ? `${dto.ngaySinh}T00:00:00` : dto.ngaySinh === '' ? null : undefined,
            is_cancel: dto.trangThai === undefined ? undefined : dto.trangThai === 'locked',
            role_id: dto.role ? roleToRoleId(dto.role) : undefined,
        };

        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        const payload = await parseEnvelope<BackendAccount>(res);
        return mapAccount(payload.data);
    },

    async delete(id: string): Promise<void> {
        await this.update(id, { trangThai: 'locked' });
    },

    async resetPassword(id: string): Promise<void> {
        const res = await fetch(`${API_URL}/${id}/reset-password`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        });
        await parseEnvelope<null>(res);
    }

    return {
        total: all.length,
        giaoVu: all.filter((t) => t.role === 'giao_vu').length,
        giangVien: all.filter((t) => t.role === 'giang_vien').length,
        active: all.filter((t) => t.trangThai === 'active').length,
        locked: all.filter((t) => t.trangThai === 'locked').length,
    };
},

    async getRoles(): Promise<AccountRoleOption[]> {
        const res = await fetch(`${API_URL}/roles`, {
            headers: getAuthHeaders(),
        });
        const payload = await parseListEnvelope<BackendRole>(res);
        const mapped = payload.data
            .map((item) => {
                const role = normalizeRole(item.role_name);
                return {
                    id: item.id,
                    role,
                    label: roleLabel(role),
                };
            })
            .filter((item, index, arr) => arr.findIndex((r) => r.role === item.role) === index);

        roleIdByRole = mapped.reduce<Partial<Record<Account['role'], number>>>((acc, item) => {
            acc[item.role] = item.id;
            return acc;
        }, {});

        return mapped;
    },

        async create(dto: CreateAccountDto): Promise < Account > {
            if(!roleIdByRole[dto.role]) {
    await this.getRoles();
}

const body = {
    username: dto.username,
    email: dto.email,
    password: dto.password,
    full_name: dto.hoTen || null,
    gender: dto.gioiTinh ?? null,
    birth_of_date: dto.ngaySinh ? `${dto.ngaySinh}T00:00:00` : null,
    role_id: resolveRoleId(dto.role),
};

const res = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
});
const payload = await parseEnvelope<BackendAccount>(res);
return mapAccount(payload.data);
  },

  async update(id: string, dto: UpdateAccountDto): Promise < Account > {
    if(dto.role && !roleIdByRole[dto.role]) {
    await this.getRoles();
}

const body: Record<string, unknown> = {
    full_name: dto.hoTen,
    gender: dto.gioiTinh,
    birth_of_date: dto.ngaySinh ? `${dto.ngaySinh}T00:00:00` : dto.ngaySinh === '' ? null : undefined,
    is_cancel: dto.trangThai === undefined ? undefined : dto.trangThai === 'locked',
    role_id: dto.role ? resolveRoleId(dto.role) : undefined,
};

const res = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
});
const payload = await parseEnvelope<BackendAccount>(res);
return mapAccount(payload.data);
  },

  async delete (id: string): Promise < void> {
    await this.update(id, { trangThai: 'locked' });
},

    async resetPassword(id: string): Promise < void> {
        const res = await fetch(`${API_URL}/${id}/reset-password`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        });
        await parseEnvelope<null> (res);
    }
};
