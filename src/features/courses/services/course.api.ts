import { config } from '@/shared/config/env';
import { formatDateTime } from '@/shared/util/format';
import type { PaginatedResult } from '@/shared/types';
import { getAuthHeaders } from '@/features/auth/session';
import { parseEnvelope, parseListEnvelope, type ApiEnvelope } from '@/shared/model/api-error.model';
import type { Course, CourseCreateRequest, CourseFilter, CourseResponse, CourseUpdateRequest } from '../types';
import type { ICourseService } from './course.service';

const API_URL = `${config.apiBaseUrl}/courses`;

function mapCourse(item: CourseResponse): Course {
  return {
    id: Number(item.id),
    courseName: item.course_name?.trim(),
    isCancel: item.is_cancel,
    createdAt: formatDateTime(item.created_at),
    updatedAt: formatDateTime(item.updated_at),
  };
}

export const courseApi: ICourseService = {
  async getCourses(filter: CourseFilter): Promise<PaginatedResult<Course>> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (typeof filter.isCancel === 'boolean') params.set('is_cancel', String(filter.isCancel));
    params.set('page', String(filter.page ?? 1));
    params.set('page_size', String(filter.pageSize ?? 10));

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseListEnvelope<CourseResponse>(res);
    return {
      data: payload.data.map(mapCourse),
      total: payload.total,
      page: payload.page,
      perPage: payload.page_size,
      totalPages: payload.total_pages,
    };
  },

  async create(request: CourseCreateRequest): Promise<ApiEnvelope<Course>> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request),
    });
    const payload = await parseEnvelope<CourseResponse>(res);
    return {
      ...payload,
      data: mapCourse(payload.data),
    };
  },

  async update(id: number, request: CourseUpdateRequest): Promise<Course> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request),
    });
    const payload = await parseEnvelope<CourseResponse>(res);
    return mapCourse(payload.data);
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await parseEnvelope<CourseResponse>(res);
  },
};