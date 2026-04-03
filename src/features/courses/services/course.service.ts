import type { PaginatedResult } from '@/shared/types';
import type { Course, CourseCreateRequest, CourseFilter, CourseUpdateRequest } from '../types';
import type { ApiEnvelope } from '@/shared/model/api-error.model';

export interface ICourseService {
  getCourses(filter: CourseFilter): Promise<PaginatedResult<Course>>;
  create(request: CourseCreateRequest): Promise<ApiEnvelope<Course>>;
  update(id: number, request: CourseUpdateRequest): Promise<Course>;
  delete(id: number): Promise<void>;
}