export type AttendanceLiveMode = 'webcam' | 'ip_camera' | 'both';

export interface AttendanceLiveConfig {
  mode: AttendanceLiveMode;
  hidden_page_path: string;
  rtsp_supported: boolean;
  debug_log_path?: string;
}

export interface AttendanceLiveStartRequest {
  mode: Exclude<AttendanceLiveMode, 'both'>;
  rtsp_url?: string | null;
}

export interface AttendanceLiveStartResponse {
  runtime_id: string;
  mode: Exclude<AttendanceLiveMode, 'both'>;
  started_at: number;
  total_students: number;
  cached_embeddings: number;
  rtsp_url: string;
}

export interface AttendanceLiveStopResponse {
  stopped: boolean;
  total_attended: number;
}

export interface AttendanceLiveStatus {
  active: boolean;
  runtime_id: string;
  mode: string;
  started_at?: number;
  total_attended: number;
  cached_embeddings: number;
  connected: boolean;
}

export interface AttendanceLiveFace {
  recognized: boolean;
  student_id?: number;
  student_code?: string;
  full_name?: string;
  confidence?: number;
  already_marked?: boolean;
  is_spoof?: boolean;
  liveness_score?: number;
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
  debug?: {
    reason?: string;
    [key: string]: any;
  };
}

export interface AttendanceLiveRecognizeResponse {
  status: string;
  faces: AttendanceLiveFace[];
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

export interface AttendanceLiveRtspPayload {
  faces: AttendanceLiveFace[];
  frame_width: number;
  frame_height: number;
  connected: boolean;
  total_attended: number;
  processed_count: number;
}

export interface AttendanceFaceUploadResponse {
  uploaded: number;
  failed: number;
  faces: Array<{
    id: number;
    image_url: string;
  }>;
  errors: string[];
}
