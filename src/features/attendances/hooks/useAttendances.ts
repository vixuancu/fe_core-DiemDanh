import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services';
import type { AttendanceFilter, UpdateTrangThaiDto } from '../types';
import { notify } from '@/shared/lib/notify';

export const attendanceKeys = {
  all: ['attendances'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  list: (filter: AttendanceFilter) => [...attendanceKeys.lists(), filter] as const,
  stats: (lichHocId: string) => [...attendanceKeys.all, 'stats', lichHocId] as const,
  matrix: (courseSectionId: string | number, fromDate?: string, toDate?: string) => 
    [...attendanceKeys.all, 'matrix', courseSectionId, fromDate, toDate] as const,
};

export function useAttendances(filter: AttendanceFilter) {
  return useQuery({
    queryKey: attendanceKeys.list(filter),
    queryFn: () => attendanceService.list(filter),
    placeholderData: (prev) => prev,
  });
}

export function useAttendanceStats(lichHocId: string) {
  return useQuery({
    queryKey: attendanceKeys.stats(lichHocId),
    queryFn: () => attendanceService.getStats(lichHocId),
    enabled: !!lichHocId,
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTrangThaiDto }) =>
      attendanceService.updateStatus(id, dto),
    onSuccess: (_data, vars) => {
      // Vì không trả về toàn bộ filter, ta invalidate all lists
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      // FIXME: Có thể cần invalidate stats dựa trên lichHocId nếu backend trả về lichHocId trong response
      queryClient.invalidateQueries({ queryKey: ['attendances', 'stats'] }); 
      notify.success('Cập nhật trạng thái điểm danh thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật trạng thái điểm danh thất bại';
      notify.error(message);
    },
  });
}

export function useSyncStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lichHocId: string) => attendanceService.syncStudentsForSchedule(lichHocId),
    onSuccess: (_data, lichHocId) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.stats(lichHocId) });
      notify.success('Đồng bộ danh sách sinh viên thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Đồng bộ sinh viên thất bại';
      notify.error(message);
    },
  });
}

export function useAttendanceMatrix(courseSectionId: string | number | undefined, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: attendanceKeys.matrix(courseSectionId || '', fromDate, toDate),
    queryFn: () => {
      if (!courseSectionId) throw new Error('Missing ID');
      return attendanceService.getMatrix(courseSectionId, fromDate, toDate);
    },
    enabled: !!courseSectionId,
  });
}

import { AttendanceUpdateCellRequest } from '../types';

export function useUpdateAttendanceCell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AttendanceUpdateCellRequest) => attendanceService.updateCell(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật điểm danh thất bại';
      notify.error(message);
    },
  });
}
