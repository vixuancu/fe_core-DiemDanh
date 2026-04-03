import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/shared/lib/notify';
import { attendanceLiveService } from '../services';
import type { AttendanceLiveStartRequest } from '../types';

export const attendanceLiveKeys = {
  all: ['attendance-live'] as const,
  config: () => [...attendanceLiveKeys.all, 'config'] as const,
  status: (runtimeId?: string) => [...attendanceLiveKeys.all, 'status', runtimeId ?? 'none'] as const,
};

export function useAttendanceLiveConfig() {
  return useQuery({
    queryKey: attendanceLiveKeys.config(),
    queryFn: () => attendanceLiveService.getConfig(),
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useAttendanceLiveStatus(runtimeId?: string) {
  return useQuery({
    queryKey: attendanceLiveKeys.status(runtimeId),
    queryFn: () => attendanceLiveService.status(runtimeId),
    enabled: !!runtimeId,
    refetchInterval: 3000,
    retry: false,
  });
}

export function useStartAttendanceLive() {
  return useMutation({
    mutationFn: (payload: AttendanceLiveStartRequest) => attendanceLiveService.start(payload),
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể khởi động demo AI';
      notify.error(message);
    },
  });
}

export function useStopAttendanceLive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runtimeId?: string) => attendanceLiveService.stop(runtimeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceLiveKeys.all });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể dừng demo AI';
      notify.error(message);
    },
  });
}

export function useRecognizeFast() {
  return useMutation({
    mutationFn: (payload: {
      runtimeId: string;
      facePositions: string;
      faces: File[];
    }) => attendanceLiveService.recognizeFast(payload),
  });
}

export function useUploadStudentFacesForAi() {
  return useMutation({
    mutationFn: (payload: { studentId: string | number; files: File[] }) =>
      attendanceLiveService.uploadStudentFaces(payload),
    onSuccess: (data) => {
      notify.success(`Upload thành công ${data.uploaded} ảnh`);
      if (data.failed > 0) {
        notify.warning(`${data.failed} ảnh lỗi khi trích xuất embedding`);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Upload ảnh thất bại';
      notify.error(message);
    },
  });
}
