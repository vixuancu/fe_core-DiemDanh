import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/shared/lib/notify';
import { administrativeClassService } from '../services';
import type {
  AdministrativeClassFilter,
  CreateAdministrativeClassDto,
  UpdateAdministrativeClassDto,
} from '../types';

export const administrativeClassKeys = {
  all: ['administrative-classes'] as const,
  lists: () => [...administrativeClassKeys.all, 'list'] as const,
  list: (filter: AdministrativeClassFilter) => [...administrativeClassKeys.lists(), filter] as const,
  stats: (search?: string) => [...administrativeClassKeys.all, 'stats', search || ''] as const,
  detail: (id: string) => [...administrativeClassKeys.all, 'detail', id] as const,
};

export function useAdministrativeClasses(filter: AdministrativeClassFilter) {
  return useQuery({
    queryKey: administrativeClassKeys.list(filter),
    queryFn: () => administrativeClassService.list(filter),
    placeholderData: (prev) => prev,
    retry: false,
  });
}

export function useAdministrativeClassStats(search?: string) {
  return useQuery({
    queryKey: administrativeClassKeys.stats(search),
    queryFn: () => administrativeClassService.getStats({ search }),
    placeholderData: (prev) => prev,
    retry: false,
  });
}

export function useCreateAdministrativeClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAdministrativeClassDto) => administrativeClassService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.all });
      queryClient.invalidateQueries({ queryKey: ['students', 'class-options'] });
      notify.success('Tạo lớp hành chính thành công');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Tạo lớp hành chính thất bại');
    },
  });
}

export function useUpdateAdministrativeClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAdministrativeClassDto }) =>
      administrativeClassService.update(id, dto),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.all });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: ['students', 'class-options'] });
      notify.success('Cập nhật lớp hành chính thành công');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Cập nhật lớp hành chính thất bại');
    },
  });
}

export function useLockAdministrativeClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => administrativeClassService.lock(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.all });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['students', 'class-options'] });
      notify.success('Đã khóa lớp hành chính');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Khóa lớp hành chính thất bại');
    },
  });
}

export function useUnlockAdministrativeClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => administrativeClassService.unlock(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.all });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['students', 'class-options'] });
      notify.success('Đã mở khóa lớp hành chính');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Mở khóa lớp hành chính thất bại');
    },
  });
}

export function useHardDeleteAdministrativeClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => administrativeClassService.hardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: administrativeClassKeys.all });
      queryClient.invalidateQueries({ queryKey: ['students', 'class-options'] });
      notify.success('Xóa hẳn lớp hành chính thành công');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Xóa hẳn lớp hành chính thất bại');
    },
  });
}
