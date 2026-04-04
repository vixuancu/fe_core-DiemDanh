import { createService } from '@/shared/services/service-provider';
import { scheduleMock } from './schedule.mock';
import { scheduleApi } from './schedule.api';

const forceScheduleMock = import.meta.env.VITE_FORCE_SCHEDULE_MOCK === 'true';

export const scheduleService = forceScheduleMock
  ? scheduleMock
  : createService(scheduleMock, scheduleApi);
