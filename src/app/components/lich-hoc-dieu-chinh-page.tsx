import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Loader2, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import {
  useCreditClasses,
  useCreditClassSessions,
  useUpdateCreditClassSession,
} from "@/features/credit-classes/hooks/useCreditClasses";
import type { BuoiHocStatus } from "@/features/credit-classes/types";
import { PortableSelect } from "./ui/portable-form-controls";
import { notify } from "@/shared/lib/notify";

const STATUS_OPTIONS: Array<{ value: BuoiHocStatus; label: string }> = [
  { value: "chua_bat_dau", label: "Chưa bắt đầu" },
  { value: "da_xong", label: "Đã xong" },
  { value: "nghi", label: "Nghỉ" },
  { value: "bu", label: "Bù" },
];

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

export function LichHocDieuChinhPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [classInput, setClassInput] = useState("");
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editStatus, setEditStatus] = useState<Record<string, BuoiHocStatus>>(
    {},
  );
  const [editNote, setEditNote] = useState<Record<string, string>>({});
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const hasInitializedDefaultSelectionRef = useRef(false);

  const { data: classesData, isLoading: isLoadingClasses } = useCreditClasses({
    search: "",
    page: 1,
    perPage: 100,
  });

  const {
    data: sessions = [],
    isFetching: isFetchingSessions,
    isError: isSessionsError,
    error: sessionsError,
  } = useCreditClassSessions(selectedSectionId);

  const { mutate: updateSession, isPending: isUpdating } =
    useUpdateCreditClassSession();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClassDropdownOpen(false);
      }
    }

    if (isClassDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClassDropdownOpen]);

  useEffect(() => {
    setIsClassDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const statusMap: Record<string, BuoiHocStatus> = {};
    const noteMap: Record<string, string> = {};

    sessions.forEach((session) => {
      statusMap[session.id] = session.status;
      noteMap[session.id] = session.note ?? "";
    });

    setEditStatus(statusMap);
    setEditNote(noteMap);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sessions;

    return sessions.filter((item) => {
      const text = [
        item.statusLabel,
        item.roomName,
        item.note,
        formatDateTime(item.sessionDate),
        formatDateTime(item.startTime),
        formatDateTime(item.endTime),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [sessions, search]);

  const selectedClass = classesData?.data?.find(
    (item) => item.id === selectedSectionId,
  );

  useEffect(() => {
    if (hasInitializedDefaultSelectionRef.current) return;

    const firstClass = classesData?.data?.[0];
    if (!firstClass) return;

    if (!selectedSectionId) {
      setSelectedSectionId(firstClass.id);
      setClassInput(firstClass.tenMonHoc);
    }

    hasInitializedDefaultSelectionRef.current = true;
  }, [classesData?.data, selectedSectionId]);

  useEffect(() => {
    if (!selectedClass) return;
    setClassInput(selectedClass.tenMonHoc);
  }, [selectedClass]);

  const filteredClassOptions = useMemo(() => {
    const classes = classesData?.data ?? [];
    const keyword = classInput.trim().toLowerCase();
    const selectedClassName =
      selectedClass?.tenMonHoc.trim().toLowerCase() ?? "";

    if (!keyword || keyword === selectedClassName) return classes;

    return classes.filter((lop) => {
      const text = `${lop.tenMonHoc} ${lop.maLop}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [classesData?.data, classInput, selectedClass]);

  const handleSave = (sessionId: string) => {
    const status = editStatus[sessionId];
    if (!selectedSectionId || !status) {
      notify.error("Thiếu thông tin cập nhật buổi học");
      return;
    }

    updateSession({
      sectionId: selectedSectionId,
      sessionId,
      dto: {
        status,
        note: editNote[sessionId] ?? "",
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2>Điều chỉnh lịch học</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/lich-hoc")}
          className="px-4 py-2 rounded-lg border border-border bg-white text-sm hover:bg-slate-50 transition-colors"
        >
          Về lịch học
        </button>
      </div>

      {isSessionsError && (
        <ErrorState
          message={
            (sessionsError as Error)?.message ??
            "Không thể tải danh sách buổi học"
          }
        />
      )}

      <div className="bg-white rounded-xl p-4 border border-border mb-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">Lớp tín chỉ</label>
            <div ref={classDropdownRef} className="relative">
              <input
                value={classInput}
                onChange={(e) => {
                  setClassInput(e.target.value);
                  setSelectedSectionId("");
                }}
                onFocus={() => setIsClassDropdownOpen(true)}
                disabled={isLoadingClasses}
                placeholder={
                  isLoadingClasses
                    ? "Đang tải lớp tín chỉ..."
                    : "Chọn lớp tín chỉ"
                }
                className="w-full px-3 pr-10 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 disabled:opacity-70 disabled:cursor-not-allowed"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
              </span>

              {isClassDropdownOpen && !isLoadingClasses && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-white shadow-xl z-20">
                  {filteredClassOptions.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Không tìm thấy lớp tín chỉ phù hợp
                    </p>
                  ) : (
                    filteredClassOptions.map((lop) => (
                      <button
                        key={lop.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/40 transition"
                        onClick={() => {
                          setSelectedSectionId(lop.id);
                          setClassInput(lop.tenMonHoc);
                          setIsClassDropdownOpen(false);
                        }}
                      >
                        <p className="text-sm text-gray-800 truncate">
                          {lop.tenMonHoc}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lop.maLop}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          {/* <div>
            <label className="block mb-1 text-sm">Tìm trong buổi học</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo ngày, phòng, trạng thái, ghi chú..."
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              disabled={!selectedSectionId}
            />
          </div> */}
        </div>

        {selectedClass && (
          <p className="text-xs text-muted-foreground mt-3"></p>
        )}
      </div>

      {selectedSectionId ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                    Buổi
                  </th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                    Thời gian
                  </th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                    Phòng
                  </th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                    Ghi chú
                  </th>
                  <th className="text-center py-3 px-4 font-normal text-muted-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isFetchingSessions ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tải buổi học...
                      </div>
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Không có buổi học phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 px-4">Buổi {idx + 1}</td>
                      <td className="py-3 px-4">
                        <div>{formatDateTime(item.sessionDate)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(item.startTime)} -{" "}
                          {formatDateTime(item.endTime)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.roomName || "Chưa có phòng"}
                      </td>
                      <td className="py-3 px-4">
                        <PortableSelect
                          value={editStatus[item.id] ?? item.status}
                          onChange={(e) =>
                            setEditStatus((prev) => ({
                              ...prev,
                              [item.id]: e.target.value as BuoiHocStatus,
                            }))
                          }
                          className="w-full min-w-[140px] px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                          labelClassName="text-sm"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </PortableSelect>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          value={editNote[item.id] ?? ""}
                          onChange={(e) =>
                            setEditNote((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="Nhập ghi chú"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition disabled:opacity-60"
                        >
                          {/* <Save className="w-4 h-4" /> */}
                          Lưu
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border py-10 px-6 text-center text-muted-foreground shadow-sm">
          Vui lòng chọn lớp tín chỉ để hiển thị các buổi học.
        </div>
      )}
    </div>
  );
}
