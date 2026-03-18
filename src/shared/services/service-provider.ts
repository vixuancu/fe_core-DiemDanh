import { config } from '../config/env';

/**
 * Service provider factory
 *
 * Đọc VITE_DATA_SOURCE từ env và trả về adapter tương ứng.
 *
 * Cách dùng:
 *   const studentService = createService(studentMock, studentApi);
 *
 * Để chuyển sang API thật:
 *   1. Đổi .env  →  VITE_DATA_SOURCE=api
 *   2. Viết student.api.ts implement IStudentService
 *   3. Không cần sửa gì ở UI
 */
export function createService<T>(mockImpl: T, apiImpl: T): T {
  return config.dataSource === 'api' ? apiImpl : mockImpl;
}
