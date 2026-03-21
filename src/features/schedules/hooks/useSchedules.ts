import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '../services';
import type { ScheduleFilter, CreateLichHocDto, UpdateLichHocDto } from '../types';
import { notify } from '@/shared/lib/notify';

export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filter: ScheduleFilter) => [...scheduleKeys.lists(), filter] as const,
  lopOptions: () => [...scheduleKeys.all, 'lopOptions'] as const,
  phongOptions: () => [...scheduleKeys.all, 'phongOptions'] as const,
};

export function useSchedules(filter: ScheduleFilter) {
  return useQuery({
    queryKey: scheduleKeys.list(filter),
    queryFn: () => scheduleService.list(filter),
    placeholderData: (prev) => prev,
  });
}

export function useScheduleOptions() {
  const lopQuery = useQuery({
    queryKey: scheduleKeys.lopOptions(),
    queryFn: () => scheduleService.getLopTinChiOptions(),
    staleTime: Infinity,
  });

  const phongQuery = useQuery({
    queryKey: scheduleKeys.phongOptions(),
    queryFn: () => scheduleService.getPhongHocOptions(),
    staleTime: Infinity,
  });

  return {
    lopOptions: lopQuery.data ?? [],
    phongOptions: phongQuery.data ?? [],
    isLoading: lopQuery.isLoading || phongQuery.isLoading,
  };
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLichHocDto) => scheduleService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      notify.success('Thêm lịch dạy thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thêm lịch dạy thất bại';
      notify.error(message);
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLichHocDto }) =>
      scheduleService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      notify.success('Cập nhật lịch dạy thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật lịch dạy thất bại';
      notify.error(message);
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      notify.success('Xóa lịch dạy thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Xóa lịch dạy thất bại';
      notify.error(message);
    },
  });
}
