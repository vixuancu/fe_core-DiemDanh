import { config } from '@/shared/config/env';
import { getAuthHeaders } from '@/features/auth/session';
import { parseEnvelope } from '@/shared/model/api-error.model';
import type { IAttendanceLiveService } from './attendance-live.service';
import type {
  AttendanceFaceUploadResponse,
  AttendanceLiveConfig,
  AttendanceLiveRecognizeResponse,
  AttendanceLiveStartRequest,
  AttendanceLiveStartResponse,
  AttendanceLiveStatus,
  AttendanceLiveStopResponse,
} from '../types';

const API_URL = `${config.apiBaseUrl}/attendance/demo`;

export const attendanceLiveApi: IAttendanceLiveService = {
  async getConfig(): Promise<AttendanceLiveConfig> {
    const res = await fetch(`${API_URL}/config`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<AttendanceLiveConfig>(res);
    return payload.data;
  },

  async start(body: AttendanceLiveStartRequest): Promise<AttendanceLiveStartResponse> {
    const res = await fetch(`${API_URL}/start`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const payload = await parseEnvelope<AttendanceLiveStartResponse>(res);
    return payload.data;
  },

  async stop(runtimeId?: string): Promise<AttendanceLiveStopResponse> {
    const res = await fetch(`${API_URL}/stop`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ runtime_id: runtimeId ?? null }),
    });
    const payload = await parseEnvelope<AttendanceLiveStopResponse>(res);
    return payload.data;
  },

  async status(runtimeId?: string): Promise<AttendanceLiveStatus> {
    const query = runtimeId ? `?runtime_id=${encodeURIComponent(runtimeId)}` : '';
    const res = await fetch(`${API_URL}/status${query}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<AttendanceLiveStatus>(res);
    return payload.data;
  },

  async recognizeFast(payload: {
    runtimeId: string;
    facePositions: string;
    faces: File[];
  }): Promise<AttendanceLiveRecognizeResponse> {
    const formData = new FormData();
    formData.append('runtime_id', payload.runtimeId);
    formData.append('face_positions', payload.facePositions);
    payload.faces.forEach((file) => formData.append('faces', file, file.name));

    const res = await fetch(`${API_URL}/recognize-fast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const body = await parseEnvelope<AttendanceLiveRecognizeResponse>(res);
    return body.data;
  },

  async uploadStudentFaces(payload: {
    studentId: string | number;
    files: File[];
  }): Promise<AttendanceFaceUploadResponse> {
    const formData = new FormData();
    payload.files.forEach((file) => formData.append('files', file, file.name));

    const res = await fetch(
      `${API_URL}/students/${payload.studentId}/faces/upload`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      },
    );
    const body = await parseEnvelope<AttendanceFaceUploadResponse>(res);
    return body.data;
  },
};
