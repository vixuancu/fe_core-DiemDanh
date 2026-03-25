import React, { useState, useMemo } from 'react';
import {
  useSchedules,
  useScheduleOptions,
  useCreateSchedule,
  useDeleteSchedule,
} from '@/features/schedules/hooks/useSchedules';
import type { CreateLichHocDto } from '@/features/schedules/types';
import { caHocLabels } from '@/shared/types';
import { Plus, Edit, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PortableSelect } from './ui/portable-form-controls';
import { localDateToYmd } from '@/shared/lib/date-time';

// ─── Constants & Utils ───────────────────────────────────────────────────────

const daysOfWeek = [2, 3, 4, 5, 6, 7, 8];
const caHocs = ['Sáng', 'Chiều', 'Tối'] as const;
const caHocTiet: Record<string, string> = {
  'Sáng': '',
  'Chiều': '',
  'Tối': '',
};

const thuLabels: Record<number, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật',
};

function generateWeeksList() {
  const semesterStart = new Date(2025, 11, 22); // 22/12/2025 - start of semester
  const weeks: { weekNumber: number; startDate: Date; endDate: Date; label: string }[] = [];
  
  let weekNum = 52;
  let current = new Date(semesterStart);
  
  for (let i = 0; i < 20; i++) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    
    const formatDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    
    weeks.push({
      weekNumber: weekNum,
      startDate: start,
      endDate: end,
      label: `Tuần thứ: ${weekNum} (Từ ngày ${formatDate(start)} đến ngày ${formatDate(end)})`,
    });
    
    current.setDate(current.getDate() + 7);
    weekNum = weekNum >= 53 ? 2 : weekNum + 1;
  }
  
  return weeks;
}

function getWeekDatesFromStart(startDate: Date) {
  return daysOfWeek.map((thu, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return {
      thu,
      date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
      label: `${thuLabels[thu]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    };
  });
}

const caHocOptions = ['Sáng', 'Chiều', 'Tối'] as const;

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

// ─── Add/Edit Schedule Modal ─────────────────────────────────────────────────

const EMPTY_FORM: CreateLichHocDto = {
  lopTinChiId: '', phongHocId: '', ngayHoc: '', caHoc: 'Sáng', tietBatDau: 1, tietKetThuc: 4
};

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateLichHocDto>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  
  const { lopOptions, phongOptions, isLoading: isOptionsLoading } = useScheduleOptions();
  const { mutate: create, isPending } = useCreateSchedule();

  const handleSave = () => {
    if (!form.lopTinChiId || !form.phongHocId || !form.ngayHoc || !form.caHoc || !form.tietBatDau || !form.tietKetThuc) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (form.tietBatDau > form.tietKetThuc) {
      setFormError('Tiết bắt đầu không thể lớn hơn tiết kết thúc');
      return;
    }
    create(form, {
      onSuccess: () => onClose(),
      onError: (err: Error) => setFormError(err.message),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2">
          <h3>Thêm lịch dạy mới</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        {formError && <ErrorState message={formError} />}

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Lớp tín chỉ <span className="text-red-500">*</span></label>
            <PortableSelect
              value={form.lopTinChiId}
              onChange={e => setForm({ ...form, lopTinChiId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm"
              labelClassName="text-sm"
            >
              <option value="">-- Chọn lớp tín chỉ --</option>
              {lopOptions.map(l => (
                <option key={l.id} value={l.id}>{l.tenMonHoc} ({l.maLop}) - GV: {l.tenGiangVien}</option>
              ))}
            </PortableSelect>
          </div>

          <div>
            <label className="block mb-1 text-sm">Phòng học <span className="text-red-500">*</span></label>
            <PortableSelect
              value={form.phongHocId}
              onChange={e => setForm({ ...form, phongHocId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm"
              labelClassName="text-sm"
            >
              <option value="">-- Chọn phòng học --</option>
              {phongOptions.map(p => (
                <option key={p.id} value={p.id}>{p.tenPhong}</option>
              ))}
            </PortableSelect>
          </div>

          <div>
            <label className="block mb-1 text-sm">Ngày học <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.ngayHoc}
              onChange={e => setForm({ ...form, ngayHoc: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm">Ca học <span className="text-red-500">*</span></label>
              <PortableSelect
                value={form.caHoc}
                onChange={e => setForm({ ...form, caHoc: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm"
                labelClassName="text-sm"
              >
                {caHocOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </PortableSelect>
            </div>
            <div>
              <label className="block mb-1 text-sm">Tiết bắt đầu</label>
              <input
                type="number" min="1" max="15"
                value={form.tietBatDau}
                onChange={e => setForm({ ...form, tietBatDau: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Tiết kết thúc</label>
              <input
                type="number" min="1" max="15"
                value={form.tietKetThuc}
                onChange={e => setForm({ ...form, tietKetThuc: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} disabled={isPending || isOptionsLoading} className="px-4 py-2 rounded-lg border hover:bg-muted text-sm cursor-pointer">Hủy</button>
          <button onClick={handleSave} disabled={isPending || isOptionsLoading} className="px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu lịch dạy
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LichHocPage() {
  const { user } = useAuth();
  const isAdminOrVu = user?.role === 'admin' || user?.role === 'giao_vu';
  const isGiangVien = user?.role === 'giang_vien';

  const weeksList = useMemo(() => generateWeeksList(), []);
  
  // Find the current week 
  const defaultWeekIdx = weeksList.findIndex(w => {
    const today = new Date();
    // Offset by timezone safely
    const tzToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return tzToday >= w.startDate && tzToday <= w.endDate;
  });
  
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(defaultWeekIdx >= 0 ? defaultWeekIdx : 0);
  
  const selectedWeek = weeksList[selectedWeekIdx];
  const weekDates = selectedWeek ? getWeekDatesFromStart(selectedWeek.startDate) : [];

  const formatDateForApi = (d: Date) => {
    return localDateToYmd(d);
  };
  
  const tuNgay = selectedWeek ? formatDateForApi(selectedWeek.startDate) : '';
  const denNgay = selectedWeek ? formatDateForApi(selectedWeek.endDate) : '';

  const [showModal, setShowModal] = useState(false);

  const giangVienIdFilter = isGiangVien ? user.id : undefined;

  const { data, isLoading: isSchedulesLoading, isError, error } = useSchedules({
    tuNgay,
    denNgay,
    giangVienId: giangVienIdFilter,
    perPage: 100 // Tùy chỉnh phân trang sau
  });
  
  const { phongOptions: dsPhong, isLoading: isOptionsLoading } = useScheduleOptions();
  const isLoading = isSchedulesLoading || isOptionsLoading;

  const { mutate: deleteSchedule } = useDeleteSchedule();
  const schedules = data?.data ?? [];

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Xóa lịch dạy môn "${name}"? Các điểm danh thuộc lịch này cũng bị mất.`)) {
      deleteSchedule(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2>{isGiangVien ? 'Lịch dạy' : 'Quản lý lịch dạy'}</h2>
          {/* {isGiangVien && <p className="text-sm text-muted-foreground mt-1">Hiển thị lịch giảng dạy của {user.hoTen}</p>} */}
        </div>
        
        {isAdminOrVu && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" /> Thêm lịch dạy
          </button>
        )}
      </div>

      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu lịch dạy'} />}

      {/* Week selector dropdown */}
      <div className="bg-white rounded-xl p-4 md:p-5 border border-border mb-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 w-full max-w-xl">
          <label className="text-sm font-medium text-muted-foreground shrink-0">Tuần học:</label>
          <PortableSelect
            value={selectedWeekIdx}
            onChange={e => setSelectedWeekIdx(Number(e.target.value))}
            className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9] hover:bg-slate-50 transition-colors cursor-pointer"
            labelClassName="text-sm"
          >
            {weeksList.map((w, i) => (
              <option key={i} value={i}>{w.label}</option>
            ))}
          </PortableSelect>
        </div>
      </div>

      {/* Schedule Grid Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 font-medium">Đang tải lịch dạy...</span>
            </div>
          ) : isGiangVien ? (
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border py-4 px-2 text-center font-normal text-muted-foreground uppercase text-xs w-20 md:w-28">CA HỌC</th>
                  {weekDates.map(d => (
                    <th key={d.thu} className="border border-border py-4 px-1.5 text-center text-muted-foreground">
                      <div className="font-normal uppercase text-[13px]">{thuLabels[d.thu]}</div>
                      <div className="text-xs font-normal mt-1">{d.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caHocs.map(ca => (
                  <tr key={ca}>
                    <td className="border border-border py-4 px-2 text-center align-middle bg-slate-50/10">
                      <div className="font-semibold text-sm text-slate-700">{ca}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{caHocTiet[ca]}</div>
                    </td>
                    {daysOfWeek.map(thu => {
                      const lessons = schedules.filter(l => l.thu === thu && l.caHoc === ca);
                      return (
                        <td key={thu} className="border border-border p-2 align-top h-auto bg-white min-h-[140px]">
                          {lessons.map(lesson => (
                            <div key={lesson.id} className="bg-[#f0f9ff]/5 border border-[#009dd9]/20 shadow-sm rounded-xl p-3 mb-2 last:mb-0 flex flex-col justify-between">
                              <p className="text-[13px] font-bold text-slate-700 text-center break-words mb-2">{lesson.tenMonHoc}</p>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[11px] text-slate-500 text-center shrink-0">
                                  Tiết: <span className="text-slate-600">{lesson.tietBatDau}-{lesson.tietKetThuc}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 text-center break-all shrink-0">
                                  Mã lớp: <span className="text-slate-600">{lesson.maLop}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 text-center break-words shrink-0 mt-1">
                                  Phòng: <span className="text-slate-600">{lesson.tenPhong}</span>
                                </p>
                              </div>
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
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-border" />
                      </svg>
                      <div className="absolute top-3 right-3 text-[11px] font-normal text-muted-foreground uppercase">Ngày</div>
                      <div className="absolute bottom-3 left-3 text-[11px] font-normal text-muted-foreground uppercase">Phòng</div>
                    </div>
                  </th>
                  {weekDates.map(d => (
                    <th key={d.thu} className="border border-border py-4 px-1.5 text-center text-muted-foreground">
                      <div className="font-normal uppercase text-[13px]">{thuLabels[d.thu]}</div>
                      <div className="text-xs font-normal mt-1">{d.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dsPhong.map(phong => {
                  return (
                    <tr key={phong.id}>
                      <td className="border border-border py-4 px-2 text-center align-middle font-medium text-xs text-slate-700 bg-slate-50/10">
                        {phong.tenPhong}
                      </td>
                      {daysOfWeek.map(thu => {
                        const lessons = schedules.filter(l => l.thu === thu && l.phongHocId === phong.id);
                        return (
                          <td key={thu} className="border border-border py-2 px-2 align-top bg-white min-h-[140px]">
                            {lessons.map(lesson => (
                              <div key={lesson.id} className="bg-[#f0f9ff]/50 border border-[#009dd9]/20 rounded-xl p-3 mb-2 last:mb-0 flex flex-col justify-between mx-auto w-full max-w-[95%]">
                                <p className="text-[13px] font-bold text-slate-700 text-center break-words mb-2">{lesson.tenMonHoc}</p>
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[11px] text-slate-500 text-center shrink-0">
                                    Tiết: <span className="text-slate-600">{lesson.tietBatDau}-{lesson.tietKetThuc}</span>
                                  </p>
                                  <p className="text-[11px] text-slate-500 text-center break-all shrink-0">
                                    Mã lớp: <span className="text-slate-600">{lesson.maLop}</span>
                                  </p>
                                  <p className="text-[11px] text-slate-500 text-center break-words shrink-0 mt-1">
                                    GV: <span className="text-slate-600">{lesson.tenGiangVien}</span>
                                  </p>
                                </div>
                                
                                <div className="flex justify-center gap-3 mt-3 pt-2 border-t border-[#009dd9]/10 shrink-0">
                                  <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="Sửa">
                                    <Edit className="w-[14px] h-[14px]" />
                                  </button>
                                  <button onClick={() => handleDelete(lesson.id, lesson.tenMonHoc)} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer" title="Xóa">
                                    <Trash2 className="w-[14px] h-[14px]" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
