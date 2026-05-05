import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Camera, Loader2, Play, Square, Upload, Video } from "lucide-react";

import {
  useStudents,
  studentKeys,
} from "@/features/students/hooks/useStudents";
import { notify } from "@/shared/lib/notify";
import { config } from "@/shared/config/env";
import { useQueryClient } from "@tanstack/react-query";

const DURATION_OPTIONS = [10, 15, 20, 25, 30];

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  return (
    candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ""
  );
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function ThuThapVideoSinhVienPage() {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(15);
  const [cameraError, setCameraError] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const deferredSearch = useDeferredValue(studentSearch.trim());
  const { data: studentPage, isLoading: isLoadingStudents } = useStudents({
    page: 1,
    perPage: 100,
    search: deferredSearch || undefined,
    trangThai: "active",
  });
  const queryClient = useQueryClient();

  const students = studentPage?.data ?? [];
  const selectedStudent = useMemo(
    () => students.find((item) => item.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  useEffect(() => {
    if (!recordedFile) {
      setRecordedUrl("");
      return;
    }

    const url = URL.createObjectURL(recordedFile);
    setRecordedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedFile]);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Trình duyệt không hỗ trợ camera");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraError("");
        setIsCameraReady(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể mở camera";
        setCameraError(message);
        setIsCameraReady(false);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (stopTimerRef.current != null) {
        window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      if (countdownTimerRef.current != null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const clearTimers = () => {
    if (stopTimerRef.current != null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (countdownTimerRef.current != null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const stopRecording = () => {
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const startRecording = () => {
    if (!selectedStudentId) {
      notify.error("Hãy chọn sinh viên trước khi quay video");
      return;
    }

    if (!streamRef.current) {
      notify.error("Camera chưa sẵn sàng");
      return;
    }

    if (isRecording) return;

    const mimeType = pickRecorderMimeType();
    let recorder: MediaRecorder;

    try {
      recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể bắt đầu ghi video";
      notify.error(message);
      return;
    }

    chunksRef.current = [];
    setRecordedFile(null);
    setIsRecording(true);
    setCountdown(durationSeconds);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      clearTimers();
      const type = recorder.mimeType || "video/webm";
      const extension = type.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type });
      const file = new File(
        [blob],
        `student-face-capture-${Date.now()}.${extension}`,
        { type },
      );

      chunksRef.current = [];
      recorderRef.current = null;
      setRecordedFile(file);
      setUploadResult(null);
      setUploadError(""); // Clear error when recording new video
      setIsRecording(false);
      setCountdown(0);
    };

    recorder.start(1000);
    stopTimerRef.current = window.setTimeout(
      () => stopRecording(),
      durationSeconds * 1000,
    );
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  const handleUpload = async () => {
    if (!selectedStudentId) {
      notify.error("Hãy chọn sinh viên trước khi upload");
      return;
    }

    if (!recordedFile) {
      notify.error("Hãy quay video trước khi upload");
      return;
    }

    // Upload với progress tracking
    const formData = new FormData();
    formData.append("video", recordedFile, recordedFile.name);

    try {
      setUploadProgress(0);

      // Simulate progress từ 0-99% trong 5 giây
      const startTime = Date.now();
      let currentProgress = 0;

      const simulateInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        currentProgress = Math.min(99, Math.round((elapsed / 5000) * 99));
        setUploadProgress(currentProgress);
      }, 100);

      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Handle completion
        xhr.addEventListener("load", () => {
          clearInterval(simulateInterval);

          if (xhr.status >= 200 && xhr.status < 300) {
            // Smooth animation từ current progress lên 100% chỉ khi thành công
            if (currentProgress < 100) {
              const smoothInterval = setInterval(() => {
                currentProgress += Math.ceil((100 - currentProgress) * 0.2);
                if (currentProgress >= 100) {
                  currentProgress = 100;
                  clearInterval(smoothInterval);
                }
                setUploadProgress(currentProgress);
              }, 50);
            }

            const blob = new Blob([xhr.response]);
            resolve(
              new Response(blob, {
                status: xhr.status,
                headers: {
                  "Content-Type":
                    xhr.getResponseHeader("Content-Type") || "application/json",
                },
              }),
            );
          } else {
            let errorMessage = `Upload failed with status ${xhr.status}`;
            const contentType = xhr.getResponseHeader("Content-Type") || "";

            if (contentType.includes("application/json") && xhr.responseText) {
              try {
                const payload = JSON.parse(xhr.responseText) as {
                  message?: string;
                };
                if (payload.message) {
                  errorMessage = payload.message;
                }
              } catch {
                // Ignore parse errors and keep fallback message.
              }
            } else if (xhr.responseText?.trim()) {
              errorMessage = xhr.responseText.trim();
            }

            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener("error", () => {
          clearInterval(simulateInterval);
          reject(new Error("Upload failed"));
        });

        // Get auth token
        const token = localStorage.getItem("access_token");

        xhr.open(
          "POST",
          `${config.apiBaseUrl}/students/${selectedStudentId}/faces/upload-video`,
        );
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
      });

      // Parse response
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: {
          uploaded?: number;
          failed?: number;
          errors?: string[];
        };
      };
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      // Backend có thể trả success=true nhưng thực tế xử lý lỗi (uploaded=0 hoặc failed>0)
      const uploadedCount = data.data?.uploaded ?? 0;
      const failedCount = data.data?.failed ?? 0;
      if (uploadedCount <= 0 || failedCount > 0) {
        const detail = data.data?.errors?.[0];
        throw new Error(
          detail ||
            data.message ||
            "Không trích xuất được embedding khuôn mặt từ video",
        );
      }

      setUploadProgress(100);

      // Lưu kết quả upload
      setUploadResult(data.data);
      setUploadError(""); // Clear error

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: studentKeys.faces(selectedStudentId),
      });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...studentKeys.all, "stats"],
      });

      notify.success("Đã upload video và trích embedding thành công");

      // Reset progress sau 1 giây
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      setUploadProgress(0);
      const message =
        error instanceof Error ? error.message : "Upload video thất bại";
      setUploadError(message); // Set error message
      notify.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#009dd9]/10 text-[#009dd9] text-sm font-medium mb-3">
            <Video className="w-4 h-4" />
            Màn thu thập video sinh viên
          </div> */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {/* Quay video ngắn và gửi thẳng về backend để trích khuôn mặt */}
            Thu thập video khuôn mặt sinh viên
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Chọn sinh viên từ danh sách, quay 10-30 giây, sau đó hệ thống sẽ gửi
            video cho server xử lý.
            {/* để cắt frame và tạo embedding thay cho việc upload
            nhiều ảnh rời. */}
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm min-w-[240px]">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Trạng thái camera
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {isCameraReady && !cameraError ? (
              <>
                <Camera className="w-4 h-4 text-emerald-600" />
                Sẵn sàng ghi hình
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                {cameraError || "Đang khởi tạo camera"}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Tìm sinh viên
              </label>
              <input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Nhập mã SV hoặc họ tên"
                className="mt-2 w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#009dd9]/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Chọn sinh viên
              </label>
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#009dd9]/20"
              >
                <option value="">-- Chọn sinh viên --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.maSV} - {student.hoTen} ({student.lopHanhChinh})
                  </option>
                ))}
              </select>
              {isLoadingStudents ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tải danh sách sinh viên
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Thời lượng quay
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDurationSeconds(value)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      durationSeconds === value
                        ? "border-[#009dd9] bg-[#009dd9] text-white"
                        : "border-border bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {value}s
                  </button>
                ))}
              </div>
              {/* <p className="mt-2 text-xs text-muted-foreground">
                Có thể chọn từ 10 đến 30 giây, phù hợp để thu nhiều góc mặt
                trong một lần quay.
              </p> */}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startRecording}
                disabled={isRecording || !isCameraReady || !!cameraError}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#009dd9] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0088be] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Bắt đầu quay
              </button>

              <button
                type="button"
                onClick={stopRecording}
                disabled={!isRecording}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Square className="w-4 h-4" />
                Dừng quay
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Đếm ngược</span>
                <span className="font-semibold text-slate-900">
                  {isRecording ? `${countdown}s` : "--"}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#009dd9] transition-all"
                  style={{
                    width: isRecording
                      ? `${Math.max(5, (countdown / durationSeconds) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="text-sm font-medium text-slate-900">
              Sinh viên đang chọn
            </div>
            {selectedStudent ? (
              <div className="rounded-2xl bg-slate-50 border border-border p-4 space-y-2">
                <div className="font-semibold text-slate-900">
                  {selectedStudent.hoTen}
                </div>
                <div className="text-sm text-slate-600">
                  Mã SV: {selectedStudent.maSV}
                </div>
                <div className="text-sm text-slate-600">
                  Lớp hành chính: {selectedStudent.lopHanhChinh}
                </div>
                <div className="text-sm text-slate-600">
                  Số ảnh khuôn mặt hiện có: {selectedStudent.soAnhKhuonMat}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-border p-4 text-sm text-slate-500">
                Chưa chọn sinh viên.
              </div>
            )}
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="text-sm font-medium text-slate-900">
              Upload video
            </div>
            <p className="text-sm text-slate-600">
              Gửi video về server để xử lý.
            </p>
            {/* <p className="text-sm text-slate-600">
              Video quay xong sẽ được gửi lên endpoint riêng để backend tự cắt
              frame, detect khuôn mặt và lưu embedding.
            </p> */}

            <button
              type="button"
              onClick={handleUpload}
              disabled={
                !recordedFile || uploadProgress > 0 || !selectedStudentId
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploadProgress > 0 && uploadProgress < 100 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadProgress > 0
                ? `${uploadProgress === 100 ? "Xử lý xong" : "Đang gửi"} (${uploadProgress}%)`
                : "Gửi video"}
            </button>

            {uploadProgress > 0 && (
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-950 rounded-3xl p-4 md:p-6 shadow-xl shadow-slate-950/20 border border-slate-800">
            <div className="flex items-center justify-between gap-4 mb-4 text-white/80 text-sm">
              <span>Xem trước camera</span>
              <span className="inline-flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-emerald-400"}`}
                />
                {isRecording ? "Đang quay" : "Chờ ghi hình"}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {!isCameraReady && !cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang khởi tạo camera
                  </div>
                </div>
              ) : null}
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-6 text-center">
                  <div>
                    <div className="text-lg font-semibold">
                      Không mở được camera
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      {cameraError}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="text-sm font-medium text-slate-900">
                Video đã ghi
              </div>
              {recordedFile && recordedUrl ? (
                <>
                  <video
                    src={recordedUrl}
                    controls
                    className="w-full rounded-2xl border border-border bg-black"
                  />
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">
                        Tên file
                      </div>
                      <div className="truncate">{recordedFile.name}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">
                        Dung lượng
                      </div>
                      <div>{formatFileSize(recordedFile.size)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-sm text-slate-500 text-center">
                  Chưa có video nào được ghi.
                </div>
              )}
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="text-sm font-medium text-slate-900">
                Kết quả upload
              </div>
              {uploadError ? (
                <div className="rounded-2xl bg-red-50 border-2 border-red-300 p-4 text-red-800">
                  <div className="font-medium mb-2">Lỗi upload:</div>
                  <div className="text-sm">{uploadError}</div>
                </div>
              ) : uploadResult ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
                  Đã upload {uploadResult.uploaded} ảnh từ video, lỗi{" "}
                  {uploadResult.failed}.
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-sm text-slate-500">
                  Kết quả upload sẽ hiển thị ở đây sau khi gửi video.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
