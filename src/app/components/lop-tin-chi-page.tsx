import React, { useState } from 'react';
import {
  useCreditClasses,
  useGiangVienOptions,
  useCreateCreditClass,
  useDeleteCreditClass,
} from '@/features/credit-classes/hooks/useCreditClasses';
import type { CreateLopTinChiDto } from '@/features/credit-classes/types';
import { mockSinhVien } from './data'; // Giữ nguyên cho modal danh sách SV (sẽ refactor sau in Phase 3.5 nếu cần, hoặc để đó)
import { Search, Plus, Edit, Trash2, Users, X, UserPlus, UserMinus, Loader2, AlertCircle } from 'lucide-react';
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

// ─── Add Class Modal ─────────────────────────────────────────────────────────

const EMPTY_FORM: CreateLopTinChiDto = { maLop: '', tenMonHoc: '', giangVienId: '', hocKy: '' };

function AddClassModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateLopTinChiDto>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const { data: gvOptions = [] } = useGiangVienOptions();
  const { mutate: create, isPending } = useCreateCreditClass();

  const handleChange = (key: keyof CreateLopTinChiDto, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormError('');
  };

  const handleSave = () => {
    if (!form.maLop || !form.tenMonHoc || !form.giangVienId || !form.hocKy) {
      setFormError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    create(form, {
      onSuccess: () => onClose(),
      onError: (err: Error) => setFormError(err.message),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Thêm lớp tín chỉ</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {formError && <ErrorState message={formError} />}

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Mã lớp <span className="text-red-500">*</span></label>
            <input
              value={form.maLop}
              onChange={e => handleChange('maLop', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="Nhập mã lớp tín chỉ"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Tên môn học <span className="text-red-500">*</span></label>
            <input
              value={form.tenMonHoc}
              onChange={e => handleChange('tenMonHoc', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="Nhập tên môn học"
            />
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
              {gvOptions.map(gv => (
                <option key={gv.id} value={gv.id}>{gv.hoTen}</option>
              ))}
            </PortableSelect>
          </div>
          <div>
            <label className="block mb-1 text-sm">Học kỳ <span className="text-red-500">*</span></label>
            <input
              value={form.hocKy}
              onChange={e => handleChange('hocKy', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="VD: 2025-2026.2"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer">Hủy</button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
             {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
             Lưu
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
  const [showStudents, setShowStudents] = useState<{ id: string, name: string, code: string } | null>(null);

  const { data, isLoading, isError, error } = useCreditClasses({ search, perPage: 100 }); // Lấy maximum để grid view
  const { mutate: deleteClass } = useDeleteCreditClass();

  const creditClasses = data?.data ?? [];

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Xóa lớp tín chỉ "${name}"? Toàn bộ dữ liệu điểm danh có thể bị ảnh hưởng.`)) {
      deleteClass(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý lớp tín chỉ</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Thêm lớp tín chỉ
        </button>
      </div>

      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu'} />}

      <div className="bg-white rounded-xl p-4 border border-border mb-4">
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
             <div key={i} className="bg-white rounded-xl border border-border p-5 h-[180px] animate-pulse">
                <div className="h-4 bg-muted w-2/3 mb-2 rounded" />
                <div className="h-3 bg-muted w-1/3 mb-6 rounded" />
                <div className="space-y-3">
                   <div className="h-3 bg-muted w-full rounded" />
                   <div className="h-3 bg-muted w-4/5 rounded" />
                </div>
             </div>
          ))}
        </div>
      ) : creditClasses.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
           Tạm thời chưa có lớp tín chỉ nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditClasses.map(lop => (
            <div key={lop.id} className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-[#009dd9]">{lop.tenMonHoc}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Mã lớp: {lop.maLop}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button className="p-1.5 rounded hover:bg-muted transition cursor-pointer"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(lop.id, lop.tenMonHoc)} className="p-1.5 rounded hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảng viên:</span>
                  <span>{lop.tenGiangVien}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sĩ số:</span>
                  <span>{lop.siSo} sinh viên</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Học kỳ:</span>
                  <span>{lop.hocKy}</span>
                </div>
              </div>
              <button
                onClick={() => setShowStudents({ id: lop.id, name: lop.tenMonHoc, code: lop.maLop })}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#009dd9] text-[#009dd9] hover:bg-[#009dd9]/5 text-sm transition cursor-pointer"
              >
                <Users className="w-4 h-4" /> Danh sách sinh viên
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm lớp */}
      {showModal && <AddClassModal onClose={() => setShowModal(false)} />}

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
