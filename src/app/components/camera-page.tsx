import React, { useState } from 'react';
import { mockCamera, mockPhongHoc } from './data';
import { Plus, Edit, Trash2, Wifi, WifiOff, AlertTriangle, RefreshCw, X, Camera, Link2 } from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';

export function CameraPage() {
  const [showModal, setShowModal] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [testingCamera, setTestingCamera] = useState<string | null>(null);

  const handleTest = (id: string) => {
    setTestingCamera(id);
    setTimeout(() => setTestingCamera(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý camera</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAssign(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition text-sm cursor-pointer">
            <Link2 className="w-4 h-4" /> Gán camera - Phòng
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Thêm camera
          </button>
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <Wifi className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl">{mockCamera.filter(c => c.trangThai === 'online').length}</p>
            <p className="text-sm text-muted-foreground">Trực tuyến</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <WifiOff className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl">{mockCamera.filter(c => c.trangThai === 'offline').length}</p>
            <p className="text-sm text-muted-foreground">Ngoại tuyến</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl">{mockCamera.filter(c => c.trangThai === 'error').length}</p>
            <p className="text-sm text-muted-foreground">Lỗi</p>
          </div>
        </div>
      </div>

      {/* Camera cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCamera.map(cam => (
          <div key={cam.id} className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Camera preview */}
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              {cam.trangThai === 'online' ? (
                <div className="text-center">
                  <Camera className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-xs">Đang hoạt động</p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">{cam.trangThai === 'offline' ? 'Ngoại tuyến' : 'Lỗi kết nối'}</p>
                </div>
              )}
              <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${cam.trangThai === 'online' ? 'bg-green-500 animate-pulse' : cam.trangThai === 'offline' ? 'bg-gray-400' : 'bg-red-500'}`} />
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4>{cam.tenCamera}</h4>
                  <p className="text-xs text-muted-foreground">IP: {cam.ipAddress}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${cam.trangThai === 'online' ? 'bg-green-100 text-green-700' : cam.trangThai === 'offline' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                  {cam.trangThai === 'online' ? 'Trực tuyến' : cam.trangThai === 'offline' ? 'Ngoại tuyến' : 'Lỗi'}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                Phòng: {cam.tenPhong || <span className="italic">Chưa gán</span>}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(cam.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition cursor-pointer ${testingCamera === cam.id ? 'border-[#009dd9] bg-[#009dd9]/5 text-[#009dd9]' : 'border-border hover:bg-muted'}`}
                >
                  <RefreshCw className={`w-3 h-3 ${testingCamera === cam.id ? 'animate-spin' : ''}`} />
                  {testingCamera === cam.id ? 'Đang kiểm tra...' : 'Kiểm tra'}
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition cursor-pointer"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Thêm camera</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Tên camera</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30" placeholder="VD: Camera FIT.P11" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Địa chỉ IP</label>
                <input className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30" placeholder="VD: 192.168.1.101" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Phòng học (không bắt buộc)</label>
                <PortableSelect className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30" labelClassName="text-sm">
                  <option value="">Chọn phòng học</option>
                  {mockPhongHoc.filter(p => !p.cameraId).map(p => (
                    <option key={p.id} value={p.id}>{p.tenPhong}</option>
                  ))}
                </PortableSelect>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer">Hủy</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Gán camera cho phòng học</h3>
              <button onClick={() => setShowAssign(false)} className="p-1 rounded hover:bg-muted cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Phòng học</label>
                <PortableSelect className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30" labelClassName="text-sm">
                  <option value="">Chọn phòng học</option>
                  {mockPhongHoc.map(p => (
                    <option key={p.id} value={p.id}>{p.tenPhong}</option>
                  ))}
                </PortableSelect>
              </div>
              <div>
                <label className="block mb-1 text-sm">Camera</label>
                <PortableSelect className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30" labelClassName="text-sm">
                  <option value="">Chọn camera</option>
                  {mockCamera.map(c => (
                    <option key={c.id} value={c.id}>{c.tenCamera} ({c.ipAddress})</option>
                  ))}
                </PortableSelect>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAssign(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer">Hủy</button>
              <button onClick={() => setShowAssign(false)} className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
