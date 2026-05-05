import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Play, Square, Wifi, WifiOff } from 'lucide-react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useCreditClasses, useCreditClassSessions } from '@/features/credit-classes/hooks/useCreditClasses';
import {
  useRecognizeWebcamFast,
  useStartAttendanceWebcam,
  useStopAttendanceWebcam,
} from '@/features/attendance-webcam/hooks/useAttendanceWebcam';
import { attendanceWebcamService } from '@/features/attendance-webcam/services';
import type { AttendanceWebcamFace } from '@/features/attendance-webcam/types';
import { notify } from '@/shared/lib/notify';
import { formatDateVi } from '@/shared/lib/date-time';

interface DrawFaceBox {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  state: 'recognized' | 'pending' | 'rejected';
}

interface TrackedFace {
  name: string;
  state: 'recognized' | 'pending' | 'rejected';
  failCount: number;
  expiry: number;
}

const LABEL_TTL_MS = 5000;
const PENDING_TTL_MS = 2600;
const REJECT_TTL_MS = 2200;
const REJECT_FAIL_THRESHOLD = 2;
const MAX_RECOGNIZE_FACES = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function expandFaceBoxNormalized(
  bb: { xCenter: number; yCenter: number; width: number; height: number },
  options?: {
    padX?: number;
    padTop?: number;
    padBottom?: number;
  },
) {
  const padX = options?.padX ?? 0.22;
  const padTop = options?.padTop ?? 0.5;
  const padBottom = options?.padBottom ?? 0.2;

  const left = clamp(bb.xCenter - bb.width * (0.5 + padX), 0, 1);
  const right = clamp(bb.xCenter + bb.width * (0.5 + padX), 0, 1);
  const top = clamp(bb.yCenter - bb.height * (0.5 + padTop), 0, 1);
  const bottom = clamp(bb.yCenter + bb.height * (0.5 + padBottom), 0, 1);

  return {
    xCenter: (left + right) / 2,
    yCenter: (top + bottom) / 2,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function pickTopDetections(detections: any[]): any[] {
  return detections
    .filter((item) => item?.boundingBox)
    .sort((a, b) => {
      const aa = Number(a.boundingBox.width || 0) * Number(a.boundingBox.height || 0);
      const bb = Number(b.boundingBox.width || 0) * Number(b.boundingBox.height || 0);
      return bb - aa;
    })
    .slice(0, MAX_RECOGNIZE_FACES);
}

function resolveSessionDateTimeLabel(sessionDate?: string, startTime?: string, endTime?: string): string {
  const dateLabel = formatDateVi(sessionDate || '');

  const toHm = (value?: string) => {
    if (!value) return '--:--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return value;
    }
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  return `${dateLabel} (${toHm(startTime)} - ${toHm(endTime)})`;
}

function mapPeriodToSessionLabel(startPeriod: number, endPeriod: number): string {
  if (endPeriod <= 5) return 'Sáng';
  if (endPeriod <= 9) return 'Chiều';
  if (startPeriod >= 10) return 'Tối';
  return 'Chiều/Tối';
}

function resolveBoxFrameClass(state: DrawFaceBox['state']): string {
  if (state === 'recognized') return 'border-green-500 bg-green-500/15';
  if (state === 'pending') return 'border-amber-400 bg-amber-400/12';
  return 'border-red-500 bg-red-500/15';
}

function resolveRejectedText(debugReason?: string, face?: AttendanceWebcamFace): string {
  if (debugReason === 'spoof_detected') return 'Phát hiện giả mạo!';
  if (debugReason === 'not_enrolled_in_session') {
    return face?.full_name ? `Không thuộc lớp này: ${face.full_name}` : 'Không thuộc lớp này';
  }
  return 'Chưa nhận diện được';
}

function resolveBoxLabelClass(state: DrawFaceBox['state']): string {
  if (state === 'recognized') return 'bg-green-700/90';
  if (state === 'pending') return 'bg-amber-700/90';
  return 'bg-red-700/90';
}

export function DiemDanhWebcamPage() {
  const { user } = useAuth();

  const classFilter = useMemo(
    () => ({
      page: 1,
      perPage: 100,
      ...(user?.role === 'giang_vien' ? { giangVienId: user.id } : {}),
    }),
    [user?.id, user?.role],
  );

  const { data: creditClassData, isLoading: isLoadingClasses } = useCreditClasses(classFilter);
  const creditClasses = creditClassData?.data ?? [];

  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [runtimeId, setRuntimeId] = useState('');
  const [drawBoxes, setDrawBoxes] = useState<DrawFaceBox[]>([]);
  const [connectionState, setConnectionState] = useState<'active' | 'inactive' | 'waiting'>('waiting');
  const [connectionText, setConnectionText] = useState('Camera chờ kích hoạt');
  const [fpsText, setFpsText] = useState('-');
  const [lastFaceUpdatedAt, setLastFaceUpdatedAt] = useState(0);

  const selectedClass = useMemo(
    () => creditClasses.find((item) => item.id === selectedSectionId) ?? null,
    [creditClasses, selectedSectionId],
  );

  const { data: sessions = [], isLoading: isLoadingSessions } = useCreditClassSessions(selectedSectionId);

  const selectedSession = useMemo(
    () => sessions.find((item) => item.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const startMutation = useStartAttendanceWebcam();
  const stopMutation = useStopAttendanceWebcam();
  const recognizeMutation = useRecognizeWebcamFast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamTimerRef = useRef<number | null>(null);
  const mpFaceDetectionRef = useRef<any>(null);
  const mpCameraRef = useRef<any>(null);
  const currentDetectionsRef = useRef<any[]>([]);
  const faceLabelsRef = useRef<Map<string, TrackedFace>>(new Map());
  const scanningRef = useRef(false);
  const mediaPipeReadyRef = useRef(false);
  const runtimeIdRef = useRef('');
  const fpsCounterRef = useRef({ count: 0, tick: Date.now() });

  const canStart = !!selectedSectionId && !!selectedSessionId && !startMutation.isPending;

  useEffect(() => {
    if (creditClasses.length === 0) {
      setSelectedSectionId('');
      return;
    }
    if (!selectedSectionId || !creditClasses.some((item) => item.id === selectedSectionId)) {
      setSelectedSectionId(creditClasses[0].id);
    }
  }, [creditClasses, selectedSectionId]);

  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedSessionId('');
      return;
    }
    if (!selectedSessionId || !sessions.some((item) => item.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    setSelectedSessionId('');
  }, [selectedSectionId]);

  useEffect(() => {
    runtimeIdRef.current = runtimeId;
  }, [runtimeId]);

  useEffect(() => {
    return () => {
      cleanupRuntime();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!runtimeIdRef.current) return;
      if (Date.now() - lastFaceUpdatedAt > 2000) {
        setDrawBoxes([]);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [lastFaceUpdatedAt]);

  const selectedSchedule = useMemo(() => {
    if (!selectedClass) return null;
    const schedules = selectedClass.schedules ?? [];
    if (schedules.length === 0) return null;

    if (!selectedSession?.sessionDate) return schedules[0];

    const sessionDate = new Date(selectedSession.sessionDate);
    if (Number.isNaN(sessionDate.getTime())) return schedules[0];

    const jsDay = sessionDate.getDay();
    const weekday = jsDay === 0 ? 8 : jsDay + 1;
    return schedules.find((s) => s.dayOfWeek === weekday) ?? schedules[0];
  }, [selectedClass, selectedSession?.sessionDate]);

  const periodStart = selectedSchedule?.startPeriod ?? selectedClass?.startPeriod ?? 0;
  const periodEndFromSchedule = selectedSchedule?.endPeriod
    ?? (selectedSchedule ? selectedSchedule.startPeriod + selectedSchedule.numberOfPeriods - 1 : 0);
  const periodEnd = periodEndFromSchedule || (selectedClass ? selectedClass.startPeriod + selectedClass.numberOfPeriods - 1 : 0);

  const sessionLabel = periodStart > 0 && periodEnd > 0
    ? `${mapPeriodToSessionLabel(periodStart, periodEnd)} (Tiết ${periodStart}-${periodEnd})`
    : '-';

  const makeFaceKey = (xCenter: number, yCenter: number) => `${Math.round(xCenter * 12)}_${Math.round(yCenter * 12)}`;

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

  const drawOverlay = (detections: any[]) => {
    const video = videoRef.current;
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
    for (const [key, value] of labels.entries()) {
      if (value.expiry < now) {
        labels.delete(key);
      }
    }

    const boxes: DrawFaceBox[] = [];
    for (let i = 0; i < detections.length; i += 1) {
      const raw = detections[i]?.boundingBox;
      if (!raw) continue;
      const bb = expandFaceBoxNormalized({
        xCenter: Number(raw.xCenter),
        yCenter: Number(raw.yCenter),
        width: Number(raw.width),
        height: Number(raw.height),
      });
      if (!bb) continue;

      const key = makeFaceKey(Number(raw.xCenter), Number(raw.yCenter));
      const found = labels.get(key);
      const state: DrawFaceBox['state'] = found?.state ?? 'pending';
      const label = found?.name ?? 'Dang xac minh...';

      boxes.push({
        id: `${i}-${Date.now()}`,
        left: offsetX + (bb.xCenter - bb.width / 2) * drawW,
        top: offsetY + (bb.yCenter - bb.height / 2) * drawH,
        width: bb.width * drawW,
        height: bb.height * drawH,
        label,
        state,
      });
    }

    setDrawBoxes(boxes);
    setLastFaceUpdatedAt(Date.now());
    updateFps();
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
    setDrawBoxes([]);

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const updateLabelsFromRecognizeResult = (
    faces: AttendanceWebcamFace[],
    positions: Array<{ xCenter: number; yCenter: number }>,
  ) => {
    const now = Date.now();
    const labels = faceLabelsRef.current;

    for (let i = 0; i < positions.length; i += 1) {
      const face = faces[i];
      const pos = positions[i];
      if (!pos) continue;

      const key = makeFaceKey(pos.xCenter, pos.yCenter);
      const prev = labels.get(key);

      if (face?.recognized) {
        labels.set(key, {
          name: face.full_name || 'Da nhan dien',
          state: 'recognized',
          failCount: 0,
          expiry: now + LABEL_TTL_MS,
        });
        continue;
      }

      if (prev?.state === 'recognized') {
        labels.set(key, {
          ...prev,
          expiry: now + 1200,
        });
        continue;
      }

      const debugReason = face?.debug?.reason;
      const shouldRejectNow = Boolean(debugReason && debugReason !== 'matched');
      if (shouldRejectNow) {
        labels.set(key, {
          name: resolveRejectedText(debugReason, face),
          state: 'rejected',
          failCount: REJECT_FAIL_THRESHOLD,
          expiry: now + REJECT_TTL_MS,
        });
        continue;
      }

      const nextFailCount = (prev?.failCount ?? 0) + 1;
      if (nextFailCount >= REJECT_FAIL_THRESHOLD) {
        labels.set(key, {
          name: resolveRejectedText(debugReason, face),
          state: 'rejected',
          failCount: nextFailCount,
          expiry: now + REJECT_TTL_MS,
        });
        continue;
      }

      labels.set(key, {
        name: 'Dang xac minh...',
        state: 'pending',
        failCount: nextFailCount,
        expiry: now + PENDING_TTL_MS,
      });
    }
  };

  const captureWebcamAndRecognize = async (runtimeIdArg: string) => {
    if (!runtimeIdArg || recognizeMutation.isPending) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const detections = pickTopDetections(currentDetectionsRef.current);
    if (!detections.length) {
      drawOverlay([]);
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
      const raw = detections[i]?.boundingBox;
      if (!raw) continue;

      const expanded = expandFaceBoxNormalized(
        {
          xCenter: Number(raw.xCenter),
          yCenter: Number(raw.yCenter),
          width: Number(raw.width),
          height: Number(raw.height),
        },
        { padX: 0.60, padTop: 0.60, padBottom: 0.60 },
      );

      const cx = expanded.xCenter * vw;
      const cy = expanded.yCenter * vh;
      const fw = expanded.width * vw;
      const fh = expanded.height * vh;

      const x = Math.max(0, Math.round(cx - fw / 2));
      const y = Math.max(0, Math.round(cy - fh / 2));
      const w = Math.min(Math.round(fw), vw - x);
      const h = Math.min(Math.round(fh), vh - y);

      if (w < 40 || h < 40) continue;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = w;
      cropCanvas.height = h;

      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) continue;

      cropCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

      const cropBlob = await new Promise<Blob | null>((resolve) => {
        cropCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
      });

      if (!cropBlob) continue;

      cropFiles.push(new File([cropBlob], `face_${i}.jpg`, { type: 'image/jpeg' }));
      positions.push({ xCenter: Number(raw.xCenter), yCenter: Number(raw.yCenter) });
    }

    if (!cropFiles.length) {
      drawOverlay(currentDetectionsRef.current);
      return;
    }

    try {
      const response = await recognizeMutation.mutateAsync({
        runtimeId: runtimeIdArg,
        facePositions: JSON.stringify(positions),
        faces: cropFiles,
      });

      updateLabelsFromRecognizeResult(response.faces ?? [], positions);
      drawOverlay(currentDetectionsRef.current);
      setConnectionState('active');
      setConnectionText('Webcam đang nhận diện');
    } catch (error) {
      try {
        const runtimeStatus = await attendanceWebcamService.status(runtimeIdArg);
        if (!runtimeStatus.active || runtimeStatus.runtime_id !== runtimeIdArg) {
          cleanupRuntime();
          notify.warning('Phiên điểm danh đã hết hiệu lực, vui lòng bắt đầu lại');
          return;
        }
      } catch (statusError) {
        if (
          statusError instanceof Error
          && (
            statusError.message.includes('runtime_id không hợp lệ')
            || statusError.message.includes('Runtime hiện tại không phải phiên điểm danh live')
            || statusError.message.includes('Phiên điểm danh đã hết hiệu lực')
          )
        ) {
          cleanupRuntime();
          notify.warning('Phiên điểm danh đã hết hiệu lực, vui lòng bắt đầu lại');
          return;
        }
      }
      setConnectionState('inactive');
      setConnectionText('Nhận diện tạm gián đoạn');
    }
  };

  const startWebcamLoop = async (runtimeIdArg: string) => {
    await ensureMediaPipeReady();

    const FaceDetection = (window as any).FaceDetection;
    const MPCamera = (window as any).Camera;
    const video = videoRef.current;

    if (!video) {
      throw new Error('Không tìm thấy webcam element');
    }

    mpFaceDetectionRef.current = new FaceDetection({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`,
    });
    mpFaceDetectionRef.current.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
    mpFaceDetectionRef.current.onResults((results: any) => {
      currentDetectionsRef.current = results?.detections || [];
      drawOverlay(currentDetectionsRef.current);
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
    setConnectionText('Webcam đã kết nối');
    fpsCounterRef.current = { count: 0, tick: Date.now() };
    setFpsText('-');
  };

  const cleanupRuntime = () => {
    stopWebcamLoop();
    setRuntimeId('');
    runtimeIdRef.current = '';
    setConnectionState('waiting');
    setConnectionText('Camera chờ kích hoạt');
    setFpsText('-');
    setLastFaceUpdatedAt(0);
  };

  const onStart = async () => {
    if (!selectedSectionId || !selectedSessionId) {
      notify.warning('Vui lòng chọn lớp và buổi học trước khi bắt đầu điểm danh');
      return;
    }

    try {
      const data = await startMutation.mutateAsync({
        mode: 'webcam',
        class_session_id: Number(selectedSessionId),
        course_section_id: Number(selectedSectionId),
        rtsp_url: null,
      });

      cleanupRuntime();
      setRuntimeId(data.runtime_id);
      runtimeIdRef.current = data.runtime_id;
      await startWebcamLoop(data.runtime_id);
    } catch (error) {
      cleanupRuntime();
      notify.error(error instanceof Error ? error.message : 'Không thể bắt đầu điểm danh webcam');
    }
  };

  const onStop = async () => {
    if (!runtimeIdRef.current) return;
    try {
      await stopMutation.mutateAsync(runtimeIdRef.current);
    } finally {
      cleanupRuntime();
    }
  };

  return (
    <div className="space-y-4">
      <h2>Điểm danh</h2>

      <div className="bg-white rounded-xl border border-border p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm">Lớp tín chỉ</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
              disabled={isLoadingClasses || !!runtimeId}
            >
              {creditClasses.length === 0 ? <option value="">Không có lớp học</option> : null}
              {creditClasses.map((item) => (
                <option key={item.id} value={item.id}>{item.tenMonHoc} - {item.maLop}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">Buổi học</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
              disabled={!selectedSectionId || isLoadingSessions || !!runtimeId}
            >
              {sessions.length === 0 ? <option value="">Không có buổi học</option> : null}
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {resolveSessionDateTimeLabel(session.sessionDate, session.startTime, session.endTime)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-border px-3 py-2">
            <div className="text-xs text-muted-foreground">Lớp học</div>
            <div>{selectedClass?.maLop || '-'}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-2">
            <div className="text-xs text-muted-foreground">Giảng viên</div>
            <div>{selectedClass?.tenGiangVien || '-'}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-2">
            <div className="text-xs text-muted-foreground">Phòng</div>
            <div>{selectedSession?.roomName || selectedClass?.tenPhongHoc || '-'}</div>
          </div>
          <div className="rounded-lg border border-border px-3 py-2">
            <div className="text-xs text-muted-foreground">Ca / Tiết</div>
            <div>{sessionLabel}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-3">
        <div className="relative w-full max-w-[980px] aspect-video rounded-xl overflow-hidden border bg-black border-slate-900">
          {!runtimeId && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Camera className="w-10 h-10" />
              <span className="text-sm">Camera chờ kích hoạt</span>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-contain ${runtimeId ? 'block' : 'hidden'}`}
          />
          <canvas ref={captureCanvasRef} className="hidden" />

          <div className="absolute inset-0 pointer-events-none">
            {drawBoxes.map((box) => (
              <div
                key={box.id}
                className={`absolute border-2 rounded-md ${resolveBoxFrameClass(box.state)}`}
                style={{
                  left: `${box.left}px`,
                  top: `${box.top}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                }}
              >
                <div className={`absolute -top-7 left-0 px-2 py-1 rounded text-white text-[11px] font-medium whitespace-nowrap flex items-center gap-1 ${resolveBoxLabelClass(box.state)}`}>
                  {box.state === 'pending' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>{box.label}</span>
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

        <div className="mt-3 flex gap-2">
          <button
            onClick={onStart}
            disabled={!canStart || !!runtimeId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
          >
            {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Bắt đầu điểm danh
          </button>
          <button
            onClick={onStop}
            disabled={!runtimeId || stopMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition"
          >
            {stopMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} Dừng điểm danh
          </button>
        </div>
      </div>
    </div>
  );
}
