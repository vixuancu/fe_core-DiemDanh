import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  useCreditClasses,
  useCreditClassFormOptions,
  useCreditClassSessions,
  useCreateCreditClass,
  useUpdateCreditClass,
  useUpdateCreditClassSession,
  useDeleteCreditClass,
} from "@/features/credit-classes/hooks/useCreditClasses";
import type {
  CreateLopTinChiDto,
  CreateLopTinChiScheduleDto,
  BuoiHocStatus,
  LopTinChi,
} from "@/features/credit-classes/types";
import {
  Search,
  Plus,
  MoreVertical,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
  CalendarDays,
  Clock3,
  MapPin,
  BookOpenText,
} from "lucide-react";
import { PortableSelect } from "./ui/portable-form-controls";
import { DataTablePagination } from "./ui/data-table-pagination";
import { notify } from "@/shared/lib/notify";

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function resolveWeekdayLabel(dayOfWeek: number): string {
  const labels: Record<number, string> = {
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật",
  };

  return labels[dayOfWeek] || `Thứ ${dayOfWeek}`;
}

function resolvePeriodText(
  startPeriod: number,
  numberOfPeriods: number,
  endPeriod?: number,
) {
  const finalEndPeriod = endPeriod ?? startPeriod + numberOfPeriods - 1;
  return `Tiết ${startPeriod}-${finalEndPeriod}`;
}

const buoiHocStatusOptions: Array<{ value: BuoiHocStatus; label: string }> = [
  { value: "chua_bat_dau", label: "Chưa bắt đầu" },
  { value: "chua_xong", label: "Chưa xong" },
  { value: "da_xong", label: "Đã xong" },
  { value: "nghi", label: "Nghỉ" },
  { value: "bu", label: "Bù" },
];

function formatDateTimeLabel(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function ClassDetailModal({
  lop,
  onClose,
}: {
  lop: LopTinChi;
  onClose: () => void;
}) {
  const schedules = lop.schedules ?? [];
  const { data: sessions = [], isLoading: isLoadingSessions } =
    useCreditClassSessions(lop.id);
  const { mutate: updateSession, isPending: isUpdatingSession } =
    useUpdateCreditClassSession();
  const { data: formOptions } = useCreditClassFormOptions();
  const [editingStatus, setEditingStatus] = useState<
    Record<string, BuoiHocStatus>
  >({});
  const [editingNote, setEditingNote] = useState<Record<string, string>>({});
  const [editingRoom, setEditingRoom] = useState<Record<string, string>>({});

  useEffect(() => {
    const statusMap: Record<string, BuoiHocStatus> = {};
    const noteMap: Record<string, string> = {};
    const roomMap: Record<string, string> = {};
    sessions.forEach((session) => {
      statusMap[session.id] = session.status;
      noteMap[session.id] = session.note ?? "";
      roomMap[session.id] = session.roomId ?? "";
    });
    setEditingStatus(statusMap);
    setEditingNote(noteMap);
    setEditingRoom(roomMap);
  }, [sessions]);

  const handleSaveSession = (sessionId: string) => {
    const status = editingStatus[sessionId];
    // const roomId = editingRoom[sessionId];
    if (!status) {
      notify.error("Vui lòng chọn trạng thái buổi học");
      return;
    }
    updateSession({
      sectionId: lop.id,
      sessionId,
      dto: {
        status,
        note: editingNote[sessionId] ?? "",
        // roomId: roomId || undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Chi tiết lớp tín chỉ
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Xem thông tin tổng quát và các buổi học của lớp.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-xl border border-border p-4 bg-gray-50/60">
              <div className="flex items-center gap-2 mb-2 text-gray-600 text-sm">
                <BookOpenText className="w-4 h-4" />
                Thông tin lớp
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Mã lớp:</span>{" "}
                  <span className="font-medium text-gray-800">{lop.maLop}</span>
                </div>
                <div>
                  <span className="text-gray-500">Học phần:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {lop.tenMonHoc}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Sĩ số:</span>{" "}
                  <span className="font-medium text-gray-800">{lop.siSo}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                <Clock3 className="w-4 h-4" />
                Danh sách buổi học
              </div>
              <span className="text-xs text-gray-500">
                {schedules.length} buổi
              </span>
            </div>

            {schedules.length === 0 ? (
              <div className="text-sm text-gray-500">
                Chưa có lịch học chi tiết.
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule, index) => (
                  <div
                    key={schedule.id ?? `${schedule.dayOfWeek}-${index}`}
                    className="rounded-lg border border-border p-3 bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="font-medium text-gray-800 text-sm">
                        {schedule.displayText ||
                          `${schedule.dayOfWeekLabel || resolveWeekdayLabel(schedule.dayOfWeek)} - ${resolvePeriodText(schedule.startPeriod, schedule.numberOfPeriods, schedule.endPeriod)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {schedule.roomName || "Chưa có phòng"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {schedule.dayOfWeekLabel ||
                          resolveWeekdayLabel(schedule.dayOfWeek)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="w-4 h-4" />
                        {resolvePeriodText(
                          schedule.startPeriod,
                          schedule.numberOfPeriods,
                          schedule.endPeriod,
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {schedule.roomName || "Chưa có phòng"}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-gray-500">Giảng viên:</span>
                      <span className="font-medium text-gray-800">
                        {schedule.userFullName || "Chưa có giảng viên"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                <CalendarDays className="w-4 h-4" />
                Quản lý buổi học
              </div>
              <span className="text-xs text-gray-500">
                {sessions.length} buổi
              </span>
            </div>

            {isLoadingSessions ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Đang tải danh sách buổi học...
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Chưa có buổi học được sinh tự động.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="rounded-lg border border-border p-3 bg-white"
                  >
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <div className="text-sm font-semibold text-gray-800">
                        Buổi {index + 1}
                        {/* - {" "}
                        {formatDateTimeLabel(session.sessionDate)} */}
                      </div>
                      <span className="text-xs rounded-full px-2 py-1 bg-slate-100 text-slate-700">
                        {session.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-1">
                        <label className="block mb-1 text-xs text-gray-500">
                          Giờ học
                        </label>
                        <div className="text-sm text-gray-700">
                          {formatDateTimeLabel(session.startTime)} -{" "}
                          {formatDateTimeLabel(session.endTime)}
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block mb-1 text-xs text-gray-500">
                          Phòng
                        </label>
                        <PortableSelect
                          value={
                            editingRoom[session.id] ?? session.roomId ?? ""
                          }
                          onChange={(e) =>
                            setEditingRoom((prev) => ({
                              ...prev,
                              [session.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                          labelClassName="text-sm"
                        >
                          <option value="">Chọn phòng học</option>
                          {(formOptions?.rooms ?? []).map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </PortableSelect>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block mb-1 text-xs text-gray-500">
                          Trạng thái
                        </label>
                        <PortableSelect
                          value={editingStatus[session.id] ?? session.status}
                          onChange={(e) =>
                            setEditingStatus((prev) => ({
                              ...prev,
                              [session.id]: e.target.value as BuoiHocStatus,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                          labelClassName="text-sm"
                        >
                          {buoiHocStatusOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </PortableSelect>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block mb-1 text-xs text-gray-500">
                          Ghi chú
                        </label>
                        <input
                          value={editingNote[session.id] ?? ""}
                          onChange={(e) =>
                            setEditingNote((prev) => ({
                              ...prev,
                              [session.id]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                          placeholder="Nhập ghi chú (nếu có)"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={isUpdatingSession}
                        onClick={() => handleSaveSession(session.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] disabled:opacity-60"
                      >
                        Lưu buổi học
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 shrink-0 border-t border-border pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionDropdown({
  lop,
  onViewDetail,
  onEditClick,
  onDeleteClick,
  onOpenStudents,
}: {
  lop: LopTinChi;
  onViewDetail: (lop: LopTinChi) => void;
  onEditClick: (lop: LopTinChi) => void;
  onDeleteClick: (lop: LopTinChi) => void;
  onOpenStudents: (lop: LopTinChi) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, isAbove: false });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 160;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenAbove = spaceBelow < dropdownHeight;

      setCoords({
        top: shouldOpenAbove ? rect.top - dropdownHeight : rect.bottom,
        left: rect.right - 176,
        isAbove: shouldOpenAbove,
      });
    }

    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleScroll() {
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none shadow-sm"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            marginTop: coords.isAbove ? "-8px" : "8px",
          }}
          className="w-44 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-normal"
            onClick={() => {
              onViewDetail(lop);
              setIsOpen(false);
            }}
          >
            Chi tiết
          </button>
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-normal"
            onClick={() => {
              onEditClick(lop);
              setIsOpen(false);
            }}
          >
            Sửa
          </button>
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-normal"
            onClick={() => {
              onOpenStudents(lop);
              setIsOpen(false);
            }}
          >
            Danh sách sinh viên
          </button>
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
            onClick={() => {
              onDeleteClick(lop);
              setIsOpen(false);
            }}
          >
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Class Modal ─────────────────────────────────────────────────────────

const DAY_OF_WEEK_OPTIONS = [
  { value: 2, label: "Thứ 2" },
  { value: 3, label: "Thứ 3" },
  { value: 4, label: "Thứ 4" },
  { value: 5, label: "Thứ 5" },
  { value: 6, label: "Thứ 6" },
  { value: 7, label: "Thứ 7" },
  { value: 8, label: "Chủ nhật" },
];

interface CreateLopTinChiForm {
  maLop: string;
  courseId: string;
  startDate: string;
  endDate: string;
}

interface ScheduleRowForm {
  giangVienId: string;
  roomId: string;
  dayOfWeek: number;
  startPeriod: number;
  numberOfPeriods: number;
}

const EMPTY_FORM: CreateLopTinChiForm = {
  maLop: "",
  courseId: "",
  startDate: "",
  endDate: "",
};

const EMPTY_SCHEDULE_ROW: ScheduleRowForm = {
  giangVienId: "",
  roomId: "",
  dayOfWeek: 2,
  startPeriod: 1,
  numberOfPeriods: 1,
};

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function AddClassModal({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: LopTinChi | null;
}) {
  const [form, setForm] = useState<CreateLopTinChiForm>(EMPTY_FORM);
  const [schedules, setSchedules] = useState<ScheduleRowForm[]>([
    { ...EMPTY_SCHEDULE_ROW },
  ]);
  const { data: formOptions, isLoading: isLoadingOptions } =
    useCreditClassFormOptions();
  const { mutate: create, isPending } = useCreateCreditClass();
  const { mutate: update, isPending: isUpdating } = useUpdateCreditClass();

  useEffect(() => {
    if (!initialData) {
      setForm(EMPTY_FORM);
      setSchedules([{ ...EMPTY_SCHEDULE_ROW }]);
      return;
    }

    const mappedSchedules = (initialData.schedules ?? []).map((schedule) => ({
      giangVienId: schedule.userId ?? initialData.giangVienId,
      roomId: schedule.roomId ?? initialData.roomId,
      dayOfWeek: schedule.dayOfWeek,
      startPeriod: schedule.startPeriod,
      numberOfPeriods: schedule.numberOfPeriods,
    }));

    const fallbackSchedule: ScheduleRowForm = {
      giangVienId: initialData.giangVienId,
      roomId: initialData.roomId,
      dayOfWeek: initialData.dayOfWeek,
      startPeriod: initialData.startPeriod,
      numberOfPeriods: initialData.numberOfPeriods,
    };

    setForm({
      maLop: initialData.maLop,
      courseId: initialData.courseId,
      startDate: toDateInput(initialData.startDate),
      endDate: toDateInput(initialData.endDate),
    });

    setSchedules(
      mappedSchedules.length > 0 ? mappedSchedules : [fallbackSchedule],
    );
  }, [initialData]);

  const handleChange = <K extends keyof CreateLopTinChiForm>(
    key: K,
    value: CreateLopTinChiForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const updateSchedule = <K extends keyof ScheduleRowForm>(
    index: number,
    key: K,
    value: ScheduleRowForm[K],
  ) => {
    setSchedules((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const addSchedule = () => {
    setSchedules((rows) => [...rows, { ...EMPTY_SCHEDULE_ROW }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules((rows) => {
      const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
      return nextRows.length > 0 ? nextRows : [{ ...EMPTY_SCHEDULE_ROW }];
    });
  };

  const handleSave = () => {
    if (!form.maLop || !form.courseId || !form.startDate || !form.endDate) {
      notify.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (form.startDate >= form.endDate) {
      notify.error("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");
      return;
    }

    if (!schedules.length) {
      notify.error("Vui lòng thêm ít nhất 1 buổi học");
      return;
    }

    const hasInvalidSchedule = schedules.some(
      (schedule) =>
        !schedule.giangVienId ||
        !schedule.roomId ||
        !schedule.dayOfWeek ||
        !schedule.startPeriod ||
        !schedule.numberOfPeriods,
    );

    if (hasInvalidSchedule) {
      notify.error(
        "Vui lòng nhập đủ giảng viên, phòng và lịch dạy cho từng buổi học",
      );
      return;
    }

    const firstSchedule = schedules[0];

    const payload: CreateLopTinChiDto = {
      maLop: form.maLop,
      courseId: form.courseId,
      giangVienId: firstSchedule.giangVienId,
      roomId: firstSchedule.roomId,
      dayOfWeek: firstSchedule.dayOfWeek,
      startDate: `${form.startDate}T00:00:00`,
      endDate: `${form.endDate}T00:00:00`,
      startPeriod: firstSchedule.startPeriod,
      numberOfPeriods: firstSchedule.numberOfPeriods,
      schedules: schedules.map(
        (schedule): CreateLopTinChiScheduleDto => ({
          userId: schedule.giangVienId,
          roomId: schedule.roomId,
          dayOfWeek: schedule.dayOfWeek,
          startPeriod: schedule.startPeriod,
          numberOfPeriods: schedule.numberOfPeriods,
        }),
      ),
    };

    if (initialData) {
      update(
        { id: initialData.id, dto: payload },
        {
          onSuccess: () => onClose(),
        },
      );
      return;
    }

    create(payload, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3>{initialData ? "Cập nhật lớp tín chỉ" : "Thêm lớp tín chỉ"}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoadingOptions ? (
          <div className="py-8 text-sm text-muted-foreground text-center">
            Đang tải dữ liệu form...
          </div>
        ) : (
          <div className="overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-1 text-sm">
                  Mã lớp <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.maLop}
                  onChange={(e) => handleChange("maLop", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                  placeholder="Nhập mã lớp tín chỉ"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 text-sm">
                  Học phần <span className="text-red-500">*</span>
                </label>
                <PortableSelect
                  value={form.courseId}
                  onChange={(e) => handleChange("courseId", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                  labelClassName="text-sm"
                >
                  <option value="">Chọn học phần</option>
                  {(formOptions?.courses ?? []).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </PortableSelect>
              </div>
              <div>
                <label className="block mb-1 text-sm">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    Danh sách buổi học
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="px-3 py-2 rounded-lg border border-[#009dd9]/30 text-[#009dd9] text-sm hover:bg-[#009dd9]/5 transition-colors"
                >
                  Thêm buổi học
                </button>
              </div>

              <div className="space-y-4">
                {schedules.map((schedule, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border p-4 bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700">
                        Buổi học {index + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Xóa buổi này
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm">
                          Giảng viên <span className="text-red-500">*</span>
                        </label>
                        <PortableSelect
                          value={schedule.giangVienId}
                          onChange={(e) =>
                            updateSchedule(index, "giangVienId", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                          labelClassName="text-sm"
                        >
                          <option value="">Chọn giảng viên</option>
                          {(formOptions?.lecturers ?? []).map((lecturer) => (
                            <option key={lecturer.id} value={lecturer.id}>
                              {lecturer.name}
                            </option>
                          ))}
                        </PortableSelect>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Phòng học <span className="text-red-500">*</span>
                        </label>
                        <PortableSelect
                          value={schedule.roomId}
                          onChange={(e) =>
                            updateSchedule(index, "roomId", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                          labelClassName="text-sm"
                        >
                          <option value="">Chọn phòng học</option>
                          {(formOptions?.rooms ?? []).map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </PortableSelect>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Thứ học <span className="text-red-500">*</span>
                        </label>
                        <PortableSelect
                          value={String(schedule.dayOfWeek)}
                          onChange={(e) =>
                            updateSchedule(
                              index,
                              "dayOfWeek",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                          labelClassName="text-sm"
                        >
                          {DAY_OF_WEEK_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </PortableSelect>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Tiết bắt đầu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={schedule.startPeriod}
                          onChange={(e) =>
                            updateSchedule(
                              index,
                              "startPeriod",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Số tiết <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={schedule.numberOfPeriods}
                          onChange={(e) =>
                            updateSchedule(
                              index,
                              "numberOfPeriods",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6 shrink-0 border-t border-border pt-4">
          <button
            onClick={onClose}
            disabled={isPending || isUpdating}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || isUpdating}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {(isPending || isUpdating) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {initialData ? "Cập nhật" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LopTinChiPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<LopTinChi | null>(null);
  const [detailClass, setDetailClass] = useState<LopTinChi | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    lop: LopTinChi | null;
  }>({
    isOpen: false,
    lop: null,
  });

  const { data, isLoading, isError, error } = useCreditClasses({
    search,
    page: currentPage,
    perPage,
  });
  const { mutate: deleteClass, isPending: isDeleting } = useDeleteCreditClass();

  const creditClasses = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, data?.totalPages ?? 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const openCreateModal = () => {
    setEditingClass(null);
    setShowModal(true);
  };

  const openEditModal = (lop: LopTinChi) => {
    setEditingClass(lop);
    setShowModal(true);
  };

  const openDetailModal = (lop: LopTinChi) => {
    setDetailClass(lop);
  };

  const handleDelete = (lop: LopTinChi) => {
    setDeleteModal({ isOpen: true, lop });
  };

  const confirmDelete = () => {
    if (!deleteModal.lop) return;
    deleteClass(deleteModal.lop.id, {
      onSuccess: () => setDeleteModal({ isOpen: false, lop: null }),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý lớp tín chỉ</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm lớp tín chỉ
        </button>
      </div>

      {isError && (
        <ErrorState
          message={(error as Error)?.message ?? "Đã xảy ra lỗi khi tải dữ liệu"}
        />
      )}

      <div className="bg-white rounded-xl p-4 border border-border mb-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã lớp tín chỉ..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-gray-600">
                <th className="text-left py-3.5 px-4 font-normal w-[60px]">
                  STT
                </th>
                <th className="text-left py-3.5 px-4 font-normal">
                  Mã lớp tín chỉ
                </th>
                <th className="text-left py-3.5 px-4 font-normal">
                  Tên học phần
                </th>
                <th className="text-left py-3.5 px-4 font-normal">Sĩ số</th>
                <th className="text-center py-3.5 px-4 font-normal w-[90px]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#009dd9]" />
                  </td>
                </tr>
              ) : creditClasses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Danh sách trống
                  </td>
                </tr>
              ) : (
                creditClasses.map((lop, index) => (
                  <tr
                    key={lop.id}
                    className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-gray-600">
                      {(currentPage - 1) * perPage + index + 1}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{lop.maLop}</td>
                    <td className="py-3.5 px-4 text-gray-700">
                      {lop.tenMonHoc}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">{lop.siSo}</td>
                    <td className="py-3.5 px-4 text-center">
                      <ActionDropdown
                        lop={lop}
                        onViewDetail={openDetailModal}
                        onEditClick={openEditModal}
                        onDeleteClick={(target) => handleDelete(target)}
                        onOpenStudents={(target) =>
                          navigate(`/lop-tin-chi/${target.id}/sinh-vien`, {
                            state: {
                              name: target.tenMonHoc,
                              code: target.maLop,
                            },
                          })
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={total}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={(value) => {
            setPerPage(value);
            setCurrentPage(1);
          }}
          perPageOptions={[10, 20, 30, 50]}
        />
      </div>

      {/* Modal thêm lớp */}
      {showModal && (
        <AddClassModal
          onClose={() => {
            setShowModal(false);
            setEditingClass(null);
          }}
          initialData={editingClass}
        />
      )}

      {detailClass && (
        <ClassDetailModal
          lop={detailClass}
          onClose={() => setDetailClass(null)}
        />
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa lớp tín chỉ{" "}
                <span className="font-semibold text-gray-800">
                  "{deleteModal.lop?.maLop}"
                </span>
                ?
                <br />
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteModal({ isOpen: false, lop: null })}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition cursor-pointer"
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
                  isDeleting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 cursor-pointer"
                }`}
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
