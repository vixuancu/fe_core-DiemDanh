import type {
  AttendanceWebcamRecognizeResponse,
  AttendanceWebcamStartRequest,
  AttendanceWebcamStartResponse,
  AttendanceWebcamStatus,
  AttendanceWebcamStopResponse,
} from '../types';

export interface IAttendanceWebcamService {
  start(payload: AttendanceWebcamStartRequest): Promise<AttendanceWebcamStartResponse>;
  stop(runtimeId?: string): Promise<AttendanceWebcamStopResponse>;
  status(runtimeId?: string): Promise<AttendanceWebcamStatus>;
  recognizeFast(payload: {
    runtimeId: string;
    facePositions: string;
    faces: File[];
  }): Promise<AttendanceWebcamRecognizeResponse>;
}
