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
    errorCode?: string;

    constructor(message: string, status: number, errorCode?: string) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
}

export { ApiError };

function translateError(payload: Partial<ApiEnvelope<unknown>>): string {
    const message = (payload.message || '').trim();
    if (message) return message;

    const errorCode = (payload.error_code || '').trim();
    if (!errorCode) return 'Có lỗi xảy ra từ máy chủ';

    return ERROR_MESSAGES[errorCode] || errorCode;
}

export async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
    const payload = (await res.json().catch(() => ({}))) as Partial<ApiEnvelope<T>>;
    if (res.status === 401) {
        forceLogout();
        throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, payload.error_code);
    }
    if (!res.ok || !payload.success) {
        throw new ApiError(translateError(payload), res.status, payload.error_code);
    }
    return payload as ApiEnvelope<T>;
}

export async function parseListEnvelope<T>(res: Response): Promise<ApiListEnvelope<T>> {
    const payload = (await res.json().catch(() => ({}))) as Partial<ApiListEnvelope<T>>;
    if (res.status === 401) {
        forceLogout();
        throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, payload.error_code);
    }
    if (!res.ok || !payload.success) {
        throw new ApiError(translateError(payload), res.status, payload.error_code);
    }
    return payload as ApiListEnvelope<T>;
}
