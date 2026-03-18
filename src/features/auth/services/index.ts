import { createService } from '@/shared/services/service-provider';
import { authMock } from './auth.mock';
import { authApi } from './auth.api';

/** Singleton service — tự chọn mock/api dựa vào VITE_DATA_SOURCE */
export const authService = createService(authMock, authApi);
