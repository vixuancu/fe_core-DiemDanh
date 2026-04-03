import type { IAttendanceLiveService } from './attendance-live.service';

export const attendanceLiveMock: IAttendanceLiveService = {
  async getConfig() {
    return {
      mode: 'both',
      hidden_page_path: '/diem-danh-ai-demo',
      rtsp_supported: true,
    };
  },
  async start() {
    return {
      runtime_id: 'mock-runtime',
      mode: 'webcam',
      started_at: Date.now() / 1000,
      total_students: 0,
      cached_embeddings: 0,
      rtsp_url: '',
    };
  },
  async stop() {
    return { stopped: true, total_attended: 0 };
  },
  async status() {
    return {
      active: false,
      runtime_id: '',
      mode: '',
      total_attended: 0,
      cached_embeddings: 0,
      connected: false,
    };
  },
  async recognizeFast() {
    return {
      status: 'success',
      faces: [],
      total_faces: 0,
      new_attended: [],
      total_attended: 0,
      elapsed_ms: 0,
    };
  },
  async uploadStudentFaces() {
    return {
      uploaded: 0,
      failed: 0,
      faces: [],
      errors: [],
    };
  },
};
