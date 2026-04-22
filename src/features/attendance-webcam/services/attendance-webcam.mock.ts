import type { IAttendanceWebcamService } from './attendance-webcam.service';

export const attendanceWebcamMock: IAttendanceWebcamService = {
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
      mode: 'webcam',
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
};
