/**
 * Typed env config - đọc từ import.meta.env (Vite)
 *
 * Cách dùng:
 *   import { config } from '@/shared/config/env';
 *   if (config.dataSource === 'api') { ... }
 */
export const config = {
  /** 'mock' | 'api' — đặt trong .env: VITE_DATA_SOURCE=mock */
  dataSource: (import.meta.env.VITE_DATA_SOURCE || 'mock') as 'mock' | 'api',

  /** Base URL của backend API */
  // adsa
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
} as const;
