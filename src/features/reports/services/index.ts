import { createService } from '@/shared/services/service-provider';
import { reportMock } from './report.mock';
import { reportApi } from './report.api';

export const reportService = createService(reportMock, reportApi);
