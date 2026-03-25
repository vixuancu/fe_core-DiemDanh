import { createService } from '@/shared/services/service-provider';
import type { IAdministrativeClassService } from './administrative-class.service';
import { administrativeClassMock } from './administrative-class.mock';
import { administrativeClassApi } from './administrative-class.api';

export const administrativeClassService = createService<IAdministrativeClassService>(
  administrativeClassMock,
  administrativeClassApi
);
