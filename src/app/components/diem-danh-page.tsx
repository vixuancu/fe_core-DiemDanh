import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSchedules } from '@/features/schedules/hooks/useSchedules';
import { useAttendances, useUpdateAttendance, useSyncStudents } from '@/features/attendances/hooks/useAttendances';
import { trangThaiLabels, trangThaiColors } from '@/shared/types';
import { ScanFace, Play, Square, CheckCircle, Clock, XCircle, Edit, Save, Camera, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';
import type { DiemDanh } from '@/features/attendances/types';
import { formatDateVi, localDateToYmd } from '@/shared/lib/date-time';

interface ToastNotification {
  id: string;
  student: DiemDanh;
  timestamp: number;
}

export function DiemDanhPage() {
  const { user } = useAuth();
  
  // Lấy danh sách lịch học trong 1 khoảng thời gian rộng để hiển thị dropdown (mock)
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);
  const { data: schedulesData } = useSchedules({
    tuNgay: localDateToYmd(today),
    denNgay: localDateToYmd(nextMonth),
    perPage: 100,
    giangVienId: user?.role === 'giang_vien' ? user.id : undefined,
  });
  const schedules = schedulesData?.data ?? [];

  const [selectedLich, setSelectedLich] = useState<string>('');
  const [isAttending, setIsAttending] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [editMode, setEditMode] = useState(false);

  const selectedLichData = schedules.find((l) => l.id === selectedLich);
  // Không có API fetch Camera riêng lẻ, mock tạm trạng thái online
  const hasCamera = selectedLichData?.phongHocId; // Giả sử phòng nào có ID là có camera (thực tế có thể gọi useAvailableCameras)

  const { data: attendancesData, isLoading: isLoadingAtnd } = useAttendances({ lichHocId: selectedLich, perPage: 100 });
  const attendances = attendancesData?.data ?? [];

  const { mutate: updateStatus } = useUpdateAttendance();
  const { mutate: syncStudents, isPending: isSyncing } = useSyncStudents();

  // Reset state khi đổi lịch
  useEffect(() => {
    setIsAttending(false);
    setToasts([]);
    setEditMode(false);
  }, [selectedLich]);

  // Auto-remove toasts after 3s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(t => now - t.timestamp < 3000));
    }, 500);
    return () => clearInterval(timer);
  }, [toasts.length]);

  // Simulate face recognition
  useEffect(() => {
    if (!isAttending || attendances.length === 0) return;

    const interval = setInterval(() => {
      // Tìm các SV đang vắng
      const absent = attendances.filter(s => s.trangThai === 'vang');
      if (absent.length === 0) {
        setIsAttending(false);
        return;
      }

      const randomIdx = Math.floor(Math.random() * absent.length);
      const student = absent[randomIdx];
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const isLate = Math.random() > 0.8;

      const newStatus = isLate ? 'tre' : 'co_mat';

      // Tạo toast local trước (UI mockup cho nhanh)
      const updatedStudent = { ...student, trangThai: newStatus, thoiGian: time };
      setToasts(prev => [...prev, { id: `${student.sinhVienId}-${Date.now()}`, student: updatedStudent, timestamp: Date.now() }]);

      // Gọi API update (mutate sẽ làm invalidate queries + UI tự reload nhẹng, chú ý debounce nếu quá nhiều trong thực tế)
      // Trong môi trường mock + react-query, nó sẽ request lên mock server rồi trả về, fetch lại lists
      updateStatus({ id: student.id, dto: { trangThai: newStatus, ghiChu: `Camera ghi nhận lúc ${time}` } });

    }, 3500);

    return () => clearInterval(interval);
  }, [isAttending, attendances, updateStatus]);

  const handleManualUpdate = (id: string, status: any) => {
    updateStatus({ id, dto: { trangThai: status } });
  };

  const stats = {
    coMat: attendances.filter(s => s.trangThai === 'co_mat').length,
    tre: attendances.filter(s => s.trangThai === 'tre').length,
    vang: attendances.filter(s => s.trangThai === 'vang').length,
    total: attendances.length,
  };

  return (
    <div className="relative">
      <h2 className="mb-6">Điểm danh</h2>

      {/* Chọn lịch học */}
      <div className="bg-white rounded-xl p-5 border border-border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">Chọn lịch học sắp tới</label>
            <PortableSelect
              value={selectedLich}
              onChange={e => setSelectedLich(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              labelClassName="text-sm"
            >
              <option value="">-- Chọn buổi học --</option>
              {schedules.map(l => (
                <option key={l.id} value={l.id}>
                  {l.tenMonHoc} - {l.caHoc} (Tiết {l.tietBatDau}-{l.tietKetThuc}) - {l.tenPhong} - {formatDateVi(l.ngayHoc)}
                </option>
              ))}
            </PortableSelect>
          </div>
          {selectedLichData && (
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Phòng:</span> {selectedLichData.tenPhong}</p>
              <p><span className="text-muted-foreground">Ca:</span> {selectedLichData.caHoc} (Tiết {selectedLichData.tietBatDau}-{selectedLichData.tietKetThuc})</p>
              <p>
                <span className="text-muted-foreground">Camera:</span>{' '}
                {hasCamera ? (
                  <span className="text-green-600">Camera sẵn sàng (Trực tuyến)</span>
                ) : (
                  <span className="text-red-500">Chưa gán camera</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedLich && (
        <>
          {/* Camera preview lớn + Thống kê bên phải */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="bg-gray-900 flex items-center justify-center relative" style={{ minHeight: '420px' }}>
                  {isAttending ? (
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto border-2 border-green-400 rounded-lg mb-3 flex items-center justify-center animate-pulse">
                        <Camera className="w-14 h-14 text-green-400" />
                      </div>
                      <p className="text-green-400 text-sm">Đang nhận diện...</p>
                      <div className="absolute inset-0 border-2 border-green-400/20 m-4 rounded">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-bounce"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Camera chờ kích hoạt</p>
                    </div>
                  )}
                </div>
                <div className="p-3 flex gap-2">
                  {!isAttending ? (
                    <button
                      onClick={() => setIsAttending(true)}
                      disabled={!hasCamera || attendances.length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition cursor-pointer"
                    >
                      <Play className="w-4 h-4" /> Bắt đầu điểm danh (Mô phỏng)
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAttending(false)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm transition cursor-pointer"
                    >
                      <Square className="w-4 h-4" /> Dừng điểm danh
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Thống kê */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl border border-border p-4">
                <h4 className="mb-3 text-sm text-muted-foreground">Thống kê</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-xs text-green-600">Có mặt</p>
                      <p className="text-xl text-green-600">{stats.coMat}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-xs text-yellow-600">Đi trễ</p>
                      <p className="text-xl text-yellow-600">{stats.tre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div className="flex-1">
                      <p className="text-xs text-red-600">Vắng</p>
                      <p className="text-xl text-red-600">{stats.vang}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                    <ScanFace className="w-5 h-5 text-[#009dd9]" />
                    <div className="flex-1">
                      <p className="text-xs text-[#009dd9]">Tổng sĩ số</p>
                      <p className="text-xl text-[#009dd9]">{stats.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách sinh viên bên dưới */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h4>Danh sách sinh viên ({stats.total})</h4>
              <div className="flex items-center gap-2">
                 {attendances.length === 0 && (
                   <button
                     onClick={() => syncStudents(selectedLich)}
                     disabled={isSyncing}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                   >
                     {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                     Đồng bộ danh sách
                   </button>
                 )}
                 {attendances.length > 0 && (
                   <button
                     onClick={() => setEditMode(!editMode)}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${editMode ? 'bg-green-600 text-white' : 'border border-border hover:bg-muted'}`}
                   >
                     {editMode ? <><Save className="w-4 h-4" /> OK</> : <><Edit className="w-4 h-4" /> Chỉnh sửa thủ công</>}
                   </button>
                 )}
              </div>
            </div>
            <div className="overflow-x-auto">
              {isLoadingAtnd ? (
                 <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : attendances.length === 0 ? (
                 <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                   <AlertCircle className="w-8 h-8 opacity-50" />
                   <p>Chưa có danh sách sinh viên cho buổi học này.</p>
                   <p className="text-xs">Vui lòng nhấn "Đồng bộ danh sách" để khởi tạo.</p>
                 </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">STT</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Mã SV</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Họ tên</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Thời gian</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Ghi chú</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((sv, i) => (
                      <tr key={sv.sinhVienId} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4">{i + 1}</td>
                        <td className="py-3 px-4">{sv.maSV}</td>
                        <td className="py-3 px-4">{sv.hoTenSV}</td>
                        <td className="py-3 px-4">{sv.thoiGian || '-'}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate" title={sv.ghiChu}>{sv.ghiChu}</td>
                        <td className="py-3 px-4">
                          {editMode ? (
                            <PortableSelect
                              value={sv.trangThai}
                              onChange={e => handleManualUpdate(sv.id, e.target.value)}
                              className="px-2 py-1 rounded border border-border text-xs bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[92px]"
                              labelClassName="text-xs"
                            >
                              <option value="co_mat">Có mặt</option>
                              <option value="tre">Đi trễ</option>
                              <option value="vang">Vắng</option>
                            </PortableSelect>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs ${trangThaiColors[sv.trangThai]}`}>
                              {trangThaiLabels[sv.trangThai]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast thông báo sinh viên vừa nhận diện - hiện bên phải, tự ẩn sau 3s */}
      <div className="fixed top-20 right-6 z-50 space-y-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white rounded-xl border border-[#009dd9]/30 shadow-lg p-4"
            style={{
              animation: 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#009dd9]/10 flex items-center justify-center shrink-0">
                <ScanFace className="w-5 h-5 text-[#009dd9]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{toast.student.hoTenSV}</p>
                <p className="text-xs text-muted-foreground">{toast.student.maSV}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs shrink-0 ${trangThaiColors[toast.student.trangThai]}`}>
                {trangThaiLabels[toast.student.trangThai]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Nhận diện lúc {toast.student.thoiGian}</p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
