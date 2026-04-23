import React, { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCreditClasses } from '@/features/credit-classes/hooks/useCreditClasses';
import { trangThaiLabels, trangThaiColors } from '@/shared/types';
import { Search, ChevronLeft, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import { PortableDateInput, PortableSelect } from './ui/portable-form-controls';
import type { TrangThaiDiemDanh } from '@/shared/types';
import { buildPaginationItems } from '@/shared/lib/pagination';
import { ClickAwayListener } from '@/shared/components/ClickAwayListener';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendances/services';
import type { DiemDanh } from '@/features/attendances/types';

const statusMap: Record<number, TrangThaiDiemDanh> = {
  1: 'co_mat',
  2: 'vang',
  3: 'tre',
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const matchesKeyword = (source: string, keyword: string) => {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return true;
  const sourceNormalized = normalizeText(source);
  return normalizedKeyword
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => sourceNormalized.includes(token));
};

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
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  const isGiangVien = user?.role === 'giang_vien';
  
  // Fetch classes for dropdown
  const { data: classesData } = useCreditClasses({
    giangVienId: isGiangVien ? user?.id : undefined,
    perPage: 100
  });
  const myClasses = classesData?.data ?? [];
  const selectedClass = myClasses.find((m) => m.maLop === filterMaLop);

  const filteredClasses = React.useMemo(() => {
    const keyword = classSearch.trim();
    if (!keyword) return myClasses;

    return myClasses.filter((m) =>
      matchesKeyword(`${m.tenMonHoc} ${m.maLop}`, keyword)
    );
  }, [myClasses, classSearch]);

  const targetClasses = React.useMemo(() => {
    if (filterMaLop) {
      return myClasses.filter((m) => m.maLop === filterMaLop);
    }
    return myClasses;
  }, [myClasses, filterMaLop]);

  const { data: attendanceRows = [], isLoading } = useQuery({
    queryKey: ['attendance-history-matrix', targetClasses.map((m) => m.id), filterDateFrom, filterDateTo],
    enabled: targetClasses.length > 0,
    queryFn: async () => {
      const settled = await Promise.allSettled(
        targetClasses.map(async (creditClass) => {
          const matrix = await attendanceService.getMatrix(
            creditClass.id,
            filterDateFrom || undefined,
            filterDateTo || undefined,
          );

          const rows: DiemDanh[] = [];
          matrix.students.forEach((student) => {
            student.records.forEach((record) => {
              if (record.status == null) return;
              const mappedStatus = statusMap[record.status];
              if (!mappedStatus) return;

              const [datePartRaw, timePartRaw = ''] = record.session_date.split('T');
              const datePart = datePartRaw || record.session_date;
              const timePart = timePartRaw.slice(0, 8);

              rows.push({
                id: String(record.id ?? `${creditClass.id}-${student.student_id}-${record.class_session_id}`),
                sinhVienId: String(student.student_id),
                maSV: student.student_code,
                hoTenSV: student.full_name,
                lichHocId: String(record.class_session_id),
                tenMonHoc: creditClass.tenMonHoc,
                maLop: creditClass.maLop,
                ngay: datePart,
                thoiGian: timePart && timePart !== '00:00:00' ? timePart : '',
                trangThai: mappedStatus,
                ghiChu: record.note ?? undefined,
              });
            });
          });
          return rows;
        }),
      );

      return settled.flatMap((item) => (item.status === 'fulfilled' ? item.value : []));
    },
  });

  const filteredAttendances = React.useMemo(() => {
    return attendanceRows
      .filter((record) => {
        if (filterTrangThai && record.trangThai !== filterTrangThai) return false;
        if (filterDateFrom && record.ngay < filterDateFrom) return false;
        if (filterDateTo && record.ngay > filterDateTo) return false;
        if (
          search &&
          !matchesKeyword(
            `${record.maSV} ${record.hoTenSV} ${record.maLop} ${record.tenMonHoc}`,
            search,
          )
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.ngay === b.ngay) return b.maSV.localeCompare(a.maSV);
        return b.ngay.localeCompare(a.ngay);
      });
  }, [attendanceRows, filterTrangThai, filterDateFrom, filterDateTo, search]);

  const totalRecords = filteredAttendances.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const attendances = filteredAttendances.slice((safePage - 1) * perPage, safePage * perPage);

  const meta = {
    total: totalRecords,
    page: safePage,
    lastPage: totalPages,
  };

  const paginationItems = React.useMemo(
    () => buildPaginationItems(meta.page, meta.lastPage, 1, 1),
    [meta.page, meta.lastPage]
  );

  React.useEffect(() => {
    if (currentPage > meta.lastPage) {
      setCurrentPage(meta.lastPage > 0 ? meta.lastPage : 1);
    }
  }, [currentPage, meta.lastPage]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Lịch sử điểm danh</h2>
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
            <ClickAwayListener
              onClickAway={() => {
                setClassDropdownOpen(false);
                setClassSearch('');
              }}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setClassDropdownOpen((prev) => {
                      const nextOpen = !prev;
                      if (nextOpen) setClassSearch('');
                      return nextOpen;
                    });
                  }}
                  className="w-full flex items-center justify-between px-4 pr-3 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 text-left"
                >
                  <span className="truncate">
                    {selectedClass
                      ? `${selectedClass.tenMonHoc} (${selectedClass.maLop})`
                      : 'Tất cả lớp tín chỉ'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${classDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {classDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border shadow-xl rounded-lg z-50 max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-border flex items-center sticky top-0 bg-white z-10 shrink-0">
                      <Search className="w-4 h-4 text-muted-foreground ml-2 mr-2 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Tìm theo tên hoặc mã lớp..."
                        className="w-full text-sm outline-none bg-transparent py-1"
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                      />
                    </div>

                    <div className="overflow-y-auto p-1 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterMaLop('');
                          setCurrentPage(1);
                          setClassDropdownOpen(false);
                          setClassSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${filterMaLop === '' ? 'bg-[#0b69d0] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        Tất cả lớp tín chỉ
                      </button>

                      {filteredClasses.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy lớp tín chỉ</div>
                      ) : (
                        filteredClasses.map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => {
                              setFilterMaLop(m.maLop);
                              setCurrentPage(1);
                              setClassDropdownOpen(false);
                              setClassSearch('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${filterMaLop === m.maLop ? 'bg-[#0b69d0] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                          >
                            {m.tenMonHoc} ({m.maLop})
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ClickAwayListener>
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
              {paginationItems.map((item, idx) => (
                item === '...'
                  ? <span key={`ellipsis-${idx}`} className="w-8 h-8 inline-flex items-center justify-center text-muted-foreground">...</span>
                  : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 rounded-lg text-sm cursor-pointer ${meta.page === item ? 'bg-[#009dd9] text-white' : 'hover:bg-muted'}`}
                    >
                      {item}
                    </button>
                  )
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
