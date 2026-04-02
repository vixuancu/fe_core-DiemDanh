import type { PaginatedResult } from '@/shared/types';
import type { Course, CourseCreateRequest, CourseFilter, CourseUpdateRequest } from '../types';
import type { ICourseService } from './course.service';

let STORE: Course[] = [
  { id: 14, courseName: 'Hệ quản trị CSDL', createdAt: '01/04/2026 23:29:49', updatedAt: '01/04/2026 23:29:49' },
  { id: 12, courseName: 'Phân tích và thiết kế hệ thống TT', createdAt: '01/04/2026 23:29:40', updatedAt: '01/04/2026 23:29:40' },
  { id: 11, courseName: 'An ninh và bảo mật dữ liệu', createdAt: '01/04/2026 23:29:34', updatedAt: '01/04/2026 23:29:34' },
  { id: 10, courseName: 'Lập trình trên thiết bị di động', createdAt: '01/04/2026 23:28:36', updatedAt: '01/04/2026 23:28:36' },
  { id: 9, courseName: 'Lập trình Web', createdAt: '01/04/2026 23:28:27', updatedAt: '01/04/2026 23:28:27' },
  { id: 8, courseName: 'Lập trình hướng sự kiện', createdAt: '01/04/2026 23:28:18', updatedAt: '01/04/2026 23:28:18' },
  { id: 7, courseName: 'Lập trình hướng đối tượng', createdAt: '01/04/2026 23:28:09', updatedAt: '01/04/2026 23:28:09' },
  { id: 6, courseName: 'Lập trình cơ sở', createdAt: '01/04/2026 23:27:55', updatedAt: '01/04/2026 23:27:55' },
  { id: 5, courseName: 'Tiếng Anh chuyên ngành', createdAt: '01/04/2026 23:27:31', updatedAt: '01/04/2026 23:27:31' },
  { id: 4, courseName: 'Tiếng Anh cơ bản 3', createdAt: '01/04/2026 23:27:16', updatedAt: '01/04/2026 23:27:16' },
  { id: 3, courseName: 'Toán rời rạc', createdAt: '01/04/2026 23:27:01', updatedAt: '01/04/2026 23:27:01' },
  { id: 2, courseName: 'Giải tích 2', createdAt: '01/04/2026 23:26:42', updatedAt: '01/04/2026 23:26:42' },
];

let nextId = 15;

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const courseMock: ICourseService = {
  async getCourses(filter: CourseFilter): Promise<PaginatedResult<Course>> {
    await delay();

    const search = filter.search?.trim().toLowerCase() ?? '';
    const filtered = STORE.filter((course) => !search || course.courseName.toLowerCase().includes(search));

    const total = filtered.length;
    const perPage = filter.pageSize ?? 10;
    const page = filter.page ?? 1;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);

    return {
      data: filtered.slice((safePage - 1) * perPage, safePage * perPage),
      total,
      page: safePage,
      perPage,
      totalPages,
    };
  },

  async create(request: CourseCreateRequest) {
    await delay();
    const courseName = request.course_name.trim();
    if (STORE.some((course) => course.courseName.toLowerCase() === courseName.toLowerCase())) {
      throw new Error(`Tên học phần "${courseName}" đã tồn tại`);
    }

    const now = new Date().toLocaleString('vi-VN');
    const course: Course = {
      id: nextId++,
      courseName,
      createdAt: now,
      updatedAt: now,
    };
    STORE = [course, ...STORE];
    return { success: true, data: course, message: 'Success' };
  },

  async update(id: number, request: CourseUpdateRequest) {
    await delay();
    const index = STORE.findIndex((course) => course.id === id);
    if (index === -1) throw new Error(`Học phần id=${id} không tồn tại`);

    const nextName = request.course_name?.trim();
    if (nextName && STORE.some((course) => course.id !== id && course.courseName.toLowerCase() === nextName.toLowerCase())) {
      throw new Error(`Tên học phần "${nextName}" đã tồn tại`);
    }

    STORE[index] = {
      ...STORE[index],
      ...(nextName ? { courseName: nextName } : {}),
      ...(typeof request.is_cancel === 'boolean' ? { isCancel: request.is_cancel } : {}),
      updatedAt: new Date().toLocaleString('vi-VN'),
    };

    return { ...STORE[index] };
  },

  async delete(id: number): Promise<void> {
    await delay();
    const index = STORE.findIndex((course) => course.id === id);
    if (index === -1) throw new Error(`Học phần id=${id} không tồn tại`);
    STORE.splice(index, 1);
  },
};