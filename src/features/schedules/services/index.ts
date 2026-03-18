import { createService } from '@/shared/services/service-provider';
import { scheduleMock } from './schedule.mock';
import { scheduleApi } from './schedule.api';

export const scheduleService = createService(scheduleMock, scheduleApi);
