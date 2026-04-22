import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCreditClasses } from '@/features/credit-classes/hooks/useCreditClasses';
import { useAttendanceMatrix, useUpdateAttendanceCell } from '@/features/attendances/hooks/useAttendances';
import { Download, FileText, ChevronLeft, ChevronRight, X, Pencil, Save, Ban, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PortableDateInput, PortableSelect } from './ui/portable-form-controls';
import type { AttendanceRecordResponse } from '@/features/attendances/types';
import { formatDateVi, parseDateStringToLocalDate } from '@/shared/lib/date-time';

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
    perPage: 100
  });
  const myClasses = creditClassesData?.data ?? [];

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
           status: record.status || 1, // default if null
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

  const saveEditing = useCallback(() => {
    for (const student of students) {
      for (const record of student.records) {
        const editedCell = editData[student.student_id]?.[record.class_session_id];
        
        // Determine if changes occurred. Keep in mind record.status might be null
        const originalStatus = record.status;
        const newStatus = editedCell?.status;

        if (newStatus !== undefined && newStatus !== originalStatus) {
           updateCellStatus({
             student_id: student.student_id,
             class_session_id: record.class_session_id,
             status: newStatus,
             note: editedCell.note
           });
        }
      }
    }
    setIsEditing(false);
    setEditData({});
  }, [editData, students, updateCellStatus]);

  const handleCellClick = useCallback((studentId: number, sessionId: number) => {
    if (!isEditing) return;
    setEditingCellInfo({ studentId, sessionId });
  }, [isEditing]);


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
            <strong>Chế độ chỉnh sửa:</strong> Click vào ô trạng thái để thay đổi trạng thái hoặc thêm ghi chú. Nhấn <strong>Lưu</strong> khi xong.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 text-sm text-muted-foreground">Lớp học</label>
            <PortableSelect
              value={String(selectedLopId)}
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
                              {activeStatus ? (
                                <span className={`text-sm font-medium ${statusColorMap[activeStatus]}`}>{statusCodeMap[activeStatus]}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}

                            {editingCellInfo && editingCellInfo.studentId === sv.student_id && editingCellInfo.sessionId === record.class_session_id && isEditing && (
                              <div 
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-border shadow-xl rounded-lg p-4 z-50 min-w-[280px] text-left"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                                  <h4 className="font-medium text-sm text-slate-800">Sửa điểm danh</h4>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingCellInfo(null); }}
                                    className="p-1 hover:bg-slate-100 rounded-full"
                                  >
                                    <X className="w-4 h-4 text-slate-500" />
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Trạng thái</label>
                                    <div className="flex bg-slate-100 p-1 rounded-md text-center">
                                      <button 
                                        type="button" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditData(prev => {
                                            const next = { ...prev };
                                            if (!next[sv.student_id]) next[sv.student_id] = {};
                                            next[sv.student_id] = { ...next[sv.student_id] };
                                            next[sv.student_id][record.class_session_id] = { ...next[sv.student_id][record.class_session_id], status: 1 };
                                            return next;
                                          });
                                          setEditingCellInfo(null);
                                        }}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded ${activeStatus === 1 ? 'bg-white shadow-sm text-green-600' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        Có mặt (C)
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditData(prev => {
                                            const next = { ...prev };
                                            if (!next[sv.student_id]) next[sv.student_id] = {};
                                            next[sv.student_id] = { ...next[sv.student_id] };
                                            next[sv.student_id][record.class_session_id] = { ...next[sv.student_id][record.class_session_id], status: 3 };
                                            return next;
                                          });
                                          setEditingCellInfo(null);
                                        }}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded ${activeStatus === 3 ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        Trễ (M)
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditData(prev => {
                                            const next = { ...prev };
                                            if (!next[sv.student_id]) next[sv.student_id] = {};
                                            next[sv.student_id] = { ...next[sv.student_id] };
                                            next[sv.student_id][record.class_session_id] = { ...next[sv.student_id][record.class_session_id], status: 2 };
                                            return next;
                                          });
                                          setEditingCellInfo(null);
                                        }}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded ${activeStatus === 2 ? 'bg-white shadow-sm text-red-600' : 'text-slate-600 hover:text-slate-900'}`}
                                      >
                                        Vắng (V)
                                      </button>
                                    </div>
                                  </div>
                                  <div className="pb-1">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Ghi chú</label>
                                    <textarea
                                      value={editData[sv.student_id]?.[record.class_session_id]?.note ?? record.note ?? ''}
                                      onChange={(e) => {
                                        const noteVal = e.target.value;
                                        setEditData(prev => {
                                          const next = { ...prev };
                                          if (!next[sv.student_id]) next[sv.student_id] = {};
                                          next[sv.student_id] = { ...next[sv.student_id] };
                                          next[sv.student_id][record.class_session_id] = { 
                                            ...(next[sv.student_id][record.class_session_id] || { status: record.status || 1 }), 
                                            note: noteVal 
                                          };
                                          return next;
                                        });
                                      }}
                                      className="w-full text-sm border border-slate-200 rounded px-3 py-2 outline-none focus:border-[#009dd9] focus:ring-1 focus:ring-[#009dd9]"
                                      rows={2}
                                      placeholder="Thêm lý do..."
                                    />
                                    <div className="flex justify-end mt-2">
                                      <button 
                                        type="button"
                                        onClick={() => setEditingCellInfo(null)}
                                        className="text-xs bg-[#009dd9] text-white px-3 py-1.5 rounded hover:bg-[#008bc0] transition cursor-pointer"
                                      >
                                        Cập nhật / Đóng
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
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
