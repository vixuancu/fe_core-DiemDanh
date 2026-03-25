import { forceLogout } from '@/features/auth/session';
import { ERROR_MESSAGES } from '../constant/error-code.constant'

export interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    message?: string;
    error_code?: string;
}

export interface ApiListEnvelope<T> extends ApiEnvelope<T[]> {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

function translateError(payload: any): string {
    const rawError = payload.error_code || payload.message;
    if (!rawError) return 'Có lỗi xảy ra từ máy chủ';

    return ERROR_MESSAGES[rawError] || rawError;
}

export async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
    const payload = (await res.json().catch(() => ({}))) as Partial<ApiEnvelope<T>>;
    if (res.status === 401) {
        forceLogout();
        throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
    if (!res.ok || !payload.success) {
        throw new ApiError(translateError(payload), res.status);
    }
    return payload as ApiEnvelope<T>;
}

export async function parseListEnvelope<T>(res: Response): Promise<ApiListEnvelope<T>> {
    const payload = (await res.json().catch(() => ({}))) as Partial<ApiListEnvelope<T>>;
    if (res.status === 401) {
        forceLogout();
        throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
    if (!res.ok || !payload.success) {
        throw new ApiError(translateError(payload), res.status);
    }
    return payload as ApiListEnvelope<T>;
}