import React, { useState } from 'react';
import {
  useSchedules,
  useScheduleOptions,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from '@/features/schedules/hooks/useSchedules';
import type { CreateLichHocDto } from '@/features/schedules/types';
import { thuLabels, caHocLabels } from '@/shared/types'; // Phải thêm caHocLabels vào shared/types nếu cần, hoặc tự define
import { Search, Plus, Edit, Trash2, CalendarDays, Clock, MapPin, BookOpen, User as UserIcon, X, ChevronLeft, ChevronRight, Filter, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PortableSelect } from './ui/portable-form-controls';

// ─── Constants & Utils ───────────────────────────────────────────────────────

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
          <h3>Thêm lịch học mới</h3>
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
            Lưu lịch học
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LichHocPage() {
  const { user } = useAuth();
  
  // Khởi tạo ngày đầu tuần và cuối tuần hiện tại
  const today = new Date();
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  const monday = getMonday(today);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  const [tuNgay, setTuNgay] = useState(formatDate(monday));
  const [denNgay, setDenNgay] = useState(formatDate(sunday));
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showModal, setShowModal] = useState(false);

  // Lọc theo giảng viên nếu role là giang_vien
  const giangVienIdFilter = user?.role === 'giang_vien' ? user.id : undefined;

  const { data, isLoading, isError, error } = useSchedules({
    tuNgay,
    denNgay,
    search,
    giangVienId: giangVienIdFilter,
    perPage: 100 // Tùy chỉnh phân trang sau
  });
  
  const { mutate: deleteSchedule } = useDeleteSchedule();

  const schedules = data?.data ?? [];

  const handleNextWeek = () => {
    const nextMon = new Date(tuNgay);
    nextMon.setDate(nextMon.getDate() + 7);
    const nextSun = new Date(denNgay);
    nextSun.setDate(nextSun.getDate() + 7);
    setTuNgay(formatDate(nextMon));
    setDenNgay(formatDate(nextSun));
  };

  const handlePrevWeek = () => {
    const prevMon = new Date(tuNgay);
    prevMon.setDate(prevMon.getDate() - 7);
    const prevSun = new Date(denNgay);
    prevSun.setDate(prevSun.getDate() - 7);
    setTuNgay(formatDate(prevMon));
    setDenNgay(formatDate(prevSun));
  };

  const handleToday = () => {
    setTuNgay(formatDate(monday));
    setDenNgay(formatDate(sunday));
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Xóa lịch học môn "${name}"? Các điểm danh thuộc lịch này cũng bị mất.`)) {
      deleteSchedule(id);
    }
  };

  const isAdminOrVu = user?.role === 'admin' || user?.role === 'giao_vu';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2>Lịch học</h2>
          {user?.role === 'giang_vien' && <p className="text-sm text-muted-foreground mt-1">Hiển thị lịch giảng dạy của {user.hoTen}</p>}
        </div>
        
        {isAdminOrVu && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Thêm lịch học
          </button>
        )}
      </div>

      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu lịch học'} />}

      {/* Control Bar */}
      <div className="bg-white rounded-xl p-4 border border-border mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm môn học, lớp..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto justify-center">
          <button onClick={handlePrevWeek} className="p-2 rounded-lg border border-border hover:bg-muted transition cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={handleToday} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition whitespace-nowrap cursor-pointer">Tuần hiện tại</button>
          <button onClick={handleNextWeek} className="p-2 rounded-lg border border-border hover:bg-muted transition cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-2 text-sm whitespace-nowrap font-medium text-[#009dd9]">
          <CalendarDays className="w-4 h-4" />
          {new Date(tuNgay).toLocaleDateString('vi-VN')} - {new Date(denNgay).toLocaleDateString('vi-VN')}
        </div>
      </div>

      {/* Timeline/List view */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground bg-white rounded-xl border border-border">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Đang tải lịch học...</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
            Chưa có lịch học nào trong tuần này.
          </div>
        ) : (
          schedules.map(lich => (
            <div key={lich.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition group">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Date & Time Badge */}
                <div className="bg-[#009dd9]/10 rounded-lg p-3 w-full md:w-32 shrink-0 text-center border border-[#009dd9]/20">
                  <p className="text-xs font-medium text-[#009dd9] mb-1">Thứ {lich.thu === 8 ? 'Chủ nhật' : lich.thu}</p>
                  <p className="text-lg font-bold text-[#009dd9] mb-1">{new Date(lich.ngayHoc).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</p>
                  <p className="text-xs text-muted-foreground bg-white rounded-md py-1 border border-border flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Ca {lich.caHoc}
                  </p>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg text-foreground truncate">{lich.tenMonHoc}</h4>
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">{lich.maLop}</p>
                    </div>
                    {isAdminOrVu && (
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 rounded hover:bg-muted text-muted-foreground cursor-pointer"><Edit className="w-4 h-4" /></button>
                         <button onClick={() => handleDelete(lich.id, lich.tenMonHoc)} className="p-1.5 rounded hover:bg-red-50 text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{lich.tenPhong}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{lich.tenGiangVien}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Tiết {lich.tietBatDau} - {lich.tietKetThuc}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}
    </div>
  );
}