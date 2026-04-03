import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/shared/lib/notify';
import type { CourseCreateRequest, CourseFilter, CourseUpdateRequest } from '../types';
import { courseService } from '../services';

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filter: CourseFilter) => [...courseKeys.lists(), filter] as const,
};

export function useCourses(filter: CourseFilter) {
  return useQuery({
    queryKey: courseKeys.list(filter),
    queryFn: () => courseService.getCourses(filter),
    retry: false,
    staleTime: 0,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CourseCreateRequest) => courseService.create(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.all, exact: false });
      notify.success('Thêm học phần thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thêm học phần thất bại';
      notify.error(message);
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: CourseUpdateRequest }) => courseService.update(id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.all, exact: false });
      notify.success('Cập nhật học phần thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật học phần thất bại';
      notify.error(message);
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => courseService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.all, exact: false });
      notify.success('Xóa học phần thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Xóa học phần thất bại';
      notify.error(message);
    },
  });
}