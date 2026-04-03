import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useCreditClasses,
  useCreditClassFormOptions,
  useCreateCreditClass,
  useUpdateCreditClass,
  useDeleteCreditClass,
} from '@/features/credit-classes/hooks/useCreditClasses';
import type { CreateLopTinChiDto, LopTinChi } from '@/features/credit-classes/types';
import { mockSinhVien } from './data'; 
import { Search, Plus, MoreVertical, X, UserPlus, UserMinus, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function ActionDropdown({
  lop,
  onEditClick,
  onDeleteClick,
  onOpenStudents,
}: {
  lop: LopTinChi;
  onEditClick: (lop: LopTinChi) => void;
  onDeleteClick: (lop: LopTinChi) => void;
  onOpenStudents: (lop: LopTinChi) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, isAbove: false });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 160;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenAbove = spaceBelow < dropdownHeight;

      setCoords({
        top: shouldOpenAbove ? rect.top - dropdownHeight : rect.bottom,
        left: rect.right - 176,
        isAbove: shouldOpenAbove,
      });
    }

    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleScroll() {
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none shadow-sm"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            marginTop: coords.isAbove ? '-8px' : '8px',
          }}
          className="w-44 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-normal"
            onClick={() => {
              onEditClick(lop);
              setIsOpen(false);
            }}
          >
            Sửa
          </button>
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-normal"
            onClick={() => {
              onOpenStudents(lop);
              setIsOpen(false);
            }}
          >
            Danh sách sinh viên
          </button>
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
            onClick={() => {
              onDeleteClick(lop);
              setIsOpen(false);
            }}
          >
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Class Modal ─────────────────────────────────────────────────────────

const DAY_OF_WEEK_OPTIONS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
];

interface CreateLopTinChiForm {
  maLop: string;
  courseId: string;
  giangVienId: string;
  roomId: string;
  dayOfWeek: number;
  startDate: string;
  endDate: string;
  startPeriod: number;
  numberOfPeriods: number;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: CreateLopTinChiForm = {
  maLop: '',
  courseId: '',
  giangVienId: '',
  roomId: '',
  dayOfWeek: 2,
  startDate: '',
  endDate: '',
  startPeriod: 1,
  numberOfPeriods: 1,
  startTime: '',
  endTime: '',
};

function toDateInput(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function toDateTimeLocalInput(value?: string): string {
  if (!value) return '';
  const normalized = value.replace(' ', 'T');
  return normalized.slice(0, 16);
}

function AddClassModal({ onClose, initialData }: { onClose: () => void; initialData?: LopTinChi | null }) {
  const [form, setForm] = useState<CreateLopTinChiForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const { data: formOptions, isLoading: isLoadingOptions } = useCreditClassFormOptions();
  const { mutate: create, isPending } = useCreateCreditClass();
  const { mutate: update, isPending: isUpdating } = useUpdateCreditClass();

  useEffect(() => {
    if (!initialData) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      maLop: initialData.maLop,
      courseId: initialData.courseId,
      giangVienId: initialData.giangVienId,
      roomId: initialData.roomId,
      dayOfWeek: initialData.dayOfWeek,
      startDate: toDateInput(initialData.startDate),
      endDate: toDateInput(initialData.endDate),
      startPeriod: initialData.startPeriod,
      numberOfPeriods: initialData.numberOfPeriods,
      startTime: toDateTimeLocalInput(initialData.startTime),
      endTime: toDateTimeLocalInput(initialData.endTime),
    });
  }, [initialData]);

  const handleChange = <K extends keyof CreateLopTinChiForm>(
    key: K,
    value: CreateLopTinChiForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormError('');
  };

  const handleSave = () => {
    if (
      !form.maLop ||
      !form.courseId ||
      !form.giangVienId ||
      !form.roomId ||
      !form.startDate ||
      !form.endDate
    ) {
      setFormError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (form.startDate >= form.endDate) {
      setFormError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      return;
    }

    const payload: CreateLopTinChiDto = {
      maLop: form.maLop,
      courseId: form.courseId,
      giangVienId: form.giangVienId,
      roomId: form.roomId,
      dayOfWeek: form.dayOfWeek,
      startDate: `${form.startDate}T00:00:00`,
      endDate: `${form.endDate}T00:00:00`,
      startPeriod: form.startPeriod,
      numberOfPeriods: form.numberOfPeriods,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
    };

    if (initialData) {
      update(
        { id: initialData.id, dto: payload },
        {
          onSuccess: () => onClose(),
          onError: (err: Error) => setFormError(err.message),
        },
      );
      return;
    }

    create(payload, {
      onSuccess: () => onClose(),
      onError: (err: Error) => setFormError(err.message),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3>{initialData ? 'Cập nhật lớp tín chỉ' : 'Thêm lớp tín chỉ'}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {formError && <ErrorState message={formError} />}

        {isLoadingOptions ? (
          <div className="py-8 text-sm text-muted-foreground text-center">Đang tải dữ liệu form...</div>
        ) : (
        <div className="overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm">Mã lớp <span className="text-red-500">*</span></label>
            <input
              value={form.maLop}
              onChange={e => handleChange('maLop', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="Nhập mã lớp tín chỉ"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm">Học phần <span className="text-red-500">*</span></label>
            <PortableSelect
              value={form.courseId}
              onChange={e => handleChange('courseId', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              <option value="">Chọn học phần</option>
              {(formOptions?.courses ?? []).map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </PortableSelect>
          </div>
          <div>
            <label className="block mb-1 text-sm">Giảng viên <span className="text-red-500">*</span></label>
            <PortableSelect
              value={form.giangVienId}
              onChange={e => handleChange('giangVienId', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              <option value="">Chọn giảng viên</option>
              {(formOptions?.lecturers ?? []).map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
              ))}
            </PortableSelect>
          </div>
          <div>
            <label className="block mb-1 text-sm">Phòng học <span className="text-red-500">*</span></label>
            <PortableSelect
              value={form.roomId}
              onChange={e => handleChange('roomId', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              <option value="">Chọn phòng học</option>
              {(formOptions?.rooms ?? []).map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </PortableSelect>
          </div>
          <div>
            <label className="block mb-1 text-sm">Thứ học <span className="text-red-500">*</span></label>
            <PortableSelect
              value={String(form.dayOfWeek)}
              onChange={e => handleChange('dayOfWeek', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              {DAY_OF_WEEK_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </PortableSelect>
          </div>
          <div>
            <label className="block mb-1 text-sm">Tiết bắt đầu <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              value={form.startPeriod}
              onChange={e => handleChange('startPeriod', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Số tiết <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              value={form.numberOfPeriods}
              onChange={e => handleChange('numberOfPeriods', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Ngày bắt đầu <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => handleChange('startDate', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Ngày kết thúc <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => handleChange('endDate', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Giờ bắt đầu</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={e => handleChange('startTime', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm">Giờ kết thúc</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={e => handleChange('endTime', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
            />
          </div>
        </div>
        </div>
        )}
        <div className="flex justify-end gap-2 mt-6 shrink-0 border-t border-border pt-4">
          <button onClick={onClose} disabled={isPending || isUpdating} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer">Hủy</button>
          <button
            onClick={handleSave}
            disabled={isPending || isUpdating}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
             {(isPending || isUpdating) && <Loader2 className="w-4 h-4 animate-spin" />}
             {initialData ? 'Cập nhật' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LopTinChiPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<LopTinChi | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lop: LopTinChi | null }>({
    isOpen: false,
    lop: null,
  });
  const [showStudents, setShowStudents] = useState<{ id: string, name: string, code: string } | null>(null);

  const { data, isLoading, isError, error } = useCreditClasses({ search, perPage: 100 }); 
  const { mutate: deleteClass, isPending: isDeleting } = useDeleteCreditClass();

  const creditClasses = data?.data ?? [];

  const filteredClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return creditClasses;

    return creditClasses.filter((item) => {
      const values = [item.maLop, item.tenMonHoc, item.tenGiangVien].join(' ').toLowerCase();
      return values.includes(keyword);
    });
  }, [creditClasses, search]);

  const openCreateModal = () => {
    setEditingClass(null);
    setShowModal(true);
  };

  const openEditModal = (lop: LopTinChi) => {
    setEditingClass(lop);
    setShowModal(true);
  };

  const handleDelete = (lop: LopTinChi) => {
    setDeleteModal({ isOpen: true, lop });
  };

  const confirmDelete = () => {
    if (!deleteModal.lop) return;
    deleteClass(deleteModal.lop.id, {
      onSuccess: () => setDeleteModal({ isOpen: false, lop: null }),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý lớp tín chỉ</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Thêm lớp tín chỉ
        </button>
      </div>

      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu'} />}

      <div className="bg-white rounded-xl p-4 border border-border mb-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm lớp tín chỉ..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-gray-600">
                <th className="text-left py-3.5 px-4 font-normal w-[60px]">STT</th>
                <th className="text-left py-3.5 px-4 font-normal">Mã lớp tín chỉ</th>
                <th className="text-left py-3.5 px-4 font-normal">Tên học phần</th>
                <th className="text-left py-3.5 px-4 font-normal">Giảng viên</th>
                <th className="text-left py-3.5 px-4 font-normal">Sĩ số</th>
                <th className="text-center py-3.5 px-4 font-normal w-[90px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#009dd9]" />
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                    Tạm thời chưa có lớp tín chỉ nào.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((lop, index) => (
                  <tr key={lop.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-gray-600">{index + 1}</td>
                    <td className="py-3.5 px-4 text-gray-700">{lop.maLop}</td>
                    <td className="py-3.5 px-4 text-gray-700">{lop.tenMonHoc}</td>
                    <td className="py-3.5 px-4 text-gray-700">{lop.tenGiangVien}</td>
                    <td className="py-3.5 px-4 text-gray-700">{lop.siSo}</td>
                    <td className="py-3.5 px-4 text-center">
                      <ActionDropdown
                        lop={lop}
                        onEditClick={openEditModal}
                        onDeleteClick={(target) => handleDelete(target)}
                        onOpenStudents={(target) =>
                          setShowStudents({ id: target.id, name: target.tenMonHoc, code: target.maLop })
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm lớp */}
      {showModal && (
        <AddClassModal
          onClose={() => {
            setShowModal(false);
            setEditingClass(null);
          }}
          initialData={editingClass}
        />
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa lớp tín chỉ{' '}
                <span className="font-semibold text-gray-800">"{deleteModal.lop?.maLop}"</span>?
                <br />
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteModal({ isOpen: false, lop: null })}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition cursor-pointer"
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
                  isDeleting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                }`}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal danh sách SV */}
      {showStudents && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3>Danh sách sinh viên</h3>
                <p className="text-sm text-muted-foreground">{showStudents.name} - {showStudents.code}</p>
              </div>
              <button onClick={() => setShowStudents(null)} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="text-sm text-muted-foreground">Tổng: {mockSinhVien.length} sinh viên</p>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer">
                <UserPlus className="w-4 h-4" /> Thêm sinh viên
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-[300px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border sticky top-0 bg-white">
                    <th className="text-left py-2 px-3 font-normal text-muted-foreground">STT</th>
                    <th className="text-left py-2 px-3 font-normal text-muted-foreground">Mã SV</th>
                    <th className="text-left py-2 px-3 font-normal text-muted-foreground">Họ tên</th>
                    <th className="text-left py-2 px-3 font-normal text-muted-foreground">Lớp danh nghĩa</th>
                    <th className="text-left py-2 px-3 font-normal text-muted-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSinhVien.slice(0, 5).map((sv, i) => (
                    <tr key={sv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3">{sv.maSV}</td>
                      <td className="py-2 px-3">{sv.hoTen}</td>
                      <td className="py-2 px-3">{sv.lop}</td>
                      <td className="py-2 px-3">
                        <button className="p-1.5 rounded hover:bg-red-50 cursor-pointer" title="Xóa khỏi lớp">
                          <UserMinus className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
