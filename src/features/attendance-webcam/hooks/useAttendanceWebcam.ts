import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/shared/lib/notify';
import { attendanceWebcamService } from '../services';
import type { AttendanceWebcamStartRequest } from '../types';

export const attendanceWebcamKeys = {
  all: ['attendance-webcam'] as const,
  status: (runtimeId?: string) => [...attendanceWebcamKeys.all, 'status', runtimeId ?? 'none'] as const,
};

export function useAttendanceWebcamStatus(runtimeId?: string) {
  return useQuery({
    queryKey: attendanceWebcamKeys.status(runtimeId),
    queryFn: () => attendanceWebcamService.status(runtimeId),
    enabled: !!runtimeId,
    refetchInterval: 3000,
    retry: false,
  });
}

export function useStartAttendanceWebcam() {
  return useMutation({
    mutationFn: (payload: AttendanceWebcamStartRequest) => attendanceWebcamService.start(payload),
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể khởi động điểm danh webcam';
      notify.error(message);
    },
  });
}

export function useStopAttendanceWebcam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runtimeId?: string) => attendanceWebcamService.stop(runtimeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceWebcamKeys.all });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể dừng điểm danh webcam';
      notify.error(message);
    },
  });
}

export function useRecognizeWebcamFast() {
  return useMutation({
    mutationFn: (payload: {
      runtimeId: string;
      facePositions: string;
      faces: File[];
    }) => attendanceWebcamService.recognizeFast(payload),
  });
}
