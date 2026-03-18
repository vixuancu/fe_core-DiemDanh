import { createService } from '@/shared/services/service-provider';
import { studentMock } from './student.mock';
import { studentApi } from './student.api';

/** Singleton service — tự chọn mock/api từ VITE_DATA_SOURCE */
export const studentService = createService(studentMock, studentApi);
