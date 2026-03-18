import { createService } from '@/shared/services/service-provider';
import type { IAccountService } from './account.service';
import { accountMock } from './account.mock';
import { accountApi } from './account.api';

export const accountService = createService<IAccountService>(accountMock, accountApi);
