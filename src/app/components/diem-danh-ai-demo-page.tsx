import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Play, Square, Upload, Wifi, WifiOff, Loader2, ScanFace } from 'lucide-react';

import { config as appConfig } from '@/shared/config/env';
import { notify } from '@/shared/lib/notify';
import {
  useAttendanceLiveConfig,
  useRecognizeFast,
  useStartAttendanceLive,
  useStopAttendanceLive,
  useUploadStudentFacesForAi,
} from '@/features/attendance-live/hooks/useAttendanceLive';
import type {
  AttendanceLiveFace,
  AttendanceLiveRtspPayload,
  AttendanceLiveStartRequest,
  AttendanceLiveStartResponse,
} from '@/features/attendance-live/types';

type RuntimeMode = 'webcam' | 'ip_camera';

interface DrawFaceBox {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  state: 'recognized' | 'already' | 'focusing' | 'confirming' | 'unknown' | 'spoof';
}

interface AttendedRow {
  studentId: string;
  studentCode: string;
  fullName: string;
  confidence: number;
  at: string;
}

interface DebugStats {
  detections: number;
  cropsSent: number;
  recognized: number;
  lastElapsedMs: number;
  lastReason: string;
}

const API_BASE = appConfig.apiBaseUrl.replace(/\/$/, '');

export function DiemDanhAiDemoPage() {
  const { data: demoConfig } = useAttendanceLiveConfig();
  const startMutation = useStartAttendanceLive();
  const stopMutation = useStopAttendanceLive();
  const recognizeMutation = useRecognizeFast();
  const uploadMutation = useUploadStudentFacesForAi();

  const [mode, setMode] = useState<RuntimeMode>('ip_camera');
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode | null>(null);
  const [runtimeId, setRuntimeId] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [totalAttended, setTotalAttended] = useState(0);
  const [cachedEmbeddings, setCachedEmbeddings] = useState(0);
  const [connectionText, setConnectionText] = useState('Idle');
  const [connectionState, setConnectionState] = useState<'active' | 'waiting' | 'inactive'>('waiting');
  const [drawBoxes, setDrawBoxes] = useState<DrawFaceBox[]>([]);
  const [attendedRows, setAttendedRows] = useState<AttendedRow[]>([]);
  const [fpsText, setFpsText] = useState('-');
  const [lastFaceUpdatedAt, setLastFaceUpdatedAt] = useState(0);
  const [debugStats, setDebugStats] = useState<DebugStats>({
    detections: 0,
    cropsSent: 0,
    recognized: 0,
    lastElapsedMs: 0,
    lastReason: '-',
  });
  const [debugLogPath, setDebugLogPath] = useState('');

  const streamImgRef = useRef<HTMLImageElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const webcamTimerRef = useRef<number | null>(null);
  const runtimeIdRef = useRef('');
  const runtimeModeRef = useRef<RuntimeMode | null>(null);
  const mpFaceDetectionRef = useRef<any>(null);
  const mpCameraRef = useRef<any>(null);
  const currentDetectionsRef = useRef<any[]>([]);
  const faceLabelsRef = useRef<Map<string, { name: string; status: 'new' | 'already'; expiry: number }>>(new Map());
  const mediaPipeReadyRef = useRef(false);
  const scanningRef = useRef(false);
  const seenStudentIdsRef = useRef<Set<string>>(new Set());
  const fpsCounterRef = useRef({ count: 0, tick: Date.now() });
  const lastRtspUiUpdateRef = useRef(0);

  const LABEL_TTL_MS = 5000;

  const availableModes = useMemo<RuntimeMode[]>(() => {
    const m = demoConfig?.mode;
    if (m === 'webcam') return ['webcam'];
    if (m === 'ip_camera') return ['ip_camera'];
    return ['webcam', 'ip_camera'];
  }, [demoConfig?.mode]);

  useEffect(() => {
    if (!availableModes.includes(mode)) {
      setMode(availableModes[0] ?? 'ip_camera');
    }
  }, [availableModes, mode]);

  useEffect(() => {
    runtimeIdRef.current = runtimeId;
  }, [runtimeId]);

  useEffect(() => {
    runtimeModeRef.current = runtimeMode;
  }, [runtimeMode]);

  useEffect(() => {
    if (demoConfig?.debug_log_path) {
      setDebugLogPath(demoConfig.debug_log_path);
    }
  }, [demoConfig?.debug_log_path]);

  useEffect(() => {
    return () => {
      cleanupRuntime();
    };
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (!runtimeId) return;
      if (Date.now() - lastFaceUpdatedAt > 2000) {
        setDrawBoxes([]);
      }
    }, 500);
    return () => window.clearInterval(t);
  }, [runtimeId, lastFaceUpdatedAt]);

  const addLog = (_line: string) => {};

  const makeFaceKey = (xCenter: number, yCenter: number) => {
    return `${Math.round(xCenter * 16)}_${Math.round(yCenter * 16)}`;
  };

  const normalizeRtspUrl = (value: string) => value.trim().replace(/\s+/g, '');

  const drawMediaPipeOverlay = (detections: any[]) => {
    const video = webcamVideoRef.current;
    if (!video) return;

    const containerW = video.clientWidth;
    const containerH = video.clientHeight;
    const sourceW = video.videoWidth || 640;
    const sourceH = video.videoHeight || 480;
    if (!containerW || !containerH || !sourceW || !sourceH) return;

    const scale = Math.min(containerW / sourceW, containerH / sourceH);
    const drawW = sourceW * scale;
    const drawH = sourceH * scale;
    const offsetX = (containerW - drawW) / 2;
    const offsetY = (containerH - drawH) / 2;

    const now = Date.now();
    const labels = faceLabelsRef.current;
    for (const [key, item] of labels.entries()) {
      if (item.expiry < now) labels.delete(key);
    }

    const boxes: DrawFaceBox[] = [];
    for (let i = 0; i < detections.length; i += 1) {
      const d = detections[i];
      const bb = d?.boundingBox;
      if (!bb) continue;

      const x = offsetX + (bb.xCenter - bb.width / 2) * drawW;
      const y = offsetY + (bb.yCenter - bb.height / 2) * drawH;
      const w = bb.width * drawW;
      const h = bb.height * drawH;
      const key = makeFaceKey(bb.xCenter, bb.yCenter);
      const label = labels.get(key);

      const state: DrawFaceBox['state'] = label
        ? (label.status === 'already' ? 'already' : 'recognized')
        : 'focusing';

      const text = label
        ? (label.status === 'already'
          ? `${label.name} ✓`
          : `✓ ${label.name}`)
        : '...';

      boxes.push({
        id: `${i}-${Date.now()}`,
        left: x,
        top: y,
        width: w,
        height: h,
        label: text,
        state,
      });
    }

    setDrawBoxes(boxes);
    setDebugStats((prev) => ({ ...prev, detections: detections.length }));
    setLastFaceUpdatedAt(Date.now());
    updateFps();
  };

  const updateLabelsFromRecognizeResult = (faces: AttendanceLiveFace[], positions: Array<{ xCenter: number; yCenter: number }>) => {
    const now = Date.now();
    const labels = faceLabelsRef.current;

    for (let i = 0; i < faces.length; i += 1) {
      const f = faces[i];
      const pos = positions[i];
      if (!pos || !f.recognized) continue;

      const key = makeFaceKey(pos.xCenter, pos.yCenter);
      labels.set(key, {
        name: f.full_name || 'Unknown',
        status: f.already_marked ? 'already' : 'new',
        expiry: now + LABEL_TTL_MS,
      });
    }
  };

  const loadScriptOnce = async (src: string) => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Cannot load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  const ensureMediaPipeReady = async () => {
    if (mediaPipeReadyRef.current) return;

    await loadScriptOnce('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js');
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection.js');

    if (!(window as any).FaceDetection || !(window as any).Camera) {
      throw new Error('MediaPipe FaceDetection chưa sẵn sàng');
    }

    mediaPipeReadyRef.current = true;
  };

  const updateFps = () => {
    fpsCounterRef.current.count += 1;
    const now = Date.now();
    const elapsed = now - fpsCounterRef.current.tick;
    if (elapsed >= 1000) {
      const fps = Math.round((fpsCounterRef.current.count * 1000) / elapsed);
      setFpsText(`${fps} fps`);
      fpsCounterRef.current.count = 0;
      fpsCounterRef.current.tick = now;
    }
  };

  const resetUiState = () => {
    seenStudentIdsRef.current.clear();
    lastRtspUiUpdateRef.current = 0;
    setAttendedRows([]);
    setTotalAttended(0);
    setDrawBoxes([]);
    setConnectionState('waiting');
    setConnectionText('Dang khoi dong...');
    setFpsText('-');
    setLastFaceUpdatedAt(0);
    fpsCounterRef.current = { count: 0, tick: Date.now() };
  };

  const appendAttended = (face: AttendanceLiveFace) => {
    const sid = String(face.student_id ?? face.student_code ?? face.full_name ?? '');
    if (!sid || seenStudentIdsRef.current.has(sid)) {
      return;
    }
    seenStudentIdsRef.current.add(sid);

    const row: AttendedRow = {
      studentId: sid,
      studentCode: face.student_code ?? '-',
      fullName: face.full_name ?? 'Unknown',
      confidence: Number(face.confidence ?? 0),
      at: new Date().toLocaleTimeString(),
    };

    setAttendedRows((prev) => [row, ...prev]);
  };

  const buildRtspBoxes = (faces: AttendanceLiveFace[], frameWidth: number, frameHeight: number) => {
    const target = streamImgRef.current;
    if (!target || !frameWidth || !frameHeight) {
      return;
    }

    const renderedW = target.clientWidth;
    const renderedH = target.clientHeight;
    if (!renderedW || !renderedH) {
      return;
    }

    const scale = Math.min(renderedW / frameWidth, renderedH / frameHeight);
    const drawW = frameWidth * scale;
    const drawH = frameHeight * scale;
    const offsetX = (renderedW - drawW) / 2;
    const offsetY = (renderedH - drawH) / 2;

    const boxes: DrawFaceBox[] = [];
    faces.forEach((face, index) => {
      const b = face.face_box;
      if (!b || typeof b.x !== 'number' || typeof b.y !== 'number' || typeof b.w !== 'number' || typeof b.h !== 'number') {
        return;
      }

      // Thêm hiển thị "spoof" khi phát hiện giả mạo
      const state: DrawFaceBox['state'] = face.is_spoof
        ? 'spoof'
        : face.recognized
          ? (face.already_marked ? 'already' : 'recognized')
          : (face.status === 'confirming' ? 'confirming' : (face.status === 'focusing' ? 'focusing' : 'unknown'));

      let label = 'Unknown';
      if (face.is_spoof) {
        label = `Giả mạo! Score: ${face.liveness_score?.toFixed(2) || 0}`;
      } else if (face.recognized) {
        label = `${face.full_name ?? 'Unknown'}`;
      } else if (state === 'confirming') {
        label = `Dang xac nhan (${face.confirm_hits ?? 1}/${face.confirm_required ?? 2})`;
      } else if (state === 'focusing') {
        label = 'Dang lay net...';
      }

      boxes.push({
        id: `${index}-${Date.now()}`,
        left: offsetX + b.x * scale,
        top: offsetY + b.y * scale,
        width: Math.max(1, b.w * scale),
        height: Math.max(1, b.h * scale),
        label,
        state,
      });
    });

    setDrawBoxes(boxes);
    setLastFaceUpdatedAt(Date.now());
    updateFps();
  };

  const handleRtspPayload = (payload: AttendanceLiveRtspPayload) => {
    const now = Date.now();
    const shouldUpdateVisual = now - lastRtspUiUpdateRef.current >= 120;

    setConnectionState(payload.connected ? 'active' : 'inactive');
    setConnectionText(payload.connected ? 'Camera dang online' : 'Mat ket noi camera');
    setTotalAttended(Number(payload.total_attended ?? 0));

    const faces = payload.faces ?? [];
    if (shouldUpdateVisual) {
      buildRtspBoxes(faces, Number(payload.frame_width ?? 0), Number(payload.frame_height ?? 0));
      lastRtspUiUpdateRef.current = now;
    }

    for (const face of faces) {
      if (face.recognized && face.already_marked === false) {
        appendAttended(face);
      }
    }

    addLog(`RTSP: faces=${faces.length}, attended=${payload.total_attended}, connected=${payload.connected}`);
  };

  const attachSse = (id: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const sse = new EventSource(`${API_BASE}/attendance/demo/ip/results/${id}`);
    eventSourceRef.current = sse;

    sse.onopen = () => {
      setConnectionState('active');
      setConnectionText('SSE da ket noi');
    };

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as AttendanceLiveRtspPayload;
        handleRtspPayload(payload);
      } catch (error) {
        addLog(`SSE parse error: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    };

    sse.onerror = () => {
      setConnectionState('inactive');
      setConnectionText('SSE disconnected');
      addLog('SSE disconnected');
    };
  };

  const stopWebcamLoop = () => {
    if (webcamTimerRef.current != null) {
      window.clearInterval(webcamTimerRef.current);
      webcamTimerRef.current = null;
    }

    scanningRef.current = false;

    if (mpCameraRef.current) {
      try {
        mpCameraRef.current.stop();
      } catch {
        // ignore
      }
      mpCameraRef.current = null;
    }

    if (mpFaceDetectionRef.current) {
      try {
        mpFaceDetectionRef.current.close();
      } catch {
        // ignore
      }
      mpFaceDetectionRef.current = null;
    }

    currentDetectionsRef.current = [];
    faceLabelsRef.current.clear();

    if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
      const stream = webcamVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }

    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }
  };

  const captureWebcamAndRecognize = async (runtimeIdArg: string) => {
    if (!runtimeIdArg || runtimeModeRef.current !== 'webcam') return;
    if (recognizeMutation.isPending) return;

    const video = webcamVideoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const detections = currentDetectionsRef.current;
    if (!detections || detections.length === 0) {
      setDebugStats((prev) => ({ ...prev, detections: 0, cropsSent: 0, lastReason: 'no_detection' }));
      return;
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, vw, vh);

    const cropFiles: File[] = [];
    const positions: Array<{ xCenter: number; yCenter: number }> = [];

    for (let i = 0; i < detections.length; i += 1) {
      const bb = detections[i]?.boundingBox;
      if (!bb) continue;

      // Mở rộng padding để lấy bối cảnh phục vụ cho việc chống giả mạo Liveness (Anti-Spoofing)
      // Mô hình MiniFASNet cần nhìn thấy viền điện thoại / background để tỷ lệ chính xác cao nhất
      // Scale padding = 1.2 (cân bằng để InsightFace vẫn nhận ra sinh viên)
      const pad = 1.2;
      const cx = bb.xCenter * vw;
      const cy = bb.yCenter * vh;
      const fw = bb.width * vw * (1 + pad);
      const fh = bb.height * vh * (1 + pad);

      const x = Math.max(0, Math.round(cx - fw / 2));
      const y = Math.max(0, Math.round(cy - fh / 2));
      const w = Math.min(Math.round(fw), vw - x);
      const h = Math.min(Math.round(fh), vh - y);

      if (w < 40 || h < 40) {
        continue;
      }

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = w;
      cropCanvas.height = h;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) continue;
      cropCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

      const cropBlob = await new Promise<Blob | null>((resolve) => {
        cropCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });
      if (!cropBlob) continue;

      cropFiles.push(new File([cropBlob], `face_${i}.jpg`, { type: 'image/jpeg' }));
      positions.push({ xCenter: Number(bb.xCenter), yCenter: Number(bb.yCenter) });
    }

    if (cropFiles.length === 0) {
      setDebugStats((prev) => ({
        ...prev,
        detections: detections.length,
        cropsSent: 0,
        lastReason: 'crop_too_small_or_failed',
      }));
      return;
    }

    setDebugStats((prev) => ({
      ...prev,
      detections: detections.length,
      cropsSent: cropFiles.length,
    }));

    try {
      const data = await recognizeMutation.mutateAsync({
        runtimeId: runtimeIdArg,
        facePositions: JSON.stringify(positions),
        faces: cropFiles,
      });

      setTotalAttended(Number(data.total_attended ?? 0));
      updateLabelsFromRecognizeResult(data.faces ?? [], positions);
      drawMediaPipeOverlay(currentDetectionsRef.current);

      for (const face of data.faces ?? []) {
        if (face.recognized && face.already_marked === false) {
          appendAttended(face);
        }
      }

      const recognizedCount = (data.faces || []).filter((f) => f.recognized).length;
      const firstUnrecognized = (data.faces || []).find((f) => !f.recognized);
      setDebugStats((prev) => ({
        ...prev,
        recognized: recognizedCount,
        lastElapsedMs: Number(data.elapsed_ms ?? 0),
        lastReason: recognizedCount > 0 ? 'matched' : (firstUnrecognized?.debug?.reason || 'unmatched'),
      }));

      setConnectionState('active');
      setConnectionText('Webcam dang nhan dien');
      addLog(`Webcam: faces=${data.total_faces}, attended=${data.total_attended}, elapsed=${data.elapsed_ms ?? 0}ms`);
    } catch (error) {
      setDebugStats((prev) => ({ ...prev, lastReason: 'recognize_exception' }));
      addLog(`Recognize error: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  };

  const startWebcamLoop = async (runtimeIdArg: string) => {
    try {
      await ensureMediaPipeReady();
      const FaceDetection = (window as any).FaceDetection;
      const MPCamera = (window as any).Camera;

      const video = webcamVideoRef.current;
      if (!video) {
        throw new Error('Webcam element not found');
      }

      mpFaceDetectionRef.current = new FaceDetection({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`,
      });
      mpFaceDetectionRef.current.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5,
      });
      mpFaceDetectionRef.current.onResults((results: any) => {
        currentDetectionsRef.current = results?.detections || [];
        drawMediaPipeOverlay(currentDetectionsRef.current);
      });

      mpCameraRef.current = new MPCamera(video, {
        onFrame: async () => {
          if (!scanningRef.current || !mpFaceDetectionRef.current) return;
          await mpFaceDetectionRef.current.send({ image: video });
        },
        width: 640,
        height: 480,
      });

      await mpCameraRef.current.start();
      scanningRef.current = true;

      webcamTimerRef.current = window.setInterval(() => {
        void captureWebcamAndRecognize(runtimeIdArg);
      }, 1500);

      setConnectionState('active');
      setConnectionText('Webcam + MediaPipe da ket noi');
      addLog('MediaPipe started successfully');
    } catch (error) {
      setConnectionState('inactive');
      setConnectionText('Khong mo duoc webcam');
      setDebugStats((prev) => ({ ...prev, lastReason: 'mediapipe_init_failed' }));
      notify.error(error instanceof Error ? error.message : 'Không mở được webcam');
    }
  };

  const cleanupRuntime = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    stopWebcamLoop();
    if (streamImgRef.current) {
      streamImgRef.current.src = '';
    }
    setRuntimeId('');
    setRuntimeMode(null);
    runtimeIdRef.current = '';
    runtimeModeRef.current = null;
    setConnectionState('waiting');
    setConnectionText('Idle');
    setDrawBoxes([]);
    setFpsText('-');
    currentDetectionsRef.current = [];
    faceLabelsRef.current.clear();
    setDebugStats({
      detections: 0,
      cropsSent: 0,
      recognized: 0,
      lastElapsedMs: 0,
      lastReason: '-',
    });
  };

  const onStart = async () => {
    const payload: AttendanceLiveStartRequest = {
      mode,
      rtsp_url: mode === 'ip_camera' ? (normalizeRtspUrl(rtspUrl) || null) : null,
    };

    let data: AttendanceLiveStartResponse;
    try {
      data = await startMutation.mutateAsync(payload);
    } catch {
      return;
    }

    cleanupRuntime();
    resetUiState();

    setRuntimeId(data.runtime_id);
    setRuntimeMode(data.mode);
    runtimeIdRef.current = data.runtime_id;
    runtimeModeRef.current = data.mode;
    setCachedEmbeddings(data.cached_embeddings);
    setConnectionState('waiting');
    setConnectionText('Dang khoi dong...');
    addLog(`Started runtime=${data.runtime_id}, mode=${data.mode}, cached=${data.cached_embeddings}`);

    if (data.mode === 'ip_camera') {
      if (streamImgRef.current) {
        streamImgRef.current.src = `${API_BASE}/attendance/demo/ip/stream/${data.runtime_id}?t=${Date.now()}`;
      }
      attachSse(data.runtime_id);
    } else {
      await startWebcamLoop(data.runtime_id);
    }
  };

  const onStop = async () => {
    if (!runtimeId) return;
    try {
      const data = await stopMutation.mutateAsync(runtimeId);
      addLog(`Stopped. total_attended=${data.total_attended}`);
    } finally {
      cleanupRuntime();
    }
  };

  const onUploadFaces = async () => {
    if (!studentIdInput.trim()) {
      notify.warning('Nhập student_id trước khi upload');
      return;
    }
    if (uploadFiles.length === 0) {
      notify.warning('Chọn ít nhất 1 ảnh khuôn mặt');
      return;
    }

    try {
      const rs = await uploadMutation.mutateAsync({
        studentId: studentIdInput.trim(),
        files: uploadFiles,
      });
      addLog(`Upload complete: uploaded=${rs.uploaded}, failed=${rs.failed}`);
      if (rs.errors.length > 0) {
        addLog(`Upload errors: ${rs.errors.join(' | ')}`);
      }
      setUploadFiles([]);
    } catch {
      // handled by hook notify
    }
  };

  const stageVisible = !!runtimeMode;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Demo AI Điểm Danh (ẩn)</h2>
        <div className="text-xs text-muted-foreground">Path: /diem-danh-ai-demo</div>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_auto_auto] gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RuntimeMode)}
            className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
          >
            {availableModes.includes('webcam') && <option value="webcam">Webcam</option>}
            {availableModes.includes('ip_camera') && <option value="ip_camera">IP Camera (RTSP)</option>}
          </select>

          <input
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            placeholder="rtsp://192.168.1.5:554/Streaming/Channels/101?transportmode=unicast&profile=Profile_1"
            className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
            disabled={mode !== 'ip_camera'}
          />

          <button
            onClick={onStart}
            disabled={startMutation.isPending}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
          >
            {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start
          </button>

          <button
            onClick={onStop}
            disabled={!runtimeId || stopMutation.isPending}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
          >
            {stopMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            Stop
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_auto] gap-2">
          <input
            value={studentIdInput}
            onChange={(e) => setStudentIdInput(e.target.value)}
            placeholder="student_id"
            className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
            className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
          />
          <button
            onClick={onUploadFaces}
            disabled={uploadMutation.isPending}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-60 flex items-center gap-2"
          >
            {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload & Train
          </button>
        </div>

        <div className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
          {debugLogPath ? `Debug JSON log: ${debugLogPath}` : 'Debug JSON log: backend/logs/ai_demo/attendance_debug.jsonl'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="bg-white rounded-xl border border-border p-3">
          <div
            className={`relative w-full max-w-[980px] aspect-video rounded-xl overflow-hidden border ${stageVisible ? 'bg-black border-slate-900' : 'bg-muted/40 border-border'}`}
          >
            {!stageVisible && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Camera className="w-10 h-10" />
                <span className="text-sm">Chưa khởi động demo</span>
              </div>
            )}

            <img
              ref={streamImgRef}
              alt="RTSP stream"
              className={`absolute inset-0 w-full h-full object-contain ${runtimeMode === 'ip_camera' ? 'block' : 'hidden'}`}
            />
            <video
              ref={webcamVideoRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-contain ${runtimeMode === 'webcam' ? 'block' : 'hidden'}`}
            />
            <canvas ref={captureCanvasRef} className="hidden" />

            <div className="absolute inset-0 pointer-events-none">
              {drawBoxes.map((box) => (
                <div
                  key={box.id}
                  className={`absolute border-2 rounded-md ${
                    box.state === 'recognized'
                      ? 'border-green-500 bg-green-500/15'
                      : box.state === 'already'
                        ? 'border-cyan-500 bg-cyan-500/15'
                        : box.state === 'confirming'
                          ? 'border-orange-400 bg-orange-400/15'
                          : box.state === 'focusing'
                            ? 'border-yellow-400 bg-yellow-400/15'
                            : box.state === 'spoof'
                              ? 'border-fuchsia-600 bg-fuchsia-600/20 shadow-[0_0_15px_rgba(192,38,211,0.5)]'
                              : 'border-red-500 bg-red-500/15'
                  }`}
                  style={{
                    left: `${box.left}px`,
                    top: `${box.top}px`,
                    width: `${box.width}px`,
                    height: `${box.height}px`,
                  }}
                >
                  <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-medium whitespace-nowrap">
                    {box.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute left-0 right-0 bottom-0 text-white px-3 py-2 bg-gradient-to-t from-black/85 to-transparent flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {connectionState === 'active' ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                <span>{connectionText}</span>
              </div>
              <div>{fpsText}</div>
            </div>
          </div>

          <div className="mt-2 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>Runtime: <span className="font-medium text-foreground">{runtimeId || '-'}</span></div>
            <div>Mode: <span className="font-medium text-foreground">{runtimeMode ?? '-'}</span></div>
            <div>Cached vectors: <span className="font-medium text-foreground">{cachedEmbeddings}</span></div>
            <div>Total attended: <span className="font-medium text-foreground">{totalAttended}</span></div>
          </div>

          <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 grid grid-cols-2 md:grid-cols-5 gap-2">
            <div>Detections: <span className="font-semibold">{debugStats.detections}</span></div>
            <div>Crops sent: <span className="font-semibold">{debugStats.cropsSent}</span></div>
            <div>Recognized: <span className="font-semibold">{debugStats.recognized}</span></div>
            <div>Elapsed: <span className="font-semibold">{debugStats.lastElapsedMs}ms</span></div>
            <div>Last reason: <span className="font-semibold">{debugStats.lastReason}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="bg-[#0f172a] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanFace className="w-4 h-4" />
              <span>Sinh viên đã nhận diện</span>
            </div>
            <span>{totalAttended}</span>
          </div>
          <div className="max-h-[430px] overflow-y-auto">
            {attendedRows.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Chưa có sinh viên nào</div>
            ) : (
              attendedRows.map((row) => (
                <div key={`${row.studentId}-${row.at}`} className="px-4 py-3 border-b border-border text-sm flex items-center justify-between gap-2">
                  <div>
                    <div>{row.fullName}</div>
                    <div className="text-xs text-muted-foreground">{row.studentCode}</div>
                  </div>
                  <div className="text-right">
                    <div>{row.confidence}%</div>
                    <div className="text-xs text-muted-foreground">{row.at}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
