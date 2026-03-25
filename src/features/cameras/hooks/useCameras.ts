import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cameraService } from '../services';
import type { CameraCreateRequest, CameraUpdateRequest, CameraDeleteRequest, CameraFilter } from '../types';
import { notify } from '@/shared/lib/notify';

export const cameraKeys = {
    all: ['cameras'] as const,
    lists: () => [...cameraKeys.all, 'list'] as const,
    list: (filter: CameraFilter) => [...cameraKeys.lists(), filter] as const,
    stats: () => [...cameraKeys.all, 'stats'] as const
}

export function useCameras(filter: CameraFilter) {
    return useQuery({
        queryKey: cameraKeys.list(filter),
        queryFn: () => cameraService.getCameras(filter),
        retry: false
    })
}

export function useCreateCamera() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CameraCreateRequest) =>
            cameraService.create(request),

        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });

            await queryClient.invalidateQueries({ queryKey: ['classrooms'], exact: false });

            notify.success('Thêm camera mới thành công');
        },

        onError: (error: any) => {
            const message = error?.response?.data?.message || error.message || 'Thêm camera thất bại';
            notify.error(message);
        },
    });
}

export function useUpdateCamera() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CameraUpdateRequest) =>
            cameraService.update(request),

        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });

            await queryClient.invalidateQueries({ queryKey: ['classrooms'], exact: false });

            notify.success('Cập nhật thông tin camera thành công');
        },

        onError: (error: any) => {
            const message = error?.response?.data?.message || error.message || 'Cập nhật camera thất bại';
            notify.error(message);
        },
    });
}

export function useDeleteCamera() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CameraDeleteRequest) => cameraService.delete(request),

        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: cameraKeys.lists() });

            await queryClient.invalidateQueries({
                queryKey: ['classrooms'],
                exact: false
            });

            notify.success('Xóa thiết bị camera thành công');
        },

        onError: (error: any) => {
            const message = error?.response?.data?.message || error.message || 'Xóa camera thất bại';
            notify.error(message);
        },
    });
}