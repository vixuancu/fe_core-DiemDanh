import { createService } from '@/shared/services/service-provider';
import type { ICameraService } from './camera.service';
import { cameraMock } from './camera.mock';
import { cameraApi } from './camera.api';

export const cameraService = createService<ICameraService>(cameraMock, cameraApi);
