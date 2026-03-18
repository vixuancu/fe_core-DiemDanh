import { createService } from '@/shared/services/service-provider';
import { roomMock } from './room.mock';
import { roomApi } from './room.api';

export const roomService = createService(roomMock, roomApi);
