import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditClassService } from '../services';
import type { CreditClassFilter, CreateLopTinChiDto, UpdateLopTinChiDto } from '../types';
import { notify } from '@/shared/lib/notify';

export const creditClassKeys = {
  all: ['creditClasses'] as const,
  lists: () => [...creditClassKeys.all, 'list'] as const,
  list: (filter: CreditClassFilter) => [...creditClassKeys.lists(), filter] as const,
  giangVienOptions: () => [...creditClassKeys.all, 'giangVienOptions'] as const,
};

export function useCreditClasses(filter: CreditClassFilter) {
  return useQuery({
    queryKey: creditClassKeys.list(filter),
    queryFn: () => creditClassService.list(filter),
    placeholderData: (prev) => prev,
  });
}

export function useGiangVienOptions() {
  return useQuery({
    queryKey: creditClassKeys.giangVienOptions(),
    queryFn: () => creditClassService.getGiangVienOptions(),
    staleTime: Infinity,
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
