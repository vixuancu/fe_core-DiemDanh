import { createService } from '@/shared/services/service-provider';
import type { IAttendanceWebcamService } from './attendance-webcam.service';
import { attendanceWebcamApi } from './attendance-webcam.api';
import { attendanceWebcamMock } from './attendance-webcam.mock';

export const attendanceWebcamService = createService<IAttendanceWebcamService>(
  attendanceWebcamMock,
  attendanceWebcamApi,
);
