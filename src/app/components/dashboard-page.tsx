import React, { useMemo, useRef } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAttendances } from "@/features/attendances/hooks/useAttendances";
import { useCreditClasses } from "@/features/credit-classes/hooks/useCreditClasses";
import { useSchedules } from "@/features/schedules/hooks/useSchedules";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { useReportOverview } from "@/features/reports/hooks/useReports";
import {
  Users,
  GraduationCap,
  BookOpen,
  Camera,
  CheckCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { trangThaiLabels } from "@/shared/types";
import { formatDateVi } from "@/shared/lib/date-time";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white rounded-lg shadow-lg border border-border p-3 text-sm max-w-xs">
        <p className="mb-0.5">{data?.fullName}</p>
        <p className="text-xs text-muted-foreground mb-2">{data?.maLop}</p>
        <p className="text-green-600">Có mặt: {data?.coMat}</p>
        <p className="text-yellow-600">Đi trễ: {data?.tre}</p>
        <p className="text-red-600">Vắng: {data?.vang}</p>
      </div>
    );
  }
  return null;
};

export function DashboardPage() {
  const { user } = useAuth();
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const isGiangVien = user?.role === "giang_vien";

  // Fetch dữ liệu cần thiết qua hooks
  const { data: creditClassesData, isLoading: isLoadingClasses } =
    useCreditClasses({
      giangVienId: isGiangVien ? user?.id : undefined,
      perPage: 100,
    });
  const myClasses = creditClassesData?.data ?? [];

  const { data: attendancesData, isLoading: isLoadingAtnd } = useAttendances({
    giangVienId: isGiangVien ? user?.id : undefined,
    perPage: 1000,
  });
  const attendances = attendancesData?.data ?? [];

  const { data: schedulesData, isLoading: isLoadingSched } = useSchedules({
    giangVienId: isGiangVien ? user?.id : undefined,
    perPage: 100,
  });
  const mySchedule = schedulesData?.data ?? [];

  const { data: roomsData, isLoading: isLoadingRooms } = useRooms({
    perPage: 100,
  });
  const rooms = roomsData?.data ?? [];

  const { data: overviewData, isLoading: isLoadingOverview } =
    useReportOverview(!isGiangVien);

  const isLoading =
    isLoadingClasses ||
    isLoadingAtnd ||
    isLoadingSched ||
    isLoadingRooms ||
    isLoadingOverview;

  const scrollChart = (dir: number) => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
    }
  };

  // Tính toán dữ liệu Pie Chart
  const pieData = useMemo(
    () => [
      {
        name: "Có mặt",
        value: attendances.filter((d) => d.trangThai === "co_mat").length,
        color: "#22c55e",
      },
      {
        name: "Đi trễ",
        value: attendances.filter((d) => d.trangThai === "tre").length,
        color: "#eab308",
      },
      {
        name: "Vắng",
        value: attendances.filter((d) => d.trangThai === "vang").length,
        color: "#ef4444",
      },
    ],
    [attendances],
  );

  // Tính toán dữ liệu Bar Chart
  const barData = useMemo(() => {
    return myClasses.map((lop) => {
      const records = attendances.filter((d) => d.maLop === lop.maLop);
      return {
        name:
          lop.tenMonHoc.length > 12
            ? lop.tenMonHoc.substring(0, 12) + "..."
            : lop.tenMonHoc,
        fullName: lop.tenMonHoc,
        maLop: lop.maLop,
        coMat: records.filter((r) => r.trangThai === "co_mat").length,
        tre: records.filter((r) => r.trangThai === "tre").length,
        vang: records.filter((r) => r.trangThai === "vang").length,
      };
    });
  }, [myClasses, attendances]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Giảng viên dashboard
  if (isGiangVien) {
    const today = new Date().getDay();
    // JS getDay(): 0=Sun, 1=Mon... thu = today + 1 (thu 2-7, CN=8)
    const currentThu = today === 0 ? 8 : today + 1;
    const scheduleToday = mySchedule.filter((l) => l.thu === currentThu);

    // Giả sử lấy số buổi đã điểm danh là số buổi có record điểm danh trong ngày hôm nay
    const todayStr = new Date().toLocaleDateString("vi-VN");
    const checkedInCount = new Set(
      attendances.filter((a) => a.ngay === todayStr).map((a) => a.lichHocId),
    ).size;

    return (
      <div>
        <h2 className="mb-6">Xin chào, {user?.hoTen}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#009dd9]/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[#009dd9]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Lịch dạy hôm nay
                </p>
                <p className="text-2xl">{scheduleToday.length} buổi</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Đã điểm danh (hôm nay)
                </p>
                <p className="text-2xl">
                  {checkedInCount} / {scheduleToday.length} buổi
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lớp đang dạy</p>
                <p className="text-2xl">{myClasses.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-border">
          <h3 className="mb-4">Lịch dạy sắp tới (7 ngày)</h3>
          {mySchedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có lịch dạy nào.
            </p>
          ) : (
            <div className="space-y-3">
              {mySchedule.slice(0, 5).map((lich) => (
                <div
                  key={lich.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#009dd9]/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs text-[#009dd9]">T{lich.thu}</span>
                    <span className="text-sm text-[#009dd9]">{lich.caHoc}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{lich.tenMonHoc}</p>
                    <p className="text-xs text-muted-foreground">
                      Mã lớp: {lich.maLop} - Ngày: {formatDateVi(lich.ngayHoc)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm">{lich.tenPhong}</p>
                    <p className="text-xs text-muted-foreground">
                      Tiết {lich.tietBatDau}-{lich.tietKetThuc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin / Giáo vụ dashboard
  const statCards = [
    {
      label: "Sinh viên",
      value: overviewData?.student_total ?? 0,
      icon: <GraduationCap className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      label: "Giảng viên",
      value: overviewData?.lecturer_total ?? 0,
      icon: <Users className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      label: "Lớp tín chỉ",
      value: overviewData?.course_section_total ?? myClasses.length,
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-purple-500",
    },
    ...(user?.role === "admin"
      ? [
          {
            label: "Camera",
            value: `${overviewData?.camera_online ?? 0}/${overviewData?.camera_total ?? 0}`,
            icon: <Camera className="w-6 h-6" />,
            color: "bg-orange-500",
          },
        ]
      : [
          {
            label: "Phòng học",
            value: overviewData?.room_total ?? rooms.length,
            icon: <Camera className="w-6 h-6" />,
            color: "bg-orange-500",
          },
        ]),
  ];

  const chartWidth = Math.max(600, barData.length * 160);

  return (
    <div>
      <h2 className="mb-6">Tổng quan</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 border border-border"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center text-white`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {attendances.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3>Thống kê điểm danh theo lớp</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollChart(-1)}
                  className="p-1.5 rounded-lg hover:bg-muted transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => scrollChart(1)}
                  className="p-1.5 rounded-lg hover:bg-muted transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div
              ref={chartScrollRef}
              className="overflow-x-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <div style={{ width: chartWidth, minWidth: "100%" }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="coMat"
                      name="Có mặt"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="tre"
                      name="Đi trễ"
                      fill="#eab308"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="vang"
                      name="Vắng"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-border">
            <h3 className="mb-4">Tỷ lệ điểm danh</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent attendance */}
      <div className="bg-white rounded-xl p-5 border border-border">
        <h3 className="mb-4">Điểm danh gần đây</h3>
        {attendances.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có bản ghi điểm danh nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-normal">
                    Mã SV
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-normal">
                    Họ tên
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-normal">
                    Mã lớp tín chỉ
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-normal">
                    Ngày
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-normal">
                    Thời gian
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-normal">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendances.slice(0, 6).map((dd) => (
                  <tr
                    key={dd.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4">{dd.maSV}</td>
                    <td className="py-3 px-4">{dd.hoTenSV}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs">
                        {dd.tenMonHoc || dd.maLop}
                      </span>
                    </td>
                    <td className="py-3 px-4">{dd.ngay}</td>
                    <td className="py-3 px-4">{dd.thoiGian || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          dd.trangThai === "co_mat"
                            ? "bg-green-100 text-green-700"
                            : dd.trangThai === "tre"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {trangThaiLabels[dd.trangThai]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
