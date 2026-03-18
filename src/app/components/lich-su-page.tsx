import React, { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAttendances } from '@/features/attendances/hooks/useAttendances';
import { useCreditClasses } from '@/features/credit-classes/hooks/useCreditClasses';
import { trangThaiLabels, trangThaiColors } from '@/shared/types';
import { Search, ChevronLeft, ChevronRight, Download, FileText, Loader2 } from 'lucide-react';
import { PortableDateInput, PortableSelect } from './ui/portable-form-controls';
import type { TrangThaiDiemDanh } from '@/shared/types';

const perPageOptions = [10, 20, 30, 40];

export function LichSuPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState<TrangThaiDiemDanh | ''>('');
  const [filterMaLop, setFilterMaLop] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const isGiangVien = user?.role === 'giang_vien';
  
  // Fetch classes for dropdown
  const { data: classesData } = useCreditClasses({
    giangVienId: isGiangVien ? user?.id : undefined,
    perPage: 100
  });
  const myClasses = classesData?.data ?? [];

  // Fetch paginated attendances matching filters
  const { data: attendancesData, isLoading } = useAttendances({
    giangVienId: isGiangVien ? user?.id : undefined,
    maLop: filterMaLop || undefined,
    search: search || undefined,
    trangThai: filterTrangThai || undefined,
    tuNgay: filterDateFrom || undefined,
    denNgay: filterDateTo || undefined,
    page: currentPage,
    perPage: perPage
  });

  const attendances = attendancesData?.data ?? [];
  const meta = {
    total: attendancesData?.total ?? 0,
    page: attendancesData?.page ?? 1,
    lastPage: attendancesData?.totalPages ?? 1,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Lịch sử điểm danh</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              let csv = '\uFEFF';
              csv += 'STT,Mã SV,Họ tên,Lớp tín chỉ,Ngày,Thời gian,Trạng thái\n';
              attendances.forEach((dd, i) => {
                csv += `${i + 1},${dd.maSV},${dd.hoTenSV},${dd.maLop},${dd.ngay},${dd.thoiGian || '-'},${trangThaiLabels[dd.trangThai]}\n`;
              });
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'lich-su-diem-danh.csv';
              link.click();
            }}
            disabled={attendances.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={attendances.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-border mb-4">
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input
               value={search}
               onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
               placeholder="Tìm kiếm sinh viên..."
               className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
             />
          </div>
          <div className="min-w-[220px]">
            <PortableSelect
              value={filterMaLop}
              onChange={e => { setFilterMaLop(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 pr-10 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              <option value="">Tất cả lớp tín chỉ</option>
              {myClasses.map(m => <option key={m.id} value={m.maLop}>{m.tenMonHoc} ({m.maLop})</option>)}
            </PortableSelect>
          </div>
          <div className="min-w-[220px]">
            <PortableSelect
              value={filterTrangThai}
              onChange={e => { setFilterTrangThai(e.target.value as TrangThaiDiemDanh); setCurrentPage(1); }}
              className="w-full px-4 pr-10 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="co_mat">Có mặt</option>
              <option value="tre">Đi trễ</option>
              <option value="vang">Vắng</option>
            </PortableSelect>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground shrink-0">Từ ngày</label>
            <PortableDateInput
              value={filterDateFrom}
              onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
              className="px-3 pr-10 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground shrink-0">Đến ngày</label>
            <PortableDateInput
              value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
              className="px-3 pr-10 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            />
          </div>
          {(filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setCurrentPage(1); }}
              className="px-3 py-2 rounded-lg text-sm text-[#009dd9] hover:bg-[#009dd9]/5 transition cursor-pointer"
            >
              Xóa bộ lọc ngày
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : attendances.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Không tìm thấy bản ghi nào</div>
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
                {attendances.map((dd, i) => (
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

        {attendances.length > 0 && (
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
    </div>
  );
}