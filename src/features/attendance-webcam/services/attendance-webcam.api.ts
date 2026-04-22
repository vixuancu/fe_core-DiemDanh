import { config } from '@/shared/config/env';
import { getAuthHeaders } from '@/features/auth/session';
import { parseEnvelope } from '@/shared/model/api-error.model';
import type { IAttendanceWebcamService } from './attendance-webcam.service';
import type {
  AttendanceWebcamRecognizeResponse,
  AttendanceWebcamStartRequest,
  AttendanceWebcamStartResponse,
  AttendanceWebcamStatus,
  AttendanceWebcamStopResponse,
} from '../types';

const API_URL = `${config.apiBaseUrl}/attendance/live`;

export const attendanceWebcamApi: IAttendanceWebcamService = {
  async start(body: AttendanceWebcamStartRequest): Promise<AttendanceWebcamStartResponse> {
    const res = await fetch(`${API_URL}/start`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const payload = await parseEnvelope<AttendanceWebcamStartResponse>(res);
    return payload.data;
  },

  async stop(runtimeId?: string): Promise<AttendanceWebcamStopResponse> {
    const res = await fetch(`${API_URL}/stop`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ runtime_id: runtimeId ?? null }),
    });
    const payload = await parseEnvelope<AttendanceWebcamStopResponse>(res);
    return payload.data;
  },

  async status(runtimeId?: string): Promise<AttendanceWebcamStatus> {
    const query = runtimeId ? `?runtime_id=${encodeURIComponent(runtimeId)}` : '';
    const res = await fetch(`${API_URL}/status${query}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<AttendanceWebcamStatus>(res);
    return payload.data;
  },

  async recognizeFast(payload: {
    runtimeId: string;
    facePositions: string;
    faces: File[];
  }): Promise<AttendanceWebcamRecognizeResponse> {
    const formData = new FormData();
    formData.append('runtime_id', payload.runtimeId);
    formData.append('face_positions', payload.facePositions);
    payload.faces.forEach((file) => formData.append('faces', file, file.name));

    const res = await fetch(`${API_URL}/recognize-fast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const body = await parseEnvelope<AttendanceWebcamRecognizeResponse>(res);
    return body.data;
  },
};
