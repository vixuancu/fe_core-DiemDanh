import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClassroomCreateRequest, ClassroomFilter, ClassroomUpdateRequest } from '../types';
import { notify } from '@/shared/lib/notify';
import { classroomService } from '..';

export const classroomKeys = {
    all: ['classrooms'] as const,
    lists: () => [...classroomKeys.all, 'list'] as const,
    list: (filter: ClassroomFilter) => [...classroomKeys.lists(), filter] as const,
    available: () => [...classroomKeys.all, 'available'] as const,
    stats: () => [...classroomKeys.all, 'stats'] as const
}

export function useClassrooms(filter: ClassroomFilter) {
    return useQuery({
        queryKey: classroomKeys.list(filter),
        queryFn: () => classroomService.getClassrooms(filter),
        retry: false,
        staleTime: 0,
    })
}

export function useAvailableClassrooms() {
    return useQuery({
        queryKey: classroomKeys.available(),
        queryFn: () => classroomService.getAvailableClassrooms(),
        retry: false,
        staleTime: 0,
    })
}

export function useCreateClassroom() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: ClassroomCreateRequest) => classroomService.create(request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: classroomKeys.all,
                exact: false
            });
            notify.success('Thêm phòng học thành công');
        },
        onError: (error) => {
            console.log(error);
            const message = error instanceof Error ? error.message : 'Thêm phòng học thất bại';
            notify.error(message);
        },
    });
}

export function useUpdateClassroom() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, request }: { id: number; request: ClassroomUpdateRequest }) =>
            classroomService.update(id, request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: classroomKeys.all,
                exact: false
            });
            notify.success('Cập nhật phòng học thành công');
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Cập nhật phòng học thất bại';
            notify.error(message);
        },
    });
}

export function useDeleteClassroom() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => classroomService.delete(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: classroomKeys.all,
                exact: false
            });
            await queryClient.invalidateQueries({
                queryKey: ['cameras'],
                exact: false
            });
            notify.success('Xóa phòng học thành công');
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Xóa phòng học thất bại';
            notify.error(message);
        },
    });
}