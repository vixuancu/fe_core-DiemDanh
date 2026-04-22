export interface AttendanceWebcamStartRequest {
  mode: 'webcam';
  rtsp_url?: null;
}

export interface AttendanceWebcamStartResponse {
  runtime_id: string;
  mode: 'webcam' | 'ip_camera';
  started_at: number;
  total_students: number;
  cached_embeddings: number;
  rtsp_url: string;
}

export interface AttendanceWebcamStopResponse {
  stopped: boolean;
  total_attended: number;
}

export interface AttendanceWebcamStatus {
  active: boolean;
  runtime_id: string;
  mode: string;
  started_at?: number;
  total_attended: number;
  cached_embeddings: number;
  connected: boolean;
}

export interface AttendanceWebcamFace {
  recognized: boolean;
  student_id?: number;
  student_code?: string;
  full_name?: string;
  confidence?: number;
  already_marked?: boolean;
  status?: 'focusing' | 'confirming' | 'unknown';
  confirm_hits?: number;
  confirm_required?: number;
  face_box?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    xCenter?: number;
    yCenter?: number;
  };
}

export interface AttendanceWebcamRecognizeResponse {
  status: string;
  faces: AttendanceWebcamFace[];
  total_faces: number;
  new_attended: Array<{
    student_id: number;
    student_code: string;
    full_name: string;
    confidence: number;
  }>;
  total_attended: number;
  elapsed_ms?: number;
}
