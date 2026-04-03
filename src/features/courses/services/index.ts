import { createService } from '@/shared/services/service-provider';
import { courseMock } from './course.mock';
import { courseApi } from './course.api';

export const courseService = createService(courseMock, courseApi);