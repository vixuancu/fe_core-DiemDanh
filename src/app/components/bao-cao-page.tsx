import React, { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAttendances } from '@/features/attendances/hooks/useAttendances';
import { useCreditClasses } from '@/features/credit-classes/hooks/useCreditClasses';
import { trangThaiLabels, trangThaiColors } from '@/shared/types';
import { FileSpreadsheet, FileText, Download, BarChart3, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { PortableDateInput, PortableSelect } from './ui/portable-form-controls';

const weeklyData = [
  { tuan: 'Tuần 1', coMat: 85, tre: 8, vang: 7 },
  { tuan: 'Tuần 2', coMat: 88, tre: 6, vang: 6 },
  { tuan: 'Tuần 3', coMat: 82, tre: 10, vang: 8 },
  { tuan: 'Tuần 4', coMat: 90, tre: 5, vang: 5 },
  { tuan: 'Tuần 5', coMat: 87, tre: 7, vang: 6 },
  { tuan: 'Tuần 6', coMat: 92, tre: 4, vang: 4 },
  { tuan: 'Tuần 7', coMat: 89, tre: 6, vang: 5 },
  { tuan: 'Tuần 8', coMat: 86, tre: 8, vang: 6 },
];

const perPageOptions = [10, 20, 30, 40];

export function BaoCaoPage() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dateFrom, setDateFrom] = useState(''); // Mặc định có thể nhập sau
  const [dateTo, setDateTo] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const isGiangVien = user?.role === 'giang_vien';
  
  // Fetch classes for dropdown & chart
  const { data: classesData } = useCreditClasses({
    giangVienId: isGiangVien ? user?.id : undefined,
    perPage: 100
  });
  const myClasses = classesData?.data ?? [];

  const selectedClass = myClasses.find(c => c.id === selectedClassId);

  // Note: For large reports, we might just fetch a large "perPage"
  const { data: attendancesData, isLoading } = useAttendances({
    giangVienId: isGiangVien ? user?.id : undefined,
    maLop: selectedClass?.maLop, // Báo cáo có thể chỉ tính theo mã lớp chứ ko phải ID hệ thống
    tuNgay: dateFrom || undefined,
    denNgay: dateTo || undefined,
    page: currentPage,
    perPage: perPage,
  });

  const reportData = attendancesData?.data ?? [];
  const meta = {
    total: attendancesData?.total ?? 0,
    page: attendancesData?.page ?? 1,
    lastPage: attendancesData?.totalPages ?? 1,
  };

  // Calculate stats using useQuery or just mock summary based on all
  // Vì hiện tại API list trả theo trang, ta có thể phải fetch all records cho stats
  // Nhưng để demo, ta mượn luôn mock dữ liệu giả lập cho charts 
  // TODO: Gọi API GetReportStats thật
  const reportStats = {
    total: meta.total * 3, // Fake total number for UI demo if needed, or real from an aggregate API
    coMat: Math.floor(meta.total * 0.8),
    tre: Math.floor(meta.total * 0.1),
    vang: Math.floor(meta.total * 0.1),
  };
  
  // Lấy dữ liệu biểu đồ mock
  const classData = myClasses.map(l => ({
    name: l.tenMonHoc.length > 15 ? l.tenMonHoc.substring(0, 15) + '...' : l.tenMonHoc,
    fullName: l.tenMonHoc,
    tyLe: Math.round(75 + Math.random() * 20),
  }));

  const handleCreateReport = () => {
    setShowReport(true);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['STT', 'Mã SV', 'Họ tên', 'Môn học', 'Ngày', 'Thời gian', 'Trạng thái'];
    const rows = reportData.map((d, i) => [
      i + 1,
      d.maSV,
      d.hoTenSV,
      d.tenMonHoc || d.maLop,
      d.ngay,
      d.thoiGian || '-',
      trangThaiLabels[d.trangThai],
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-diem-danh-${dateFrom || 'all'}-${dateTo || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                {reportStats.total > 0 ? Math.round((reportStats.coMat / reportStats.total) * 1000) / 10 : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tỷ lệ có mặt</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-border text-center">
              <p className="text-3xl text-yellow-600">
                {reportStats.total > 0 ? Math.round((reportStats.tre / reportStats.total) * 1000) / 10 : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tỷ lệ đi trễ</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-border text-center">
              <p className="text-3xl text-red-600">
                {reportStats.total > 0 ? Math.round((reportStats.vang / reportStats.total) * 1000) / 10 : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tỷ lệ vắng</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-border text-center">
              <p className="text-3xl">{reportStats.total}</p>
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
                  <XAxis dataKey="tuan" />
                  <YAxis />
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Tỷ lệ có mặt']} />
                  <Bar dataKey="tyLe" fill="#009dd9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Danh sách điểm danh chi tiết */}
          <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3>Danh sách điểm danh chi tiết</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={reportData.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition text-sm cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Xuất CSV
                </button>
                <button 
                  onClick={() => window.print()}
                  disabled={reportData.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer disabled:opacity-50">
                  <FileText className="w-4 h-4" /> Xuất PDF
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
                        <td className="py-3 px-4">{dd.maSV}</td>
                        <td className="py-3 px-4">{dd.hoTenSV}</td>
                        <td className="py-3 px-4">{dd.tenMonHoc || dd.maLop}</td>
                        <td className="py-3 px-4">{dd.ngay}</td>
                        <td className="py-3 px-4">{dd.thoiGian || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${trangThaiColors[dd.trangThai]}`}>
                            {trangThaiLabels[dd.trangThai]}
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
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={meta.page === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: meta.lastPage }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm cursor-pointer ${meta.page === i + 1 ? 'bg-[#009dd9] text-white' : 'hover:bg-muted'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(meta.lastPage, p + 1))} disabled={meta.page === meta.lastPage} className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
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