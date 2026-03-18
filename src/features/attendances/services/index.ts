import { createService } from '@/shared/services/service-provider';
import { attendanceMock } from './attendance.mock';
import { attendanceApi } from './attendance.api';

export const attendanceService = createService(attendanceMock, attendanceApi);
