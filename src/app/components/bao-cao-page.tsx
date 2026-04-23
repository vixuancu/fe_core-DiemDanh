import React, { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCreditClasses } from '@/features/credit-classes/hooks/useCreditClasses';
import { FileSpreadsheet, BarChart3, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { PortableDateInput, PortableSelect } from './ui/portable-form-controls';
import { buildPaginationItems } from '@/shared/lib/pagination';
import { reportService } from '@/features/reports/services';
import {
  useClassSummary,
  useReportDetails,
  useReportStats,
  useWeeklyTrend,
} from '@/features/reports/hooks/useReports';

const perPageOptions = [10, 20, 30, 40];

export function BaoCaoPage() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const canFilterByLecturer = user?.role === 'giang_vien';

  const { data: classesData } = useCreditClasses({
    giangVienId: canFilterByLecturer ? user?.id : undefined,
    perPage: 100
  });
  const myClasses = classesData?.data ?? [];

  const reportFilter = useMemo(
    () => ({
      course_section_id: selectedClassId || undefined,
      from_date: dateFrom || undefined,
      to_date: dateTo || undefined,
      page: currentPage,
      per_page: perPage,
    }),
    [selectedClassId, dateFrom, dateTo, currentPage, perPage]
  );

  const { data: reportStatsData, isLoading: isLoadingStats } = useReportStats(reportFilter, showReport);
  const { data: weeklyTrendData, isLoading: isLoadingWeekly } = useWeeklyTrend(reportFilter, showReport);
  const { data: classSummaryData, isLoading: isLoadingClassSummary } = useClassSummary(
    { from_date: dateFrom || undefined, to_date: dateTo || undefined },
    showReport
  );
  const {
    data: reportDetailsData,
    isLoading: isLoadingDetails,
    isFetching: isFetchingDetails,
  } = useReportDetails(reportFilter, showReport);

  const isLoading = isLoadingStats || isLoadingWeekly || isLoadingClassSummary || isLoadingDetails;

  const reportData = reportDetailsData?.data ?? [];
  const meta = {
    total: reportDetailsData?.total ?? 0,
    page: currentPage,
    lastPage: reportDetailsData?.totalPages ?? Math.max(currentPage, 1),
  };

  const paginationItems = React.useMemo(
    () => buildPaginationItems(meta.page, meta.lastPage, 1, 1),
    [meta.page, meta.lastPage]
  );

  React.useEffect(() => {
    if (reportDetailsData && currentPage > meta.lastPage) {
      setCurrentPage(meta.lastPage > 0 ? meta.lastPage : 1);
    }
  }, [currentPage, meta.lastPage, reportDetailsData]);

  const reportStats = reportStatsData ?? {
    total_records: 0,
    co_mat: 0,
    tre: 0,
    vang: 0,
  };

  const classData = useMemo(
    () =>
      (classSummaryData ?? []).map((row) => {
        const label = row.course_name || row.course_section_name;
        return {
          name: label.length > 18 ? `${label.slice(0, 18)}...` : label,
          fullName: label,
          tyLe: Number(row.attendance_rate ?? 0),
        };
      }),
    [classSummaryData]
  );

  const weeklyData = useMemo(
    () =>
      (weeklyTrendData ?? []).map((w, idx) => ({
        tuan: w.week_label || `Tuần ${idx + 1}`,
        coMat: Number(w.co_mat ?? 0),
        tre: Number(w.tre ?? 0),
        vang: Number(w.vang ?? 0),
      })),
    [weeklyTrendData]
  );

  const chartTickInterval = weeklyData.length > 18 ? 2 : weeklyData.length > 10 ? 1 : 0;
  const classChartHeight = Math.max(300, classData.length * 48);

  const handleCreateReport = () => {
    setShowReport(true);
    setCurrentPage(1);
  };

  const handleExportExcel = async () => {
    if (isExportingExcel || reportData.length === 0) return;

    try {
      setIsExportingExcel(true);

      const exportRows = [] as typeof reportData;
      const firstPage = await reportService.getDetails({
        ...reportFilter,
        page: 1,
        per_page: 100,
      });

      exportRows.push(...firstPage.data);

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await reportService.getDetails({
          ...reportFilter,
          page,
          per_page: 100,
        });
        exportRows.push(...nextPage.data);
      }

      const XLSX = await import('xlsx');
      const headers = [
        'STT',
        'Mã SV',
        'Họ tên',
        'Môn học',
        'Lớp tín chỉ',
        'Ngày',
        'Thời gian',
        'Trạng thái',
      ];

      const body = exportRows.map((row, idx) => [
        idx + 1,
        row.student_code,
        row.student_name,
        row.course_name,
        row.course_section_name,
        row.session_date,
        row.attendance_time ?? '-',
        row.status_label,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'bao_cao_diem_danh');

      const from = dateFrom || 'all';
      const to = dateTo || 'all';
      XLSX.writeFile(workbook, `bao-cao-diem-danh-${from}-${to}.xlsx`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6">Báo cáo thống kê</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl p-5 border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block mb-1 text-sm">Lớp tín chỉ</label>
            <PortableSelect
              value={selectedClassId}
              onChange={e => { setSelectedClassId(e.target.value); setShowReport(false); }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              <option value="">Tất cả lớp</option>
              {myClasses.map(l => (
                <option key={l.id} value={l.id}>{l.tenMonHoc} ({l.maLop})</option>
              ))}
            </PortableSelect>
          </div>
          <div>
            <label className="block mb-1 text-sm">Từ ngày</label>
            <PortableDateInput
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setShowReport(false); }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Đến ngày</label>
            <PortableDateInput
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setShowReport(false); }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreateReport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] text-sm transition cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" /> Tạo báo cáo
            </button>
          </div>
        </div>
      </div>

      {showReport ? isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-border text-center">
              <p className="text-3xl text-[#009dd9]">
                {reportStats.total_records > 0 ? Math.round((reportStats.co_mat / reportStats.total_records) * 1000) / 10 : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tỷ lệ có mặt</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-border text-center">
              <p className="text-3xl text-yellow-600">
                {reportStats.total_records > 0 ? Math.round((reportStats.tre / reportStats.total_records) * 1000) / 10 : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tỷ lệ đi trễ</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-border text-center">
              <p className="text-3xl text-red-600">
                {reportStats.total_records > 0 ? Math.round((reportStats.vang / reportStats.total_records) * 1000) / 10 : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tỷ lệ vắng</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-border text-center">
              <p className="text-3xl">{reportStats.total_records}</p>
              <p className="text-sm text-muted-foreground mt-1">Tổng lượt điểm danh dự kiến</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl p-5 border border-border">
              <h3 className="mb-4">Xu hướng điểm danh theo tuần (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tuan" interval={chartTickInterval} minTickGap={18} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="coMat" name="Có mặt" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="tre" name="Đi trễ" stroke="#eab308" strokeWidth={2} />
                  <Line type="monotone" dataKey="vang" name="Vắng" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-5 border border-border">
              <h3 className="mb-4">Tỷ lệ có mặt trung bình theo lớp (%)</h3>
              <div className="max-h-[320px] overflow-y-auto pr-1">
                <ResponsiveContainer width="100%" height={classChartHeight}>
                  <BarChart data={classData} layout="vertical" margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={160} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Tỷ lệ có mặt']} labelFormatter={(label) => {
                      const found = classData.find((item) => item.name === label);
                      return found?.fullName || label;
                    }} />
                    <Bar dataKey="tyLe" fill="#009dd9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Danh sách điểm danh chi tiết */}
          <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3>Danh sách điểm danh chi tiết</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  disabled={reportData.length === 0 || isExportingExcel}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 transition text-sm cursor-pointer disabled:opacity-50"
                >
                  {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  Xuất Excel
                </button>
              </div>
            </div>
            
            {reportData.length === 0 ? (
               <div className="py-12 text-center text-muted-foreground">Không có dữ liệu trong thời gian này</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">STT</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Mã SV</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Họ tên</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Môn học</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Ngày</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Thời gian</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((dd, i) => (
                      <tr key={dd.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4">{(meta.page - 1) * perPage + i + 1}</td>
                        <td className="py-3 px-4">{dd.student_code}</td>
                        <td className="py-3 px-4">{dd.student_name}</td>
                        <td className="py-3 px-4">{dd.course_name || dd.course_section_name}</td>
                        <td className="py-3 px-4">{dd.session_date}</td>
                        <td className="py-3 px-4">{dd.attendance_time || '-'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              dd.status_label === 'Có mặt'
                                ? 'bg-green-100 text-green-700'
                                : dd.status_label === 'Đi trễ'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : dd.status_label === 'Có phép'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {dd.status_label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportData.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                      Hiển thị {(meta.page - 1) * perPage + 1}-{Math.min(meta.page * perPage, meta.total)} / {meta.total}
                      {isFetchingDetails ? ' (đang tải...)' : ''}
                    </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">Số bản ghi:</span>
                    <PortableSelect
                      value={perPage}
                      onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-1 rounded border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[72px]"
                      labelClassName="text-sm"
                    >
                      {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </PortableSelect>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {paginationItems.map((item, idx) => (
                    item === '...'
                      ? <span key={`ellipsis-${idx}`} className="w-8 h-8 inline-flex items-center justify-center text-muted-foreground">...</span>
                      : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`w-8 h-8 rounded-lg text-sm cursor-pointer ${currentPage === item ? 'bg-[#009dd9] text-white' : 'hover:bg-muted'}`}
                        >
                          {item}
                        </button>
                      )
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(meta.lastPage, p + 1))} disabled={currentPage === meta.lastPage} className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-border text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Chọn lớp tín chỉ, khoảng thời gian và nhấn "Tạo báo cáo" để xem kết quả</p>
        </div>
      )}
    </div>
  );
}
