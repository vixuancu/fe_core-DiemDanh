import React, { useState } from 'react';
import {
  useStudents,
  useCreateStudent,
  useDeleteStudent,
  useLopOptions,
} from '@/features/students/hooks/useStudents';
import type { CreateSinhVienDto } from '@/features/students/types';
import { Search, Plus, Upload, Download, Edit, Trash2, ImagePlus, X, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';

const perPageOptions = [10, 20, 30, 40];

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <tr>
      <td colSpan={8} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Search className="w-8 h-8 opacity-40" />
          <p className="text-sm">
            {hasFilter ? 'Không tìm thấy sinh viên phù hợp' : 'Chưa có sinh viên nào'}
          </p>
        </div>
      </td>
    </tr>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-muted rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ─── Add Student Form ─────────────────────────────────────────────────────────

const EMPTY_FORM: CreateSinhVienDto = { maSV: '', hoTen: '', lop: '', email: '', soDienThoai: '' };

function AddStudentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateSinhVienDto>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const { mutate: create, isPending } = useCreateStudent();

  const handleChange = (key: keyof CreateSinhVienDto, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormError('');
  };

  const handleSave = () => {
    if (!form.maSV || !form.hoTen || !form.lop || !form.email) {
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
          <h3>Thêm sinh viên</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {formError && <ErrorState message={formError} />}

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Mã sinh viên <span className="text-red-500">*</span></label>
            <input
              value={form.maSV}
              onChange={(e) => handleChange('maSV', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="Nhập mã sinh viên"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Họ và tên <span className="text-red-500">*</span></label>
            <input
              value={form.hoTen}
              onChange={(e) => handleChange('hoTen', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="Nhập họ và tên"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Lớp <span className="text-red-500">*</span></label>
              <input
                value={form.lop}
                onChange={(e) => handleChange('lop', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                placeholder="Nhập lớp"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                placeholder="Nhập email"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm">Số điện thoại</label>
            <input
              value={form.soDienThoai}
              onChange={(e) => handleChange('soDienThoai', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Ảnh khuôn mặt (tối đa 20 ảnh)</label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Kéo thả hoặc nhấn để tải ảnh lên</p>
            </div>
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

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Nhập danh sách sinh viên từ Excel</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <button className="flex items-center gap-2 text-sm text-[#009dd9] hover:underline cursor-pointer">
            <Download className="w-4 h-4" /> Tải file mẫu (.xlsx)
          </button>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Kéo thả file Excel hoặc nhấn để chọn file</p>
            <p className="text-xs text-muted-foreground mt-1">Hỗ trợ: .xlsx, .xls</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer">Hủy</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer">Xác nhận nhập</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SinhVienPage() {
  const [search, setSearch] = useState('');
  const [filterLop, setFilterLop] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // ── Data từ hooks (không import mock trực tiếp) ───────────────────────────
  const { data, isLoading, isError, error } = useStudents({
    search,
    lop: filterLop,
    page: currentPage,
    perPage,
  });

  const { data: lopOptions = [] } = useLopOptions();
  const { mutate: deleteSV } = useDeleteStudent();

  const students = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilter = !!search || !!filterLop;

  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleFilterLop = (val: string) => { setFilterLop(val); setCurrentPage(1); };
  const handlePerPage = (val: number) => { setPerPage(val); setCurrentPage(1); };

  const handleDelete = (id: string, hoTen: string) => {
    if (confirm(`Xóa sinh viên "${hoTen}"?`)) {
      deleteSV(id);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý sinh viên</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> Nhập Excel
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Thêm sinh viên
          </button>
        </div>
      </div>

      {/* Error banner */}
      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu'} />}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-border mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc mã SV..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          />
        </div>
        <PortableSelect
          value={filterLop}
          onChange={(e) => handleFilterLop(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[180px]"
          labelClassName="text-sm"
        >
          <option value="">Tất cả lớp</option>
          {lopOptions.map((l) => <option key={l} value={l}>{l}</option>)}
        </PortableSelect>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">STT</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Mã SV</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Họ và tên</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Lớp</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Số điện thoại</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Ảnh khuôn mặt</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: perPage > 5 ? 5 : perPage }).map((_, i) => <SkeletonRow key={i} />)
                : students.length === 0
                  ? <EmptyState hasFilter={hasFilter} />
                  : students.map((sv, i) => (
                    <tr key={sv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4">{(currentPage - 1) * perPage + i + 1}</td>
                      <td className="py-3 px-4">{sv.maSV}</td>
                      <td className="py-3 px-4">{sv.hoTen}</td>
                      <td className="py-3 px-4">{sv.lop}</td>
                      <td className="py-3 px-4">{sv.email}</td>
                      <td className="py-3 px-4">{sv.soDienThoai}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${sv.soAnhKhuonMat > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {sv.soAnhKhuonMat}/20
                          </span>
                          <button className="p-1 rounded hover:bg-muted transition cursor-pointer" title="Upload ảnh">
                            <ImagePlus className="w-4 h-4 text-[#009dd9]" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded hover:bg-muted transition cursor-pointer" title="Chỉnh sửa">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(sv.id, sv.hoTen)}
                            className="p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {total === 0 ? 'Không có dữ liệu' : `Hiển thị ${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, total)} / ${total} sinh viên`}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">Số bản ghi:</span>
              <PortableSelect
                value={perPage}
                onChange={(e) => handlePerPage(Number(e.target.value))}
                className="px-2 py-1 rounded border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[72px]"
                labelClassName="text-sm"
              >
                {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </PortableSelect>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm cursor-pointer ${currentPage === i + 1 ? 'bg-[#009dd9] text-white' : 'hover:bg-muted'}`}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && <AddStudentModal onClose={() => setShowModal(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}