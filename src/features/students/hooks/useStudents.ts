import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services';
import type {
  StudentFilter,
  CreateSinhVienDto,
  StudentImportResult,
  UpdateSinhVienDto,
} from '../types';
import { notify } from '@/shared/lib/notify';

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Đặt tập trung để invalidate dễ dàng

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filter: StudentFilter) => [...studentKeys.lists(), filter] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
  faces: (id: string) => [...studentKeys.all, 'faces', id] as const,
  classOptions: () => [...studentKeys.all, 'class-options'] as const,
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
    placeholderData: (prev) => prev,
    retry: false,
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
    queryKey: studentKeys.classOptions(),
    queryFn: () => studentService.getLopOptions(),
    staleTime: Infinity, // lớp ít thay đổi, cache mãi
    retry: false,
  });
}

export function useStudentFaces(studentId: string, enabled = true) {
  return useQuery({
    queryKey: studentKeys.faces(studentId),
    queryFn: () => studentService.listFaces(studentId),
    enabled: enabled && !!studentId,
    retry: false,
  });
}

/** Thêm sinh viên — tự invalidate cache sau khi thêm */
export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSinhVienDto) => studentService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.classOptions() });
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

export function useAddStudentFace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, imageUrl }: { studentId: string; imageUrl: string }) =>
      studentService.addFace(studentId, imageUrl),
    onSuccess: (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.faces(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      notify.success('Đã thêm ảnh khuôn mặt');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thêm ảnh khuôn mặt thất bại';
      notify.error(message);
    },
  });
}

export function useDeleteStudentFace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, faceId }: { studentId: string; faceId: string }) =>
      studentService.deleteFace(studentId, faceId),
    onSuccess: (_data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.faces(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      notify.success('Đã xóa ảnh khuôn mặt');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Xóa ảnh khuôn mặt thất bại';
      notify.error(message);
    },
  });
}

/** Import từ Excel */
export function useImportStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => studentService.importFromExcel(file),
    onSuccess: (result: StudentImportResult) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.classOptions() });
      if (result.failedCount > 0) {
        notify.warning(`Đã import ${result.importedCount}/${result.totalRows} dòng`);
      } else {
        notify.success(`Import thành công ${result.importedCount} dòng`);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Import sinh viên thất bại';
      notify.error(message);
    },
  });
}

export async function downloadStudentImportTemplate() {
  const blob = await studentService.downloadImportTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'student_import_template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
