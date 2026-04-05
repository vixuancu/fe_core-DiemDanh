import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditClassService } from '../services';
import type {
  CreditClassStudentImportResult,
  CreditClassFilter,
  CreditClassStudentFilter,
  CreateLopTinChiDto,
  UpdateLopTinChiDto,
} from '../types';
import { notify } from '@/shared/lib/notify';

export const creditClassKeys = {
  all: ['creditClasses'] as const,
  lists: () => [...creditClassKeys.all, 'list'] as const,
  list: (filter: CreditClassFilter) => [...creditClassKeys.lists(), filter] as const,
  formOptions: () => [...creditClassKeys.all, 'formOptions'] as const,
  students: (sectionId: string, filter: CreditClassStudentFilter) =>
    [...creditClassKeys.all, 'students', sectionId, filter] as const,
};

export function useCreditClasses(filter: CreditClassFilter) {
  return useQuery({
    queryKey: creditClassKeys.list(filter),
    queryFn: () => creditClassService.list(filter),
    placeholderData: (prev) => prev,
  });
}

export function useCreditClassFormOptions() {
  return useQuery({
    queryKey: creditClassKeys.formOptions(),
    queryFn: () => creditClassService.getFormOptions(),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useCreateCreditClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLopTinChiDto) => creditClassService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditClassKeys.lists() });
      notify.success('Thêm lớp tín chỉ thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thêm lớp tín chỉ thất bại';
      notify.error(message);
    },
  });
}

export function useUpdateCreditClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLopTinChiDto }) =>
      creditClassService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditClassKeys.lists() });
      notify.success('Cập nhật lớp tín chỉ thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật lớp tín chỉ thất bại';
      notify.error(message);
    },
  });
}

export function useDeleteCreditClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditClassService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditClassKeys.lists() });
      notify.success('Xóa lớp tín chỉ thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Xóa lớp tín chỉ thất bại';
      notify.error(message);
    },
  });
}

export function useCreditClassStudents(sectionId: string, filter: CreditClassStudentFilter) {
  return useQuery({
    queryKey: creditClassKeys.students(sectionId, filter),
    queryFn: () => creditClassService.listStudents(sectionId, filter),
    enabled: !!sectionId,
    placeholderData: (prev) => prev,
  });
}

export function useAddStudentToCreditClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, studentId }: { sectionId: string; studentId: string }) =>
      creditClassService.addStudent(sectionId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...creditClassKeys.all, 'students', variables.sectionId],
      });
      queryClient.invalidateQueries({ queryKey: creditClassKeys.lists() });
      notify.success('Thêm sinh viên vào lớp tín chỉ thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thêm sinh viên thất bại';
      notify.error(message);
    },
  });
}

export function useRemoveStudentFromCreditClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, studentId }: { sectionId: string; studentId: string }) =>
      creditClassService.removeStudent(sectionId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...creditClassKeys.all, 'students', variables.sectionId],
      });
      queryClient.invalidateQueries({ queryKey: creditClassKeys.lists() });
      notify.success('Đã xóa sinh viên khỏi lớp tín chỉ');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Xóa sinh viên thất bại';
      notify.error(message);
    },
  });
}

export function useImportStudentsToCreditClass(sectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => creditClassService.importStudentsFromExcel(sectionId, file),
    onSuccess: (result: CreditClassStudentImportResult) => {
      queryClient.invalidateQueries({
        queryKey: [...creditClassKeys.all, 'students', sectionId],
      });
      queryClient.invalidateQueries({ queryKey: creditClassKeys.lists() });

      if (result.failedCount > 0) {
        // notify.warning(`Đã import ${result.importedCount}/${result.totalRows} sinh viên`);
        notify.error(`Thêm sinh viên thất bại`);
      } else {
        notify.success(`Import thành công ${result.importedCount} sinh viên`);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Import sinh viên thất bại';
      notify.error(message);
    },
  });
}

export async function downloadCreditClassStudentImportTemplate(sectionId: string) {
  const blob = await creditClassService.downloadStudentImportTemplate(sectionId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'credit_class_student_import_template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
