import React, { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNavigate } from "react-router";
import { PortableSelect } from "./ui/portable-form-controls";
import { useCreditClasses } from "@/features/credit-classes/hooks/useCreditClasses";
import { creditClassService } from "@/features/credit-classes/services";
import type {
  LopTinChi,
  LopTinChiBuoiHoc,
  LopTinChiSchedule,
} from "@/features/credit-classes/types";

type CaHoc = "Sáng" | "Chiều" | "Tối";

interface TimetableLesson {
  id: string;
  lopTinChiId: string;
  maLop: string;
  tenMonHoc: string;
  giangVienId: string;
  tenGiangVien: string;
  phongHocId: string;
  tenPhong: string;
  ngayHoc: string; // YYYY-MM-DD
  thu: number; // 2-8
  caHoc: CaHoc;
  tietBatDau: number;
  tietKetThuc: number;
  status?: LopTinChiBuoiHoc["status"];
}

const daysOfWeek = [2, 3, 4, 5, 6, 7, 8];
const caHocs: CaHoc[] = ["Sáng", "Chiều", "Tối"];
const caHocTiet: Record<CaHoc, string> = {
  Sáng: "Tiết 1-4",
  Chiều: "Tiết 5-8",
  Tối: "Tiết 9-13",
};

const thuLabels: Record<number, string> = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
  8: "Chủ nhật",
};

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function formatYmd(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveCaHoc(startPeriod: number): CaHoc {
  if (startPeriod <= 4) return "Sáng";
  if (startPeriod <= 8) return "Chiều";
  return "Tối";
}

function getLessonBorderClass(status?: LopTinChiBuoiHoc["status"]): string {
  if (status === "nghi") return "border border-red-500";
  if (status === "bu") return "border border-purple-500";
  return "border border-[#009dd9]/20";
}

function getLessonCardClasses(status?: LopTinChiBuoiHoc["status"]): string {
  if (status === "nghi") return "bg-red-500 text-white border-red-600";
  if (status === "bu") return "bg-purple-500 text-white border-purple-600";
  return "bg-[#f0f9ff]/5 text-slate-700 border-[#009dd9]/20";
}

function getLessonTextClasses(status?: LopTinChiBuoiHoc["status"]): string {
  return status === "nghi" || status === "bu" ? "text-white" : "text-slate-700";
}

function getLessonMutedTextClasses(
  status?: LopTinChiBuoiHoc["status"],
): string {
  return status === "nghi" || status === "bu"
    ? "text-white/90"
    : "text-slate-500";
}

function getLessonValueClasses(status?: LopTinChiBuoiHoc["status"]): string {
  return status === "nghi" || status === "bu" ? "text-white" : "text-slate-600";
}

function getLessonStatusLabel(
  status?: LopTinChiBuoiHoc["status"],
): string | null {
  if (status === "nghi") return "Nghỉ";
  if (status === "bu") return "Bù";
  return null;
}

function getDefaultScheduleRows(lop: LopTinChi): LopTinChiSchedule[] {
  if (lop.schedules && lop.schedules.length > 0) return lop.schedules;
  return [
    {
      dayOfWeek: lop.dayOfWeek,
      startPeriod: lop.startPeriod,
      numberOfPeriods: lop.numberOfPeriods,
      roomId: lop.roomId,
      roomName: lop.tenPhongHoc,
      userId: lop.giangVienId,
      userFullName: lop.tenGiangVien,
    },
  ];
}

function generateWeeksListAroundToday() {
  const today = new Date();
  const currentMonday = new Date(today);
  const weekday = currentMonday.getDay(); // 0 (Sun) ... 6
  const deltaToMonday = weekday === 0 ? -6 : 1 - weekday;
  currentMonday.setDate(currentMonday.getDate() + deltaToMonday);

  const weeks: { startDate: Date; endDate: Date; label: string }[] = [];
  for (let i = -4; i <= 15; i++) {
    const start = new Date(currentMonday);
    start.setDate(currentMonday.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    weeks.push({
      startDate: start,
      endDate: end,
      label: `Từ ${fmt(start)} đến ${fmt(end)}`,
    });
  }

  return weeks;
}

function getWeekDatesFromStart(startDate: Date) {
  return daysOfWeek.map((thu, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return {
      thu,
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
      ymd: dateToYmd(d),
    };
  });
}

export function LichHocPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGiangVien = user?.role === "giang_vien";

  const weeksList = useMemo(() => generateWeeksListAroundToday(), []);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(4); // current week

  const selectedWeek = weeksList[selectedWeekIdx];
  const weekDates = selectedWeek
    ? getWeekDatesFromStart(selectedWeek.startDate)
    : [];

  const { data, isLoading, isError, error } = useCreditClasses({
    search: "",
    page: 1,
    perPage: 100,
  });

  const sectionIds = useMemo(
    () => data?.data?.map((lop) => lop.id) ?? [],
    [data?.data],
  );

  const sessionQueries = useQueries({
    queries: sectionIds.map((sectionId) => ({
      queryKey: ["creditClasses", "sessions", sectionId],
      queryFn: () => creditClassService.listSessions(sectionId),
      enabled: !!sectionId,
    })),
  });

  const sessionsBySection = useMemo(() => {
    const map = new Map<string, Map<string, LopTinChiBuoiHoc>>();

    sessionQueries.forEach((queryResult, index) => {
      const sectionId = sectionIds[index];
      if (!sectionId || !queryResult.data) return;

      const sessionMap = new Map<string, LopTinChiBuoiHoc>();
      queryResult.data.forEach((session) => {
        sessionMap.set(formatYmd(session.sessionDate), session);
      });
      map.set(sectionId, sessionMap);
    });

    return map;
  }, [sectionIds, sessionQueries]);

  const lessons = useMemo(() => {
    if (!data?.data || !selectedWeek) return [] as TimetableLesson[];

    const weekStart = dateToYmd(selectedWeek.startDate);
    const weekEnd = dateToYmd(selectedWeek.endDate);

    const all: TimetableLesson[] = [];

    data.data.forEach((lop) => {
      const sectionStart = formatYmd(lop.startDate);
      const sectionEnd = formatYmd(lop.endDate);
      if (!sectionStart || !sectionEnd) return;

      if (sectionEnd < weekStart || sectionStart > weekEnd) return;

      const schedules = getDefaultScheduleRows(lop);

      schedules.forEach((schedule, idx) => {
        const thu = schedule.dayOfWeek;
        const dayInWeek = weekDates.find((w) => w.thu === thu);
        if (!dayInWeek) return;

        if (dayInWeek.ymd < sectionStart || dayInWeek.ymd > sectionEnd) return;

        const tietBatDau = schedule.startPeriod;
        const tietKetThuc =
          schedule.endPeriod ??
          schedule.startPeriod + schedule.numberOfPeriods - 1;
        const caHoc = resolveCaHoc(tietBatDau);
        const session = sessionsBySection.get(lop.id)?.get(dayInWeek.ymd);

        all.push({
          id: `${lop.id}-${schedule.id ?? idx}-${dayInWeek.ymd}`,
          lopTinChiId: lop.id,
          maLop: lop.maLop,
          tenMonHoc: lop.tenMonHoc,
          giangVienId: schedule.userId ?? lop.giangVienId,
          tenGiangVien: schedule.userFullName ?? "Chưa có giảng viên",
          phongHocId: schedule.roomId ?? lop.roomId,
          tenPhong: schedule.roomName ?? "Chưa có phòng",
          ngayHoc: dayInWeek.ymd,
          thu,
          caHoc,
          tietBatDau,
          tietKetThuc,
          status: session?.status,
        });
      });
    });

    let filtered = all;
    if (isGiangVien && user?.id) {
      filtered = filtered.filter(
        (item) => item.giangVienId === String(user.id),
      );
    }

    return filtered.sort((a, b) => {
      if (a.ngayHoc !== b.ngayHoc) return a.ngayHoc.localeCompare(b.ngayHoc);
      return a.tietBatDau - b.tietBatDau;
    });
  }, [data?.data, selectedWeek, weekDates, isGiangVien, user?.id]);

  const dsPhong = useMemo(() => {
    const map = new Map<string, { id: string; tenPhong: string }>();
    lessons.forEach((item) => {
      if (!map.has(item.phongHocId)) {
        map.set(item.phongHocId, {
          id: item.phongHocId,
          tenPhong: item.tenPhong,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.tenPhong.localeCompare(b.tenPhong),
    );
  }, [lessons]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2>
            {isGiangVien ? "Lịch dạy theo buổi học" : "Thời khóa biểu buổi học"}
          </h2>
        </div>
        {!isGiangVien && (
          <button
            onClick={() => navigate("/dieu-chinh")}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] transition-colors"
          >
            Điều chỉnh lịch học
          </button>
        )}
      </div>

      {isError && (
        <ErrorState
          message={
            (error as Error)?.message ??
            "Đã xảy ra lỗi khi tải dữ liệu buổi học"
          }
        />
      )}

      <div className="bg-white rounded-xl p-4 md:p-5 border border-border mb-4 shadow-sm">
        <div className="flex items-center gap-4 w-full max-w-3xl">
          <label className="text-sm font-medium text-muted-foreground shrink-0 whitespace-nowrap">
            Tuần học:
          </label>
          <PortableSelect
            value={selectedWeekIdx}
            onChange={(e) => setSelectedWeekIdx(Number(e.target.value))}
            className="w-full md:w-[21rem] lg:w-[26rem] px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9] hover:bg-slate-50 transition-colors cursor-pointer"
            labelClassName="text-sm"
          >
            {weeksList.map((w, i) => (
              <option key={i} value={i}>
                {w.label}
              </option>
            ))}
          </PortableSelect>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 font-medium">
                Đang tải thời khóa biểu...
              </span>
            </div>
          ) : isGiangVien ? (
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border py-4 px-2 text-center font-normal text-muted-foreground uppercase text-xs w-20 md:w-28">
                    CA HỌC
                  </th>
                  {weekDates.map((d) => (
                    <th
                      key={d.thu}
                      className="border border-border py-4 px-1.5 text-center text-muted-foreground"
                    >
                      <div className="font-normal uppercase text-[13px]">
                        {thuLabels[d.thu]}
                      </div>
                      <div className="text-xs font-normal mt-1">{d.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caHocs.map((ca) => (
                  <tr key={ca}>
                    <td className="border border-border py-4 px-2 text-center align-middle bg-slate-50/10">
                      <div className="font-semibold text-sm text-slate-700">
                        {ca}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {caHocTiet[ca]}
                      </div>
                    </td>
                    {daysOfWeek.map((thu) => {
                      const dayLessons = lessons.filter(
                        (l) => l.thu === thu && l.caHoc === ca,
                      );
                      return (
                        <td
                          key={thu}
                          className="border border-border p-2 align-top bg-white min-h-[140px]"
                        >
                          {dayLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`rounded-xl p-3 mb-2 last:mb-0 shadow-sm border ${getLessonCardClasses(lesson.status)}`}
                            >
                              <p
                                className={`text-[13px] font-bold text-center break-words mb-2 ${getLessonTextClasses(lesson.status)}`}
                              >
                                {lesson.tenMonHoc}
                              </p>
                              <p
                                className={`text-[11px] text-center ${getLessonMutedTextClasses(lesson.status)}`}
                              >
                                Tiết:{" "}
                                <span
                                  className={getLessonValueClasses(
                                    lesson.status,
                                  )}
                                >
                                  {lesson.tietBatDau}-{lesson.tietKetThuc}
                                </span>
                              </p>
                              <p
                                className={`text-[11px] text-center break-all ${getLessonMutedTextClasses(lesson.status)}`}
                              >
                                Mã lớp:{" "}
                                <span
                                  className={getLessonValueClasses(
                                    lesson.status,
                                  )}
                                >
                                  {lesson.maLop}
                                </span>
                              </p>
                              <p
                                className={`text-[11px] text-center mt-1 ${getLessonMutedTextClasses(lesson.status)}`}
                              >
                                Phòng:{" "}
                                <span
                                  className={getLessonValueClasses(
                                    lesson.status,
                                  )}
                                >
                                  {lesson.tenPhong}
                                </span>
                              </p>
                              {getLessonStatusLabel(lesson.status) && (
                                <div className="mt-2 flex justify-center">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${lesson.status === "nghi" ? "bg-white/20 text-white" : "bg-white/20 text-white"}`}
                                  >
                                    {getLessonStatusLabel(lesson.status)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border p-0 relative w-32 align-top bg-muted/50">
                    <div className="relative w-full h-full min-h-[64px]">
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="100%"
                          y2="100%"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-border"
                        />
                      </svg>
                      <div className="absolute top-3 right-3 text-[11px] font-normal text-muted-foreground uppercase">
                        Ngày
                      </div>
                      <div className="absolute bottom-3 left-3 text-[11px] font-normal text-muted-foreground uppercase">
                        Phòng
                      </div>
                    </div>
                  </th>
                  {weekDates.map((d) => (
                    <th
                      key={d.thu}
                      className="border border-border py-4 px-1.5 text-center text-muted-foreground"
                    >
                      <div className="font-normal uppercase text-[13px]">
                        {thuLabels[d.thu]}
                      </div>
                      <div className="text-xs font-normal mt-1">{d.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dsPhong.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border border-border py-8 text-center text-muted-foreground"
                    >
                      Không có buổi học trong tuần đã chọn
                    </td>
                  </tr>
                ) : (
                  dsPhong.map((phong) => (
                    <tr key={phong.id}>
                      <td className="border border-border py-4 px-2 text-center align-middle font-medium text-xs text-slate-700 bg-slate-50/10">
                        {phong.tenPhong}
                      </td>
                      {daysOfWeek.map((thu) => {
                        const dayLessons = lessons.filter(
                          (l) => l.thu === thu && l.phongHocId === phong.id,
                        );
                        return (
                          <td
                            key={thu}
                            className="border border-border py-2 px-2 align-top bg-white min-h-[140px]"
                          >
                            {dayLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className={`rounded-xl p-3 mb-2 last:mb-0 mx-auto w-full max-w-[95%] shadow-sm border ${getLessonCardClasses(lesson.status)}`}
                              >
                                <p
                                  className={`text-[13px] font-bold text-center break-words mb-2 ${getLessonTextClasses(lesson.status)}`}
                                >
                                  {lesson.tenMonHoc}
                                </p>
                                <p
                                  className={`text-[11px] text-center ${getLessonMutedTextClasses(lesson.status)}`}
                                >
                                  Tiết:{" "}
                                  <span
                                    className={getLessonValueClasses(
                                      lesson.status,
                                    )}
                                  >
                                    {lesson.tietBatDau}-{lesson.tietKetThuc}
                                  </span>
                                </p>
                                <p
                                  className={`text-[11px] text-center break-all ${getLessonMutedTextClasses(lesson.status)}`}
                                >
                                  Mã lớp:{" "}
                                  <span
                                    className={getLessonValueClasses(
                                      lesson.status,
                                    )}
                                  >
                                    {lesson.maLop}
                                  </span>
                                </p>
                                <p
                                  className={`text-[11px] text-center mt-1 ${getLessonMutedTextClasses(lesson.status)}`}
                                >
                                  GV:{" "}
                                  <span
                                    className={getLessonValueClasses(
                                      lesson.status,
                                    )}
                                  >
                                    {lesson.tenGiangVien}
                                  </span>
                                </p>
                                {getLessonStatusLabel(lesson.status) && (
                                  <div className="mt-2 flex justify-center">
                                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/20 text-white">
                                      {getLessonStatusLabel(lesson.status)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
