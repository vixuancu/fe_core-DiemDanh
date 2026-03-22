import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService } from '../services';
import type { RoomFilter, CreatePhongHocDto, UpdatePhongHocDto } from '../types';
import { notify } from '@/shared/lib/notify';

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filter: RoomFilter) => [...roomKeys.lists(), filter] as const,
  toaNhaOptions: () => [...roomKeys.all, 'toaNhaOptions'] as const,
  availableCameras: () => [...roomKeys.all, 'availableCameras'] as const,
};

export function useRooms(filter: RoomFilter) {
  return useQuery({
    queryKey: roomKeys.list(filter),
    queryFn: () => roomService.list(filter),
    placeholderData: (prev) => prev,
  });
}

export function useToaNhaOptions() {
  return useQuery({
    queryKey: roomKeys.toaNhaOptions(),
    queryFn: () => roomService.getToaNhaOptions(),
    staleTime: Infinity,
  });
}

export function useAvailableCameras() {
  return useQuery({
    queryKey: roomKeys.availableCameras(),
    queryFn: () => roomService.getAvailableCameras(),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePhongHocDto) => roomService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roomKeys.toaNhaOptions() });
      queryClient.invalidateQueries({ queryKey: roomKeys.availableCameras() });
      notify.success('Thêm phòng học thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thêm phòng học thất bại';
      notify.error(message);
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePhongHocDto }) =>
      roomService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roomKeys.toaNhaOptions() });
      queryClient.invalidateQueries({ queryKey: roomKeys.availableCameras() });
      notify.success('Cập nhật phòng học thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật phòng học thất bại';
      notify.error(message);
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roomKeys.toaNhaOptions() });
      queryClient.invalidateQueries({ queryKey: roomKeys.availableCameras() });
      notify.success('Xóa phòng học thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Xóa phòng học thất bại';
      notify.error(message);
    },
  });
}
