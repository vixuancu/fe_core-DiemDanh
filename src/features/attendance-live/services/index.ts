import { createService } from '@/shared/services/service-provider';
import type { IAttendanceLiveService } from './attendance-live.service';
import { attendanceLiveApi } from './attendance-live.api';
import { attendanceLiveMock } from './attendance-live.mock';

export const attendanceLiveService = createService<IAttendanceLiveService>(
  attendanceLiveMock,
  attendanceLiveApi,
);
