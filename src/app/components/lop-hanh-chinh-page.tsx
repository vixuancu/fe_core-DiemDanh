import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Lock,
  Plus,
  Search,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';
import { buildPaginationItems } from '@/shared/lib/pagination';
import {
  useAdministrativeClassStats,
  useAdministrativeClasses,
  useCreateAdministrativeClass,
  useHardDeleteAdministrativeClass,
  useLockAdministrativeClass,
  useUnlockAdministrativeClass,
  useUpdateAdministrativeClass,
} from '@/features/administrative-classes/hooks/useAdministrativeClasses';
import type {
  AdministrativeClassItem,
  CreateAdministrativeClassDto,
} from '@/features/administrative-classes/types';

const perPageOptions = [10, 20, 30, 40];

type ClassModalProps = {
  title: string;
  name: string;
  isPending: boolean;
  error?: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function ClassModal({
  title,
  name,
  isPending,
  error,
  onNameChange,
  onClose,
  onSubmit,
}: ClassModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Tên lớp hành chính <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              placeholder="Nhập tên lớp hành chính"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
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

export function LopHanhChinhPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'active' | 'locked' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdministrativeClassItem | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError, error } = useAdministrativeClasses({
    search: search || undefined,
    status: status || undefined,
    page: currentPage,
    perPage,
  });
  const { data: stats } = useAdministrativeClassStats(search || undefined);

  const createMutation = useCreateAdministrativeClass();
  const updateMutation = useUpdateAdministrativeClass();
  const lockMutation = useLockAdministrativeClass();
  const unlockMutation = useUnlockAdministrativeClass();
  const hardDeleteMutation = useHardDeleteAdministrativeClass();

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages, 1, 1),
    [currentPage, totalPages]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, perPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages : 1);
    }
  }, [currentPage, totalPages]);

  const handleOpenCreate = () => {
    setFormError('');
    setNameInput('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (item: AdministrativeClassItem) => {
    setFormError('');
    setEditingItem(item);
    setNameInput(item.name);
    setShowEditModal(true);
  };

  const validateName = (): string => {
    if (!nameInput.trim()) return 'Tên lớp hành chính là bắt buộc';
    return '';
  };

  const handleCreate = () => {
    const msg = validateName();
    if (msg) {
      setFormError(msg);
      return;
    }
    const dto: CreateAdministrativeClassDto = { name: nameInput.trim() };
    createMutation.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        setNameInput('');
        setFormError('');
      },
      onError: (err) => setFormError(err instanceof Error ? err.message : 'Tạo lớp hành chính thất bại'),
    });
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    const msg = validateName();
    if (msg) {
      setFormError(msg);
      return;
    }
    updateMutation.mutate(
      { id: editingItem.id, dto: { name: nameInput.trim() } },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingItem(null);
          setNameInput('');
          setFormError('');
        },
        onError: (err) => setFormError(err instanceof Error ? err.message : 'Cập nhật lớp hành chính thất bại'),
      }
    );
  };

  const handleToggleStatus = (item: AdministrativeClassItem) => {
    if (item.status === 'active') {
      lockMutation.mutate(item.id);
      return;
    }
    unlockMutation.mutate(item.id);
  };

  const handleHardDelete = (item: AdministrativeClassItem) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hẳn lớp '${item.name}'? Hành động này không thể hoàn tác.`
    );
    if (!confirmed) return;
    hardDeleteMutation.mutate(item.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý lớp hành chính</h2>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm lớp hành chính
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl p-4 border border-border text-center">
          <p className="text-2xl text-[#009dd9]">{stats?.total ?? total}</p>
          <p className="text-xs text-muted-foreground mt-1">Tổng lớp hành chính</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border text-center">
          <p className="text-2xl text-[#0a9a3e]">{stats?.active ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Hoạt động</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border text-center">
          <p className="text-2xl text-[#ff0000]">{stats?.locked ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Đã khóa</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên lớp hành chính..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
            />
          </div>
          <PortableSelect
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'locked' | '')}
            className="px-4 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[200px]"
            labelClassName="text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Đã khóa</option>
          </PortableSelect>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">STT</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Tên lớp hành chính</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Số sinh viên</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Trạng thái</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-red-600">
                    {error instanceof Error ? error.message : 'Không thể tải danh sách lớp hành chính'}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted-foreground text-sm">
                    {search || status ? 'Không tìm thấy lớp hành chính phù hợp' : 'Chưa có lớp hành chính nào'}
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                    <td className="py-3 px-4">{(currentPage - 1) * perPage + index + 1}</td>
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-4">{item.studentCount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded hover:bg-muted cursor-pointer"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4 text-[#009dd9]" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className="p-1.5 rounded hover:bg-muted cursor-pointer"
                          title={item.status === 'active' ? 'Khóa' : 'Mở khóa'}
                        >
                          {item.status === 'active' ? (
                            <Lock className="w-4 h-4 text-red-500" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleHardDelete(item)}
                          className="p-1.5 rounded hover:bg-muted cursor-pointer"
                          title="Xóa hẳn"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? 'Không có dữ liệu'
                : `Hiển thị ${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, total)} / ${total} lớp hành chính`}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">Số bản ghi:</span>
              <PortableSelect
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-2 py-1 rounded border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[72px]"
                labelClassName="text-sm"
              >
                {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </PortableSelect>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {paginationItems.map((item, idx) => (
              item === '...'
                ? <span key={`ellipsis-${idx}`} className="w-8 h-8 inline-flex items-center justify-center text-muted-foreground">...</span>
                : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`w-8 h-8 rounded-lg text-sm cursor-pointer ${currentPage === item ? 'bg-[#009dd9] text-white' : 'hover:bg-muted'}`}
                  >
                    {item}
                  </button>
                )
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <ClassModal
          title="Thêm lớp hành chính"
          name={nameInput}
          isPending={createMutation.isPending}
          error={formError}
          onNameChange={(v) => {
            setNameInput(v);
            setFormError('');
          }}
          onClose={() => {
            setShowCreateModal(false);
            setFormError('');
          }}
          onSubmit={handleCreate}
        />
      )}

      {showEditModal && (
        <ClassModal
          title="Cập nhật lớp hành chính"
          name={nameInput}
          isPending={updateMutation.isPending}
          error={formError}
          onNameChange={(v) => {
            setNameInput(v);
            setFormError('');
          }}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
            setFormError('');
          }}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
