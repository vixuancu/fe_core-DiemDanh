import React, { useEffect, useRef, useState } from 'react';
import { roleLabels } from './data';
import type { UserRole } from '@/shared/types';
import {
  useAccounts,
  useAccountStats,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useResetPassword,
  useAccountRoles,
} from '@/features/accounts/hooks/useAccounts';
import { Search, Plus, Edit, Lock, Unlock, Trash2, X, ChevronLeft, ChevronRight, KeyRound, Loader2 } from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';
import { useAuth } from '@/features/auth/context/AuthContext';
import { notify } from '@/shared/lib/notify';
import { formatDateVi } from '@/shared/lib/date-time';
import { buildPaginationItems } from '@/shared/lib/pagination';

const perPageOptions = [10, 20, 30, 40];

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  giao_vu: 'bg-blue-100 text-blue-700',
  giang_vien: 'bg-cyan-100 text-cyan-700',
};

type EditFormState = {
  id: string;
  username: string;
  hoTen: string;
  email: string;
  gioiTinh: boolean | null;
  ngaySinh: string;
  role: UserRole;
  trangThai: 'active' | 'locked';
};

export function TaiKhoanPage() {
  const { user } = useAuth();
  const lastErrorRef = useRef('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterTrangThai, setFilterTrangThai] = useState<'active' | 'locked' | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<EditFormState | null>(null);
  
  // Create state
  const [username, setUsername] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gioiTinh, setGioiTinh] = useState<boolean | null>(null);
  const [ngaySinh, setNgaySinh] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('giang_vien');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: accountsData, isLoading, error } = useAccounts({
    search: search || undefined,
    role: filterRole || undefined,
    trangThai: filterTrangThai || undefined,
    page: currentPage,
    perPage: perPage,
  });

  const { data: statsData } = useAccountStats();
  const { data: roleOptionsData } = useAccountRoles();

  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const resetMutation = useResetPassword();

  const accounts = accountsData?.data ?? [];
  const meta = {
    total: accountsData?.total ?? 0,
    page: accountsData?.page ?? 1,
    lastPage: accountsData?.totalPages ?? 1,
  };
  const stats = statsData ?? { total: 0, giaoVu: 0, giangVien: 0, active: 0, locked: 0 };
  const roleOptions = roleOptionsData ?? [];
  const errorMessage = error instanceof Error ? error.message : '';
  const isForbidden = errorMessage.includes('403') || errorMessage.toLowerCase().includes('quyền');
  const paginationItems = React.useMemo(
    () => buildPaginationItems(meta.page, meta.lastPage, 1, 1),
    [meta.page, meta.lastPage]
  );

  useEffect(() => {
    if (currentPage > meta.lastPage) {
      setCurrentPage(meta.lastPage > 0 ? meta.lastPage : 1);
    }
  }, [currentPage, meta.lastPage]);

  useEffect(() => {
    if (!errorMessage || errorMessage === lastErrorRef.current) return;
    lastErrorRef.current = errorMessage;
    notify.error(errorMessage);
  }, [errorMessage]);

  const formatDate = (value: string) => {
    return formatDateVi(value);
  };

  const genderLabel = (value: boolean | null) => {
    if (value === true) return 'Nam';
    if (value === false) return 'Nữ';
    return 'Khác';
  };

  const handleCreate = () => {
    if (!username || !email || !password) return;
    createMutation.mutate(
      { username, hoTen, email, password, role: selectedRole, gioiTinh, ngaySinh },
      {
        onSuccess: () => {
          setShowModal(false);
        },
      }
    );
  };

  const handleOpenEdit = (accountId: string) => {
    const found = accounts.find((item) => item.id === accountId);
    if (!found) {
      notify.error('Không tìm thấy dữ liệu tài khoản để chỉnh sửa');
      return;
    }
    setEditing({
      id: found.id,
      username: found.username,
      hoTen: found.hoTen,
      email: found.email,
      gioiTinh: found.gioiTinh,
      ngaySinh: found.ngaySinh,
      role: found.role,
      trangThai: found.trangThai,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateMutation.mutate(
      {
        id: editing.id,
        dto: {
          hoTen: editing.hoTen,
          gioiTinh: editing.gioiTinh,
          ngaySinh: editing.ngaySinh,
          role: editing.role,
          trangThai: editing.trangThai,
        },
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditing(null);
        },
      }
    );
  };

  const handleToggleStatus = (id: string, currentStatus: 'active' | 'locked') => {
    updateMutation.mutate({
      id,
      dto: { trangThai: currentStatus === 'active' ? 'locked' : 'active' },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleResetPassword = (id: string) => {
    if (confirm('Khôi phục mật khẩu mặc định (123456) cho tài khoản này?')) {
      resetMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý tài khoản</h2>
        <button onClick={() => {
          setUsername('');
          setHoTen('');
          setEmail('');
          setPassword('');
          setGioiTinh(null);
          setNgaySinh('');
          setSelectedRole('giang_vien');
          setShowModal(true);
        }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Tạo tài khoản
        </button>
      </div>

      {user?.role !== 'admin' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chức năng này yêu cầu quyền admin. Tài khoản hiện tại của bạn không có quyền truy cập.
        </div>
      )}

      {isForbidden && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage || 'Bạn không có quyền truy cập dữ liệu tài khoản.'}
        </div>
      )}

      {errorMessage && !isForbidden && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}


      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-border mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          />
        </div>
        <PortableSelect
          value={filterRole}
          onChange={e => { setFilterRole(e.target.value as UserRole | ''); setCurrentPage(1); }}
          className="px-4 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[180px]"
          labelClassName="text-sm"
        >
          <option value="">Tất cả vai trò</option>
          {roleOptions.map((role) => (
            <option key={role.id} value={role.role}>{role.label}</option>
          ))}
        </PortableSelect>
        <PortableSelect
          value={filterTrangThai}
          onChange={e => { setFilterTrangThai(e.target.value as 'active' | 'locked' | ''); setCurrentPage(1); }}
          className="px-4 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[180px]"
          labelClassName="text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Đã khóa</option>
        </PortableSelect>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">STT</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Họ và tên</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Username</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Giới tính</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Ngày sinh</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Vai trò</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-normal text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((tk, i) => (
                  <tr key={tk.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">{(meta.page - 1) * perPage + i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#009dd9]/10 flex items-center justify-center text-[#009dd9] text-xs shrink-0">
                          {tk.hoTen.charAt(0)}
                        </div>
                        <span>{tk.hoTen}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{tk.username}</td>
                    <td className="py-3 px-4">{tk.email}</td>
                    <td className="py-3 px-4">{genderLabel(tk.gioiTinh)}</td>
                    <td className="py-3 px-4">{formatDate(tk.ngaySinh)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${roleColors[tk.role]}`}>
                        {roleLabels[tk.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${tk.trangThai === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tk.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(tk.id)}
                          className="p-1.5 rounded hover:bg-muted transition cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(tk.id)} 
                          className="p-1.5 rounded hover:bg-muted transition cursor-pointer" 
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="w-4 h-4 text-[#009dd9]" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tk.id)}
                          className="p-1.5 rounded hover:bg-red-50 transition cursor-pointer" 
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(tk.id, tk.trangThai)}
                          className="p-1.5 rounded hover:bg-muted transition cursor-pointer" 
                          title={tk.trangThai === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {tk.trangThai === 'active' ? <Lock className="w-4 h-4 text-orange-500" /> : <Unlock className="w-4 h-4 text-green-600" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">Không tìm thấy tài khoản nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {accounts.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Hiển thị {(meta.page - 1) * perPage + 1}-{Math.min(meta.page * perPage, meta.total)} / {meta.total} tài khoản
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

      {/* Modal tạo tài khoản */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Tạo tài khoản mới</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Vai trò <span className="text-red-500">*</span></label>
                <PortableSelect
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                  labelClassName="text-sm"
                >
                  {roleOptions.map((r) => (
                    <option key={r.id} value={r.role}>{r.label}</option>
                  ))}
                </PortableSelect>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Username <span className="text-red-500">*</span></label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                    placeholder="Nhập username"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Họ và tên</label>
                  <input 
                    value={hoTen}
                    onChange={e => setHoTen(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30" 
                    placeholder="Nhập họ tên" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30" 
                    placeholder="Nhập email" 
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Mật khẩu <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Giới tính</label>
                  <PortableSelect
                    value={gioiTinh === null ? '' : String(gioiTinh)}
                    onChange={e => {
                      if (e.target.value === 'true') setGioiTinh(true);
                      else if (e.target.value === 'false') setGioiTinh(false);
                      else setGioiTinh(null);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                    labelClassName="text-sm"
                  >
                    <option value="">Khác</option>
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </PortableSelect>
                </div>
                <div>
                  <label className="block mb-1 text-sm">Ngày sinh</label>
                  <input
                    type="date"
                    value={ngaySinh}
                    onChange={e => setNgaySinh(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
                disabled={createMutation.isPending}
              >Hủy</button>
              <button 
                onClick={handleCreate} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-50"
                disabled={createMutation.isPending || !username || !email || !password}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Cập nhật tài khoản</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditing(null);
                }}
                className="p-1 rounded hover:bg-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Username</label>
                  <input
                    value={editing.username}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Email</label>
                  <input
                    value={editing.email}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm">Họ và tên</label>
                <input
                  value={editing.hoTen}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, hoTen: e.target.value } : prev)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                  placeholder="Nhập họ tên"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Giới tính</label>
                  <PortableSelect
                    value={editing.gioiTinh === null ? '' : String(editing.gioiTinh)}
                    onChange={(e) => {
                      const next = e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
                      setEditing((prev) => prev ? { ...prev, gioiTinh: next } : prev);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                    labelClassName="text-sm"
                  >
                    <option value="">Khác</option>
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </PortableSelect>
                </div>
                <div>
                  <label className="block mb-1 text-sm">Ngày sinh</label>
                  <input
                    type="date"
                    value={editing.ngaySinh}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, ngaySinh: e.target.value } : prev)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Vai trò</label>
                  <PortableSelect
                    value={editing.role}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, role: e.target.value as UserRole } : prev)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                    labelClassName="text-sm"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.id} value={r.role}>{r.label}</option>
                    ))}
                  </PortableSelect>
                </div>
                <div>
                  <label className="block mb-1 text-sm">Trạng thái</label>
                  <PortableSelect
                    value={editing.trangThai}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, trangThai: e.target.value as 'active' | 'locked' } : prev)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                    labelClassName="text-sm"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="locked">Đã khóa</option>
                  </PortableSelect>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
                disabled={updateMutation.isPending}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-50"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
