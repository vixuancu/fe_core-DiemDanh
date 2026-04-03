import type {
  AttendanceFaceUploadResponse,
  AttendanceLiveConfig,
  AttendanceLiveRecognizeResponse,
  AttendanceLiveStartRequest,
  AttendanceLiveStartResponse,
  AttendanceLiveStatus,
  AttendanceLiveStopResponse,
} from '../types';

export interface IAttendanceLiveService {
  getConfig(): Promise<AttendanceLiveConfig>;
  start(payload: AttendanceLiveStartRequest): Promise<AttendanceLiveStartResponse>;
  stop(runtimeId?: string): Promise<AttendanceLiveStopResponse>;
  status(runtimeId?: string): Promise<AttendanceLiveStatus>;
  recognizeFast(payload: {
    runtimeId: string;
    facePositions: string;
    faces: File[];
  }): Promise<AttendanceLiveRecognizeResponse>;
  uploadStudentFaces(payload: {
    studentId: string | number;
    files: File[];
  }): Promise<AttendanceFaceUploadResponse>;
}
