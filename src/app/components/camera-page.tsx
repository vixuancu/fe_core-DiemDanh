import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, X, Loader2, MoreVertical, AlertTriangle } from 'lucide-react';
import { DataTablePagination } from './ui/data-table-pagination';
import { useAvailableClassrooms } from '@/features/classrooms/hooks/useClassrooms';
import { useCameras, useCreateCamera, useDeleteCamera, useUpdateCamera } from '@/features/cameras/hooks/useCameras';

// ─── COMPONENT DROPDOWN TÙY CHỈNH ──────────────────────────────────────────
function ActionDropdown({ cam, onDeleteClick, onEditClick }: { cam: any; onDeleteClick: (cam: any) => void, onEditClick: (cam: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, isAbove: false });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const toggleDropdown = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = 110;
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldOpenAbove = spaceBelow < dropdownHeight;

            setCoords({
                top: shouldOpenAbove ? rect.top - dropdownHeight : rect.bottom,
                left: rect.right - 160,
                isAbove: shouldOpenAbove
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleScroll() { setIsOpen(false); }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
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
                        marginTop: coords.isAbove ? '-8px' : '8px'
                    }}
                    className="w-40 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] py-1 animate-in fade-in zoom-in-95 duration-100"
                >
                    <button
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-normal"
                        onClick={() => { onEditClick(cam); setIsOpen(false); }}
                    >
                        Chỉnh sửa
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                        onClick={() => { onDeleteClick(cam); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
                    >
                        Xóa thiết bị
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function CameraPage() {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [originalRoom, setOriginalRoom] = useState<{ id: string; name: string } | null>(null);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; cam: any | null }>({
        isOpen: false,
        cam: null
    });
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        cameraName: '',
        ipAddress: '',
        classroomId: '',
        cameraStatus: 0
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const { data: cameraData, isLoading } = useCameras({
        page: currentPage,
        pageSize: perPage,
        cameraName: search
    });
    const { data: availableRoomsData } = useAvailableClassrooms();
    const { mutate: createCamera, isPending: isCreating } = useCreateCamera();
    const { mutate: updateCamera, isPending: isUpdating } = useUpdateCamera();
    const { mutate: deleteCamera, isPending: isDeleting } = useDeleteCamera();

    const isFormValid =
        formData.cameraName.trim() !== '' &&
        formData.ipAddress.trim() !== '' &&
        formData.classroomId !== '';

    const openEditModal = (cam: any) => {
        setEditingId(cam.id);
        const roomId = String(cam.classroomId || '');

        setOriginalRoom({
            id: roomId,
            name: cam.className || cam.classroom_name || 'Phòng hiện tại'
        });

        setFormData({
            cameraName: cam.cameraName,
            ipAddress: cam.ipAddress,
            classroomId: roomId,
            cameraStatus: cam.cameraStatus || 0
        });
        setShowModal(true);
    };

    const handleSaveCamera = () => {
        if (editingId) {
            updateCamera({
                cameraId: editingId,
                cameraName: formData.cameraName,
                ipAddress: formData.ipAddress,
                classroomId: Number(formData.classroomId),
                cameraStatus: formData.cameraStatus
            }, {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingId(null);
                    setOriginalRoom(null);
                }
            });
        } else {
            createCamera({
                cameraName: formData.cameraName,
                ipAddress: formData.ipAddress,
                classroomId: Number(formData.classroomId),
                cameraStatus: 0
            }, {
                onSuccess: () => setShowModal(false)
            });
        }
    };

    const confirmDelete = () => {
        if (deleteModal.cam) {
            deleteCamera({ cameraId: deleteModal.cam.id }, {
                onSuccess: () => setDeleteModal({ isOpen: false, cam: null })
            });
        }
    };

    const total = cameraData?.total ?? 0;
    const lastPage = cameraData?.totalPages ?? Math.ceil(total / perPage);
    const currentData = cameraData?.data ?? [];
    const availableRooms = availableRoomsData?.data ?? [];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className="text-xl font-bold text-gray-800">Quản lý thiết bị Camera</h2>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setOriginalRoom(null);
                        setFormData({ cameraName: '', ipAddress: '', classroomId: '', cameraStatus: 0 });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer shadow-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Thêm camera
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-border mb-4 flex items-center gap-4 flex-wrap shadow-sm">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm theo tên camera..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border text-gray-600">
                                <th className="text-left py-3.5 px-4 font-normal w-[60px]">STT</th>
                                <th className="text-left py-3.5 px-4 font-normal">Tên Camera</th>
                                <th className="text-left py-3.5 px-4 font-normal">Địa chỉ IP</th>
                                <th className="text-left py-3.5 px-4 font-normal">Ngày tạo</th>
                                <th className="text-center py-3.5 px-4 font-normal w-[100px]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#009dd9]" />
                                    </td>
                                </tr>
                            ) : currentData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted-foreground italic">Không có camera nào</td>
                                </tr>
                            ) : (
                                currentData.map((cam: any, index: number) => (
                                    <tr key={cam.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4 text-gray-600 font-normal">
                                            {(currentPage - 1) * perPage + index + 1}
                                        </td>
                                        <td className="py-3.5 px-4 font-normal text-gray-900">{cam.cameraName}</td>
                                        <td className="py-3.5 px-4 font-normal text-gray-600">{cam.ipAddress}</td>
                                        <td className="py-3.5 px-4 text-gray-500 font-normal">{cam.createdAt}</td>
                                        <td className="py-3.5 px-4 text-center font-normal">
                                            <ActionDropdown
                                                cam={cam}
                                                onEditClick={openEditModal}
                                                onDeleteClick={(targetCam) => setDeleteModal({ isOpen: true, cam: targetCam })}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {total > 0 && (
                <div className="mt-4">
                    <DataTablePagination
                        currentPage={currentPage}
                        lastPage={lastPage}
                        total={total}
                        perPage={perPage}
                        onPageChange={setCurrentPage}
                        onPerPageChange={(n) => { setPerPage(n); setCurrentPage(1); }}
                        perPageOptions={[10, 20, 30, 50]}
                    />
                </div>
            )}

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingId ? 'Cập nhật camera' : 'Thêm camera mới'}
                            </h3>
                            <button onClick={() => { setShowModal(false); setEditingId(null); setOriginalRoom(null); }} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Tên camera <span className="text-red-500">*</span></label>
                                <input value={formData.cameraName} onChange={e => setFormData({ ...formData, cameraName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:ring-2 focus:ring-[#009dd9]/30 outline-none transition" placeholder="VD: Camera FIT.P11" />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Địa chỉ IP <span className="text-red-500">*</span></label>
                                <input value={formData.ipAddress} onChange={e => setFormData({ ...formData, ipAddress: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:ring-2 focus:ring-[#009dd9]/30 outline-none transition" placeholder="VD: 192.168.1.101" />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Gán vào phòng học <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.classroomId}
                                    onChange={e => setFormData({ ...formData, classroomId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#009dd9]/30 transition"
                                >
                                    <option value="">-- Chọn phòng học --</option>

                                    {editingId && originalRoom && (
                                        <option key={`current-${originalRoom.id}`} value={originalRoom.id}>
                                            {originalRoom.name} (Phòng hiện tại)
                                        </option>
                                    )}

                                    {availableRooms
                                        .filter((p: any) => String(p.id) !== originalRoom?.id)
                                        .map((p: any) => (
                                            <option key={p.id} value={String(p.id)}>
                                                {p.class_name || p.className}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => { setShowModal(false); setEditingId(null); setOriginalRoom(null); }} className="px-5 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer transition">Hủy</button>
                            <button
                                onClick={handleSaveCamera}
                                disabled={!isFormValid || isCreating || isUpdating}
                                className={`px-5 py-2 rounded-lg text-white text-sm font-semibold shadow-lg transition 
                                ${(!isFormValid || isCreating || isUpdating) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#009dd9] hover:bg-[#0088be] cursor-pointer'}`}
                            >
                                {isCreating || isUpdating ? 'Đang lưu...' : 'Lưu camera'}
                            </button>
                        </div>
                    </div>
                </div>
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
                                Bạn có chắc chắn muốn xóa camera <span className="font-semibold text-gray-800">"{deleteModal.cam?.cameraName}"</span>?
                                <br />
                                Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, cam: null })}
                                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition cursor-pointer 
                                    ${isDeleting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}