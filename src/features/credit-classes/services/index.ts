import { createService } from '@/shared/services/service-provider';
import { creditClassMock } from './credit-class.mock';
import { creditClassApi } from './credit-class.api';

export const creditClassService = createService(creditClassMock, creditClassApi);
