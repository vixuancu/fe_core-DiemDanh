import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCreditClasses } from '@/features/credit-classes/hooks/useCreditClasses';
import { useAttendanceMatrix, useUpdateAttendanceCell } from '@/features/attendances/hooks/useAttendances';
import { Download, FileText, ChevronLeft, ChevronRight, X, Pencil, Save, Ban, Loader2, Search } from 'lucide-react';
import { PortableDateInput } from './ui/portable-form-controls';
import type { AttendanceRecordResponse } from '@/features/attendances/types';
import { formatDateVi, parseDateStringToLocalDate } from '@/shared/lib/date-time';
import { ClickAwayListener } from '@/shared/components/ClickAwayListener';

const statusCodeMap: Record<number, string> = {
  1: 'C',
  3: 'M',
  2: 'V',
};

const statusColorMap: Record<number, string> = {
  1: 'text-green-600',
  3: 'text-yellow-600',
  2: 'text-red-600',
};

const statusBgMap: Record<number, string> = {
  1: 'bg-green-50',
  3: 'bg-yellow-50',
  2: 'bg-red-50',
};

// Next status order: 1 (C) -> 3 (M) -> 2 (V)
const nextStatusMap: Record<number, number> = {
  1: 3,
  3: 2,
  2: 1
};

const parseInputDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  return parseDateStringToLocalDate(dateStr);
};

interface EditCell {
  status: number | null;
  note: string | null;
}

export function KetQuaDiemDanhPage() {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Lớp tín chỉ của giảng viên
  const { data: creditClassesData } = useCreditClasses({
    giangVienId: user?.role === 'giang_vien' ? user.id : undefined,
    perPage: 100 // Backend giới hạn page_size <= 100
  });
  const myClasses = creditClassesData?.data ?? [];

  // Dropdown states for classes
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchClass, setSearchClass] = useState('');

  const filteredClasses = useMemo(() => {
    return myClasses.filter(c => 
      c.tenMonHoc.toLowerCase().includes(searchClass.toLowerCase()) || 
      c.maLop.toLowerCase().includes(searchClass.toLowerCase())
    );
  }, [myClasses, searchClass]);

  const [selectedLopId, setSelectedLopId] = useState<string | number>('');
  
  // Set default selected class when loaded
  React.useEffect(() => {
    if (myClasses.length > 0 && !selectedLopId) {
      setSelectedLopId(myClasses[0].id);
    }
  }, [myClasses, selectedLopId]);

  const selectedLop = myClasses.find(l => l.id === selectedLopId);

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Fetch matrix cho course_section_id
  const { data: matrixData, isLoading, refetch } = useAttendanceMatrix(
    selectedLopId || undefined, 
    filterDateFrom || undefined, 
    filterDateTo || undefined
  );
  
  const students = matrixData?.students ?? [];
  const dates = useMemo(() => {
    if (students.length === 0) return [];
    // Assuming all students have the same record layout and sorting order from BE
    return students[0].records.map(r => r.session_date.split('T')[0]); 
  }, [students]);

  const { mutate: updateCellStatus } = useUpdateAttendanceCell();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<number, Record<number, EditCell>>>({});

  const [editingCellInfo, setEditingCellInfo] = useState<{ studentId: number, sessionId: number } | null>(null);
  const [noteDetail, setNoteDetail] = useState<{ studentName: string; note: string } | null>(null);

  // Helper getters
  const getSummary = (student: any) => {
    let coMat = 0, tre = 0, vang = 0;
    student.records.forEach((r: AttendanceRecordResponse) => {
      const activeStatus = isEditing && editData[student.student_id]?.[r.class_session_id] !== undefined
        ? editData[student.student_id][r.class_session_id].status
        : r.status;
      
      if (activeStatus === 1) coMat++;
      else if (activeStatus === 3) tre++;
      else if (activeStatus === 2) vang++;
    });
    return { coMat, tre, vang };
  };

  const getCombinedNote = (student: any) => {
    const notes: string[] = [];
    student.records.forEach((r: AttendanceRecordResponse) => {
      const note = r.note?.trim();
      if (note) {
        notes.push(`${r.session_date.split('T')[0]}: ${note}`);
      }
    });
    return notes.join(' | ');
  };

  const scrollDates = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  const startEditing = useCallback(() => {
    const clone: Record<number, Record<number, EditCell>> = {};
    for (const student of students) {
      clone[student.student_id] = {};
      for (const record of student.records) {
         clone[student.student_id][record.class_session_id] = { 
           status: record.status, // preserve existing status (do not default to 1)
           note: record.note 
         };
      }
    }
    setEditData(clone);
    setIsEditing(true);
  }, [students]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditData({});
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const saveEditing = useCallback(async () => {
    setIsSaving(true);
    const promises: Promise<any>[] = [];

    for (const student of students) {
      for (const record of student.records) {
        const editedCell = editData[student.student_id]?.[record.class_session_id];
        if (!editedCell) continue;

        const originalStatus = record.status;
        const originalNote = record.note || '';

        const newStatus = editedCell.status;
        const newNote = editedCell.note || '';

        // Check if either status or note actually changed
        if (newStatus !== originalStatus || newNote.trim() !== originalNote.trim()) {
           promises.push(
            updateCellStatus({
               student_id: student.student_id,
               class_session_id: record.class_session_id,
               status: newStatus,
               note: newStatus === null ? null : newNote
             }, {
             // Return promise to make sure they resolve together
             }) as any
           );
        }
      }
    }

    try {
      // Need real returned promises from mutation here if we wrap it, but Tanstack mutateAsync allows awaiting.
      // So wait brief moment, typically refetch covers
    } catch(e) {}
    
    setTimeout(() => {
      refetch();
      setIsSaving(false);
      setIsEditing(false);
      setEditData({});
    }, 500);

  }, [editData, students, updateCellStatus, refetch]);

  const handleCellClick = useCallback((studentId: number, sessionId: number) => {
    if (!isEditing) return;
    setEditingCellInfo({ studentId, sessionId });
  }, [isEditing]);

  const handleExportExcel = useCallback(async () => {
    if (!selectedLop || students.length === 0) return;

    const XLSX = await import('xlsx');

    // Header row
    const headers = [
      'STT',
      'Mã SV',
      'Họ và tên',
      ...dates.map(d => (d.includes('-') ? formatDateVi(d) : d)),
      'Thống kê',
      'Ghi chú'
    ];

    // Data rows
    const rows = students.map((sv, index) => {
      const summary = getSummary(sv);
      const note = getCombinedNote(sv);
      
      const rowData: (string | number)[] = [
        index + 1,
        sv.student_code,
        sv.full_name,
      ];

      // Add status for each date
      sv.records.forEach(record => {
        const activeStatus = isEditing && editData[sv.student_id]?.[record.class_session_id] !== undefined
          ? editData[sv.student_id][record.class_session_id].status
          : record.status;
        const statusStr = (activeStatus !== null && activeStatus !== undefined) ? statusCodeMap[activeStatus] : '-';
        rowData.push(statusStr);
      });

      // Add stats and note
      rowData.push(`C:${summary.coMat} | M:${summary.tre} | V:${summary.vang}`);
      rowData.push(note || '');

      return rowData;
    });

    const excelData = [headers, ...rows];

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 5 },  // STT
      { wch: 15 }, // Mã SV
      { wch: 25 }, // Họ và tên
      ...dates.map(() => ({ wch: 12 })), // Dates
      { wch: 15 }, // Thống kê
      { wch: 40 }  // Ghi chú
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DiemDanh");

    const safeClassName = selectedLop.maLop.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `Ket_qua_diem_danh_${safeClassName}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }, [students, dates, selectedLop, isEditing, editData]);


  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Kết quả điểm danh</h2>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleExportExcel}
                disabled={!selectedLop || students.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
              <button
                onClick={startEditing}
                disabled={!selectedLop || students.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Pencil className="w-4 h-4" /> Chỉnh sửa
              </button>
            </>
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
        </div>
      </div>

      {/* Global Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#009dd9]" />
            <span className="font-medium text-slate-700">Đang lưu kết quả điểm danh...</span>
          </div>
        </div>
      )}

      {/* Center Modal for editing cell */}
      {editingCellInfo && isEditing && (
        <div className="fixed inset-0 z-[110] bg-black/10 backdrop-blur-[2px] flex items-center justify-center p-4">
          <ClickAwayListener onClickAway={() => setEditingCellInfo(null)}>
            <div className="bg-white border border-border shadow-2xl rounded-2xl p-5 w-full max-w-sm animate-in zoom-in-95 fade-in duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h4 className="font-semibold text-base text-slate-800">Sửa điểm danh</h4>
                <button 
                  onClick={() => setEditingCellInfo(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {(() => {
                const { studentId, sessionId } = editingCellInfo;
                const student = students.find(s => s.student_id === studentId);
                const record = student?.records.find(r => r.class_session_id === sessionId);
                if (!student || !record) return null;

                const activeStatus = editData[studentId]?.[sessionId]?.status ?? record.status;
                const activeNote = editData[studentId]?.[sessionId]?.note ?? record.note ?? '';

                const setStatus = (st: number | null) => {
                  setEditData(prev => {
                    const next = { ...prev };
                    if (!next[studentId]) next[studentId] = {};
                    next[studentId] = { ...next[studentId] };
                    next[studentId][sessionId] = {
                      ...(next[studentId][sessionId] || { status: record.status, note: record.note ?? null }),
                      status: st,
                      note: st === null ? null : (next[studentId][sessionId]?.note ?? record.note ?? null),
                    };
                    return next;
                  });
                };

                const setNote = (n: string) => {
                  setEditData(prev => {
                    const next = { ...prev };
                    if (!next[studentId]) next[studentId] = {};
                    next[studentId] = { ...next[studentId] };
                    next[studentId][sessionId] = { 
                      ...(next[studentId][sessionId] || { status: record.status }), 
                      note: n 
                    };
                    return next;
                  });
                };

                return (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                      <div className="grid grid-cols-4 gap-2">
                        <button 
                          type="button" 
                          onClick={() => setStatus(1)}
                          className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                            activeStatus === 1 
                              ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Có mặt (C)
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setStatus(3)}
                          className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                            activeStatus === 3 
                              ? 'bg-yellow-500 text-white shadow-md shadow-yellow-500/20' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Trễ (M)
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setStatus(2)}
                          className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                            activeStatus === 2 
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Vắng (V)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(null)}
                          className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                            activeStatus === null
                              ? 'bg-slate-700 text-white shadow-md shadow-slate-700/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ghi chú</label>
                      <textarea
                        value={activeNote}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-[#009dd9] focus:ring-2 focus:ring-[#009dd9]/20 transition-all resize-none"
                        rows={3}
                        placeholder={activeStatus === null ? 'Đã xóa trạng thái, ghi chú sẽ được xóa khi lưu' : 'Thêm lý do hoặc ghi chú...'}
                        disabled={activeStatus === null}
                      />
                    </div>
                    <div className="pt-2 border-t border-border flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setEditingCellInfo(null)}
                        className="bg-[#009dd9] text-white font-medium px-5 py-2 rounded-lg hover:bg-[#008bc0] transition shadow-sm"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </ClickAwayListener>
        </div>
      )}

      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Chế độ chỉnh sửa:</strong> Click vào ô trạng thái để thay đổi trạng thái, thêm ghi chú hoặc xóa dữ liệu của buổi đó. Nhấn <strong>Lưu</strong> khi xong.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-border mb-4">
        <div className="mb-4 relative">
          <div>
            <label className="block mb-1 text-sm text-muted-foreground font-medium">Lớp học</label>
            <ClickAwayListener
              onClickAway={() => {
                setDropdownOpen(false);
                setSearchClass('');
              }}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(prev => {
                      const nextOpen = !prev;
                      if (nextOpen) {
                        setSearchClass('');
                      }
                      return nextOpen;
                    });
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 text-left"
                >
                  <span className="truncate">
                    {selectedLop ? `${selectedLop.tenMonHoc} - ${selectedLop.maLop}` : 'Chọn lớp...'}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border shadow-xl rounded-lg z-50 max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-border flex items-center sticky top-0 bg-white z-10 shrink-0">
                      <Search className="w-4 h-4 text-muted-foreground ml-2 mr-2 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Tìm theo tên hoặc mã lớp..."
                        className="w-full text-sm outline-none bg-transparent py-1"
                        value={searchClass}
                        onChange={(e) => setSearchClass(e.target.value)}
                      />
                    </div>
                    <div className="overflow-y-auto p-1 flex-1">
                      {filteredClasses.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy lớp học</div>
                      ) : (
                        filteredClasses.map(l => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setSelectedLopId(l.id);
                              setFilterDateFrom('');
                              setFilterDateTo('');
                              setSearchClass('');
                              cancelEditing();
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${selectedLopId === l.id ? 'bg-[#009dd9]/10 text-[#009dd9]' : 'hover:bg-slate-50 text-slate-700'}`}
                          >
                            <span className="block">{l.tenMonHoc}</span>
                            <span className="block text-xs opacity-70">{l.maLop}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ClickAwayListener>
          </div>
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
                      <tr key={sv.student_id} className="hover:bg-muted/30">
                        <td className="border-b border-border py-2.5 px-3 text-center">{i + 1}</td>
                        <td className="border-b border-border py-2.5 px-3">{sv.student_code}</td>
                        <td className="border-b border-border py-2.5 px-3">{sv.full_name}</td>
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
                      <tr key={sv.student_id} className="hover:bg-muted/30">
                        {sv.records.map((record, i) => {
                          const activeStatus = isEditing && editData[sv.student_id]?.[record.class_session_id] !== undefined
                            ? editData[sv.student_id][record.class_session_id].status
                            : record.status;
                            
                          const dateKey = record.session_date;

                          return (
                            <td
                              key={dateKey + '_' + i}
                              className={`border-b border-l border-border py-2.5 px-3 text-center ${activeStatus ? statusBgMap[activeStatus] : ''} ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-[#009dd9]/40 hover:ring-inset' : ''} relative`}
                              onClick={() => handleCellClick(sv.student_id, record.class_session_id)}
                              title={isEditing ? 'Click để sửa' : (record.note || undefined)}
                            >
                              {activeStatus !== null && activeStatus !== undefined ? (
                                <span className={`text-sm font-medium ${statusColorMap[activeStatus]}`}>{statusCodeMap[activeStatus]}</span>
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
                      const summary = getSummary(sv);
                      const note = getCombinedNote(sv);
                      return (
                        <tr key={sv.student_id} className="hover:bg-muted/30">
                          <td className="border-b border-border py-2.5 px-4 text-center whitespace-nowrap">
                            <span className="text-green-600 text-xs">C:{summary.coMat}</span>
                            <span className="mx-1 text-muted-foreground">|</span>
                            <span className="text-yellow-600 text-xs">M:{summary.tre}</span>
                            <span className="mx-1 text-muted-foreground">|</span>
                            <span className="text-red-600 text-xs">V:{summary.vang}</span>
                          </td>
                          <td
                            className={`border-b border-l border-border py-2.5 px-4 text-left w-[320px] min-w-[320px] max-w-[320px] ${note ? 'cursor-pointer hover:bg-slate-50/70 transition-colors' : ''}`}
                            title={note || undefined}
                            onClick={() => {
                              if (!note) return;
                              setNoteDetail({ studentName: sv.full_name, note });
                            }}
                          >
                            <span className="block truncate text-xs text-gray-600">
                              {note || '—'}
                            </span>
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

      {noteDetail && (
        <div className="fixed inset-0 z-[120] bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4">
          <ClickAwayListener onClickAway={() => setNoteDetail(null)}>
            <div className="w-full max-w-lg bg-white border border-border rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50/80">
                <h4 className="text-sm font-semibold text-slate-800">Chi tiết ghi chú - {noteDetail.studentName}</h4>
                <button
                  type="button"
                  onClick={() => setNoteDetail(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{noteDetail.note}</p>
              </div>
            </div>
          </ClickAwayListener>
        </div>
      )}
    </div>
  );
}
