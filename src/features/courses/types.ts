import type { BaseEntity, BaseFilter, BaseResponse } from '@/shared/types';

export interface Course extends BaseEntity {
  courseName: string;
  isCancel?: boolean;
}

export interface CourseFilter extends BaseFilter {
  search?: string;
  isCancel?: boolean;
}

export interface CourseCreateRequest {
  course_name: string;
}

export interface CourseUpdateRequest {
  course_name?: string;
  is_cancel?: boolean;
}

export interface CourseResponse extends BaseResponse {
  course_name: string;
  is_cancel?: boolean;
}