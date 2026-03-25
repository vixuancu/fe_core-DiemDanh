import { createService } from '@/shared/services/service-provider';
import { classroomMock } from './services/classroom.mock';
import { classroomApi } from './services/classroom.api';
import { IClassroomService } from './services/classroom.service';

export const classroomService = createService<IClassroomService>(classroomMock, classroomApi);
