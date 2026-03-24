import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCreditClasses } from '@/features/credit-classes/hooks/useCreditClasses';
import { useAttendances, useUpdateAttendance } from '@/features/attendances/hooks/useAttendances';
import { Download, FileText, ChevronLeft, ChevronRight, X, Pencil, Save, Ban, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PortableDateInput, PortableSelect } from './ui/portable-form-controls';
import type { DiemDanh } from '@/features/attendances/types';
import { TrangThaiDiemDanh } from '@/shared/types';
import { formatDateVi, parseDateStringToLocalDate } from '@/shared/lib/date-time';

const statusCode: Record<string, string> = {
  co_mat: 'C',
  tre: 'M',
  vang: 'V',
};

const statusColor: Record<string, string> = {
  co_mat: 'text-green-600',
  tre: 'text-yellow-600',
  vang: 'text-red-600',
};

const statusBg: Record<string, string> = {
  co_mat: 'bg-green-50',
  tre: 'bg-yellow-50',
  vang: 'bg-red-50',
};

const statusOrder = ['co_mat', 'tre', 'vang'] as const;

// Helper: parse dd/mm/yyyy to Date
const parseDDMMYYYY = (dateStr: string): Date | null => {
  if (dateStr.includes('-')) {
    return parseDateStringToLocalDate(dateStr);
  }
  // format dd/mm/yyyy
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
};

const parseInputDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  return parseDateStringToLocalDate(dateStr);
};

interface CellData {
  trangThai: TrangThaiDiemDanh;
  ghiChu: string;
}

export function KetQuaDiemDanhPage() {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Lớp tín chỉ của giảng viên
  const { data: creditClassesData } = useCreditClasses({
    giangVienId: user?.role === 'giang_vien' ? user.id : undefined,
    perPage: 100
  });
  const myClasses = creditClassesData?.data ?? [];

  const [selectedLopId, setSelectedLopId] = useState('');
  
  // Set default selected class when loaded
  React.useEffect(() => {
    if (myClasses.length > 0 && !selectedLopId) {
      setSelectedLopId(myClasses[0].id);
    }
  }, [myClasses, selectedLopId]);

  const selectedLop = myClasses.find(l => l.id === selectedLopId);

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Fetch attendances cho maLop
  const { data: attendanceData, isLoading } = useAttendances({
    maLop: selectedLop?.maLop,
    perPage: 1000, // Lấy nhiều record cho bảng cross
  });
  const classAttendance = attendanceData?.data ?? [];

  const { mutate: updateStatus } = useUpdateAttendance();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, Record<string, CellData>>>({});

  // Filter by date range
  const filteredAttendance = useMemo(() => {
    return classAttendance.filter(d => {
      const recordDate = parseDDMMYYYY(d.ngay);
      if (!recordDate) return true;
      const fromDate = parseInputDate(filterDateFrom);
      const toDate = parseInputDate(filterDateTo);
      if (fromDate) {
        fromDate.setHours(0, 0, 0, 0);
        if (recordDate < fromDate) return false;
      }
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        if (recordDate > toDate) return false;
      }
      return true;
    });
  }, [classAttendance, filterDateFrom, filterDateTo]);

  // Get unique dates sorted
  const dates = useMemo(() => {
    const unique = [...new Set(filteredAttendance.map(d => d.ngay))] as string[];
    return unique.sort((a, b) => {
      const da = parseDDMMYYYY(a);
      const db = parseDDMMYYYY(b);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });
  }, [filteredAttendance]);

  // Get students list
  const students = useMemo(() => {
    const svIds = [...new Set(filteredAttendance.map(d => d.sinhVienId))];
    return svIds.map(id => {
      const record = filteredAttendance.find(d => d.sinhVienId === id);
      return {
        sinhVienId: id,
        maSV: record?.maSV || '',
        hoTen: record?.hoTenSV || '',
      };
    }).sort((a, b) => a.maSV.localeCompare(b.maSV)); // Sort by maSV
  }, [filteredAttendance]);

  // Build attendance matrix: studentId -> date -> { trangThai, ghiChu, id }
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, CellData & { id: string }>> = {};
    filteredAttendance.forEach(d => {
      if (!m[d.sinhVienId]) m[d.sinhVienId] = {};
      m[d.sinhVienId][d.ngay] = { id: d.id, trangThai: d.trangThai, ghiChu: d.ghiChu || '' };
    });
    return m;
  }, [filteredAttendance]);

  // activeData uses editData if in editing mode
  const activeData = isEditing ? editData : matrix;

  const getSummary = (svId: string) => {
    const records = activeData[svId] || {};
    let coMat = 0, tre = 0, vang = 0;
    (Object.values(records) as CellData[]).forEach(cell => {
      if (cell.trangThai === 'co_mat') coMat++;
      else if (cell.trangThai === 'tre') tre++;
      else vang++;
    });
    return { coMat, tre, vang };
  };

  const getCombinedNote = (svId: string) => {
    const records = activeData[svId] || {};
    return dates
      .map(date => ({ date, note: records[date]?.ghiChu?.trim() || '' }))
      .filter(item => item.note)
      .map(item => `${item.date}: ${item.note}`)
      .join(' | ');
  };

  const scrollDates = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  const startEditing = useCallback(() => {
    const clone: Record<string, Record<string, CellData>> = {};
    for (const svId of Object.keys(matrix)) {
      clone[svId] = {};
      for (const date of Object.keys(matrix[svId])) {
         clone[svId][date] = { trangThai: matrix[svId][date].trangThai, ghiChu: matrix[svId][date].ghiChu };
      }
    }
    setEditData(clone);
    setIsEditing(true);
  }, [matrix]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditData({});
  }, []);

  const saveEditing = useCallback(() => {
    // Loop through editData and find changed cells compared to matrix
    for (const svId of Object.keys(editData)) {
      for (const date of Object.keys(editData[svId])) {
        const editedCell = editData[svId][date];
        const originalCell = matrix[svId]?.[date];
        
        if (originalCell && editedCell.trangThai !== originalCell.trangThai) {
           // update API
           updateStatus({ id: originalCell.id, dto: { trangThai: editedCell.trangThai } });
        }
      }
    }
    setIsEditing(false);
    setEditData({});
  }, [editData, matrix, updateStatus]);

  const cycleStatus = useCallback((svId: string, date: string) => {
    if (!isEditing) return;
    setEditData(prev => {
      const next = { ...prev };
      if (!next[svId]) next[svId] = {};
      const current = next[svId][date]?.trangThai || 'co_mat';
      const idx = statusOrder.indexOf(current);
      const newStatus = statusOrder[(idx + 1) % statusOrder.length];
      next[svId] = { ...next[svId] };
      next[svId][date] = { ...next[svId][date], trangThai: newStatus };
      return next;
    });
  }, [isEditing]);

  const exportExcel = () => {
    if (!selectedLop) return;

    const headers = ['STT', 'Mã sinh viên', 'Họ và tên', ...dates, 'Thống kê', 'Ghi chú'];
    const rows = students.map((sv, i) => {
      const summary = getSummary(sv.sinhVienId);
      const dateValues = dates.map(d => {
        const cell = activeData[sv.sinhVienId]?.[d];
        return cell ? statusCode[cell.trangThai] : '-';
      });
      const statsText = `C:${summary.coMat} M:${summary.tre} V:${summary.vang}`;
      return [i + 1, sv.maSV, sv.hoTen, ...dateValues, statsText, getCombinedNote(sv.sinhVienId)];
    });

    const wsData = [
      [`DANH SÁCH ĐIỂM DANH`],
      [`Môn học: ${selectedLop.tenMonHoc}`],
      [`Mã lớp tín chỉ: ${selectedLop.maLop}`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Điểm danh');

    const colWidths = headers.map((h, i) => {
      let max = h.length;
      rows.forEach(r => {
        const val = String(r[i] || '');
        if (val.length > max) max = val.length;
      });
      return { wch: Math.max(max + 2, 10) };
    });
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `diem-danh-${selectedLop.maLop}.xlsx`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Kết quả điểm danh</h2>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={startEditing}
              disabled={!selectedLop || students.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Pencil className="w-4 h-4" /> Chỉnh sửa
            </button>
          ) : (
            <>
              <button
                onClick={saveEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> Lưu
              </button>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 transition cursor-pointer"
              >
                <Ban className="w-4 h-4" /> Hủy
              </button>
            </>
          )}
          <button
            onClick={exportExcel}
            disabled={!selectedLop || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button
            onClick={() => window.print()}
            disabled={!selectedLop || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> Xuất PDF
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Chế độ chỉnh sửa:</strong> Click vào ô trạng thái để đổi (C → M → V). Nhấn <strong>Lưu</strong> khi xong.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Môn học</label>
            <PortableSelect
              value={selectedLopId}
              onChange={e => { setSelectedLopId(e.target.value); setFilterDateFrom(''); setFilterDateTo(''); cancelEditing(); }}
              className="w-full px-4 pr-10 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              {myClasses.length === 0 ? <option value="">Không có lớp</option> : null}
              {myClasses.map(l => (
                <option key={l.id} value={l.id}>
                  {l.tenMonHoc} - {l.maLop}
                </option>
              ))}
            </PortableSelect>
          </div>
          {selectedLop && (
            <div className="text-sm flex flex-col justify-center">
              <p><span className="text-muted-foreground">Mã lớp tín chỉ:</span> {selectedLop.maLop}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground shrink-0">Từ ngày</label>
            <PortableDateInput
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="w-[170px] px-3 pr-10 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground shrink-0">Đến ngày</label>
            <PortableDateInput
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="w-[170px] px-3 pr-10 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            />
          </div>
          {(filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[#009dd9] hover:bg-[#009dd9]/5 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl py-12 border border-border text-center flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : selectedLop && students.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden print:border-0 print:rounded-none">
          {dates.length > 3 && (
            <div className="flex items-center justify-end gap-1 px-4 pt-3">
              <span className="text-xs text-muted-foreground mr-2">Vuốt ngang để xem thêm</span>
              <button onClick={() => scrollDates(-1)} className="p-1.5 rounded-lg hover:bg-muted transition cursor-pointer border border-border">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => scrollDates(1)} className="p-1.5 rounded-lg hover:bg-muted transition cursor-pointer border border-border">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="overflow-hidden">
            <div className="flex">
              <div className="shrink-0 z-10 bg-white border-r border-border">
                <table className="text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border-b border-border py-3 px-3 text-center font-normal text-muted-foreground w-12">STT</th>
                      <th className="border-b border-border py-3 px-3 text-left font-normal text-muted-foreground min-w-[140px]">Mã SV</th>
                      <th className="border-b border-border py-3 px-3 text-left font-normal text-muted-foreground min-w-[160px]">Họ và tên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((sv, i) => (
                      <tr key={sv.sinhVienId} className="hover:bg-muted/30">
                        <td className="border-b border-border py-2.5 px-3 text-center">{i + 1}</td>
                        <td className="border-b border-border py-2.5 px-3">{sv.maSV}</td>
                        <td className="border-b border-border py-2.5 px-3">{sv.hoTen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div ref={scrollRef} className="overflow-x-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
                <table className="text-sm border-collapse min-w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      {dates.map(d => {
                        const showDate = d.includes('-') ? formatDateVi(d) : d;
                        return (
                          <th key={d} className="border-b border-l border-border py-3 px-3 text-center font-normal text-muted-foreground min-w-[80px] whitespace-nowrap">
                            {showDate}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((sv) => (
                      <tr key={sv.sinhVienId} className="hover:bg-muted/30">
                        {dates.map(d => {
                          const cell = activeData[sv.sinhVienId]?.[d];
                          const status = cell?.trangThai;

                          return (
                            <td
                              key={d}
                              className={`border-b border-l border-border py-2.5 px-3 text-center ${status ? statusBg[status] : ''} ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-[#009dd9]/40 hover:ring-inset' : ''}`}
                              onClick={() => cycleStatus(sv.sinhVienId, d)}
                              title={isEditing ? 'Click để đổi' : cell?.ghiChu}
                            >
                              {status ? (
                                <span className={`text-sm font-medium ${statusColor[status]}`}>{statusCode[status]}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="shrink-0 z-10 bg-white border-l border-border">
                <table className="text-sm border-collapse table-fixed">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border-b border-border py-3 px-4 text-center font-normal text-muted-foreground min-w-[130px]">Thống kê</th>
                      <th className="border-b border-l border-border py-3 px-4 text-left font-normal text-muted-foreground w-[320px] min-w-[320px] max-w-[320px]">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((sv) => {
                      const summary = getSummary(sv.sinhVienId);
                      const note = getCombinedNote(sv.sinhVienId);
                      return (
                        <tr key={sv.sinhVienId} className="hover:bg-muted/30">
                          <td className="border-b border-border py-2.5 px-4 text-center whitespace-nowrap">
                            <span className="text-green-600 text-xs">C:{summary.coMat}</span>
                            <span className="mx-1 text-muted-foreground">|</span>
                            <span className="text-yellow-600 text-xs">M:{summary.tre}</span>
                            <span className="mx-1 text-muted-foreground">|</span>
                            <span className="text-red-600 text-xs">V:{summary.vang}</span>
                          </td>
                          <td className="border-b border-l border-border py-2.5 px-4 text-left w-[320px] min-w-[320px] max-w-[320px]" title={note || undefined}>
                            <span className="block truncate text-xs text-gray-600">{note || '—'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-border text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Chưa có kết quả điểm danh nào</p>
        </div>
      )}
    </div>
  );
}
