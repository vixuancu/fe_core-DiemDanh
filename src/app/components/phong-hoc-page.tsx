import React, { useState } from 'react';
import {
  useRooms,
  useToaNhaOptions,
  useAvailableCameras,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from '@/features/rooms/hooks/useRooms';
import type { CreatePhongHocDto } from '@/features/rooms/types';
import { Search, Plus, Edit, Trash2, Camera, CameraOff, X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';

// ─── Shared Components ────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreatePhongHocDto = { maPhong: '', tenPhong: '', toaNha: '', tang: 1, sucChua: 50 };

function AddRoomModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreatePhongHocDto>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const { data: availableCameras = [] } = useAvailableCameras();
  const { mutate: create, isPending } = useCreateRoom();

  const handleSave = () => {
    if (!form.maPhong || !form.tenPhong || !form.toaNha) {
      setFormError('Vui lòng điền đủ thông tin bắt buộc');
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
          <h3>Thêm phòng học mới</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        
        {formError && <ErrorState message={formError} />}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Mã phòng <span className="text-red-500">*</span></label>
              <input value={form.maPhong} onChange={e => setForm({ ...form, maPhong: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm" placeholder="VD: FIT.P11" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Tòa nhà <span className="text-red-500">*</span></label>
              <input value={form.toaNha} onChange={e => setForm({ ...form, toaNha: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm" placeholder="VD: FITHOU" />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm">Tên phòng (hiển thị) <span className="text-red-500">*</span></label>
            <input value={form.tenPhong} onChange={e => setForm({ ...form, tenPhong: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm" placeholder="VD: KGĐ FITHOU-FIT.P11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Tầng</label>
              <input type="number" min="1" value={form.tang} onChange={e => setForm({ ...form, tang: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Sức chứa (người)</label>
              <input type="number" min="1" value={form.sucChua} onChange={e => setForm({ ...form, sucChua: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm" />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm">Gán Camera IP (Tùy chọn)</label>
            <PortableSelect value={form.cameraId || ''} onChange={e => setForm({ ...form, cameraId: e.target.value || undefined })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] text-sm bg-white" labelClassName="text-sm">
              <option value="">-- Chưa lắp camera hoặc thiết lập sau --</option>
              {availableCameras.map(c => (
                <option key={c.id} value={c.id}>{c.tenCamera} ({c.ipAddress})</option>
              ))}
            </PortableSelect>
            <p className="text-xs text-muted-foreground mt-1.5">Chỉ hiển thị các camera đang trạng thái "Online" và chưa được gán.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-lg border hover:bg-muted text-sm cursor-pointer">Hủy</button>
          <button onClick={handleSave} disabled={isPending} className="px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu phòng học
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PhongHocPage() {
  const [search, setSearch] = useState('');
  const [filterToaNha, setFilterToaNha] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError, error } = useRooms({ search, toaNha: filterToaNha, perPage: 100 });
  const { data: toaNhaOptions = [] } = useToaNhaOptions();
  const { mutate: deleteRoom } = useDeleteRoom();
  const { mutate: updateRoom } = useUpdateRoom();

  const rooms = data?.data ?? [];

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Xóa phòng học "${name}"? Thao tác này có thể ảnh hưởng đến các lịch học đang sử dụng phòng này.`)) {
      deleteRoom(id);
    }
  };

  // Toggle camera nhanh
  const handleToggleCamera = (room: typeof rooms[0]) => {
    // Nếu có cameraId thì gỡ ra, nếu không thì cảnh báo cần chọn từ edit
    if (room.cameraId) {
      if (confirm(`Gỡ camera khỏi phòng ${room.maPhong}?`)) {
        updateRoom({ id: room.id, dto: { cameraId: undefined } }); // Bỏ gán camera
      }
    } else {
      alert('Vui lòng Edit phòng để gán camera vào phòng này.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý phòng học & Camera thiết bị</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Thêm phòng học
        </button>
      </div>

      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu phòng học'} />}

      <div className="bg-white rounded-xl p-4 border border-border mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã phòng hoặc tên..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          />
        </div>
        <PortableSelect
          value={filterToaNha}
          onChange={e => setFilterToaNha(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border text-sm min-w-[150px] bg-white focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          labelClassName="text-sm"
        >
          <option value="">Tất cả tòa nhà</option>
          {toaNhaOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </PortableSelect>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Mã phòng</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Tên hiển thị</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Tòa nhà</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Tầng</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Sức chứa</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Trang bị Camera điểm danh</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground w-[100px]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                 <tr>
                    <td colSpan={7} className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td>
                 </tr>
              ) : rooms.length === 0 ? (
                 <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">Không có phòng học nào</td>
                 </tr>
              ) : (
                rooms.map(room => (
                  <tr key={room.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{room.maPhong}</td>
                    <td className="py-3 px-4">{room.tenPhong}</td>
                    <td className="py-3 px-4">{room.toaNha}</td>
                    <td className="py-3 px-4">Tầng {room.tang}</td>
                    <td className="py-3 px-4">{room.sucChua} sv</td>
                    <td className="py-3 px-4">
                      {room.cameraId ? (
                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 w-fit px-2.5 py-1 rounded text-xs border border-green-200">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Đã trang bị (ID: {room.cameraId})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-muted w-fit px-2.5 py-1 rounded text-xs">
                          <CameraOff className="w-3.5 h-3.5" />
                          <span>Chưa lắp đặt</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleCamera(room)}
                          className={`p-1.5 rounded transition cursor-pointer ${room.cameraId ? 'hover:bg-red-50 text-red-500' : 'hover:bg-muted text-muted-foreground'}`}
                          title={room.cameraId ? "Gỡ camera" : "Không thể gỡ (chưa gắn)"}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-muted transition cursor-pointer" title="Chỉnh sửa"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => handleDelete(room.id, room.maPhong)} className="p-1.5 rounded hover:bg-red-50 transition cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddRoomModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
