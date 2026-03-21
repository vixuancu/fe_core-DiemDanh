import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services';
import type { StudentFilter, CreateSinhVienDto, UpdateSinhVienDto } from '../types';
import { notify } from '@/shared/lib/notify';

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Đặt tập trung để invalidate dễ dàng

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filter: StudentFilter) => [...studentKeys.lists(), filter] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
  lopOptions: () => [...studentKeys.all, 'lop-options'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách SV có filter + phân trang
 * UI chỉ cần: const { data, isLoading, error } = useStudents(filter);
 */
export function useStudents(filter: StudentFilter) {
  return useQuery({
    queryKey: studentKeys.list(filter),
    queryFn: () => studentService.list(filter),
    placeholderData: (prev) => prev, // giữ data cũ khi chuyển trang (smooth UX)
  });
}

/** Lấy thông tin 1 sinh viên theo id */
export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
}

/** Lấy danh sách tên lớp cho dropdown filter */
export function useLopOptions() {
  return useQuery({
    queryKey: studentKeys.lopOptions(),
    queryFn: () => studentService.getLopOptions(),
    staleTime: Infinity, // lớp ít thay đổi, cache mãi
  });
}

/** Thêm sinh viên — tự invalidate cache sau khi thêm */
export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSinhVienDto) => studentService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.lopOptions() });
      notify.success('Thêm sinh viên thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thêm sinh viên thất bại';
      notify.error(message);
    },
  });
}

/** Cập nhật sinh viên */
export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSinhVienDto }) =>
      studentService.update(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
      notify.success('Cập nhật sinh viên thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật sinh viên thất bại';
      notify.error(message);
    },
  });
}

/** Xóa sinh viên */
export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      notify.success('Xóa sinh viên thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Xóa sinh viên thất bại';
      notify.error(message);
    },
  });
}

/** Import từ Excel */
export function useImportStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: CreateSinhVienDto[]) => studentService.importFromExcel(rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.lopOptions() });
      notify.success('Import sinh viên thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Import sinh viên thất bại';
      notify.error(message);
    },
  });
}
