import React, { useEffect, useState, useRef } from 'react';
import {
    Plus,
    Search,
    X,
    Loader2,
    MoreVertical,
    Camera,
    CameraOff,
    AlertCircle
} from 'lucide-react';
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom } from '@/features/classrooms/hooks/useClassrooms';
import { DataTablePagination } from './ui/data-table-pagination';
import { ClassroomCreateRequest } from '@/features/classrooms/types';

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{message}</p>
        </div>
    );
}

// ─── COMPONENT DROPDOWN TÙY CHỈNH ──────────────────────────────────────────
function ActionDropdown({ room, onDeleteClick, onEditClick }: { room: any; onDeleteClick: (room: any) => void, onEditClick: (room: any) => void }) {
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
                        onClick={() => { onEditClick(room); setIsOpen(false); }}
                    >
                        Chỉnh sửa
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                        onClick={() => { onDeleteClick(room); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
                    >
                        Xóa phòng
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function ClassroomModal({
    onClose,
    initialData
}: {
    onClose: () => void,
    initialData?: any
}) {
    const isEdit = !!initialData;
    const [className, setClassName] = useState(initialData?.className || '');
    const [formError, setFormError] = useState('');

    const { mutate: create, isPending: isCreating } = useCreateClassroom();
    const { mutate: update, isPending: isUpdating } = useUpdateClassroom();

    const isPending = isCreating || isUpdating;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!className.trim()) {
            setFormError('Vui lòng nhập tên lớp học');
            return;
        }

        const payload: ClassroomCreateRequest = { class_name: className.trim() };

        if (isEdit) {
            update({ id: Number(initialData.id), request: payload }, {
                onSuccess: () => onClose(),
                onError: (err: any) => setFormError(err.message),
            });
        } else {
            create(payload, {
                onSuccess: () => onClose(),
                onError: (err: any) => setFormError(err.message),
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">
                        {isEdit ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {formError && <ErrorState message={formError} />}

                <div className="space-y-4">
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                            Tên lớp học <span className="text-red-500">*</span>
                        </label>
                        <input
                            autoFocus
                            value={className}
                            onChange={e => setClassName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:ring-2 focus:ring-[#009dd9]/30 outline-none transition"
                            placeholder="VD: Lớp 10A1, Phòng máy 01..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="px-5 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-5 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] text-sm font-semibold shadow-lg flex items-center gap-2 cursor-pointer disabled:bg-gray-400"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEdit ? 'Cập nhật' : 'Tạo lớp học'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DeleteConfirmationModal({
    onClose,
    onConfirm,
    classroom,
    isPending
}: {
    onClose: () => void,
    onConfirm: () => void,
    classroom: any,
    isPending: boolean
}) {
    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa phòng học</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="p-1 rounded-full hover:bg-gray-100 cursor-pointer transition-colors disabled:bg-gray-100"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                    Bạn có chắc chắn muốn xóa phòng học <span className="font-semibold text-gray-900">"{classroom?.className}"</span>?{' '}
                    {classroom?.camera?.cameraId ? (
                        <span className="block mt-2">
                            <span className="text-yellow-700 font-medium">
                                Cảnh báo: Phòng này đang có camera gắn. Camera sẽ được tự động xóa khi xóa phòng.
                            </span>
                        </span>
                    ) : null}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="px-5 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer transition disabled:bg-gray-100"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold shadow-lg flex items-center gap-2 cursor-pointer disabled:bg-gray-400"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Xóa phòng học
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function PhongHocPage() {
    const [search, setSearch] = useState('');
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; data?: any }>({
        isOpen: false,
        data: undefined
    });
    const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; data?: any }>({
        isOpen: false,
        data: undefined
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const { mutate: deleteClassroom, isPending: isDeleting } = useDeleteClassroom();

    const {
        data: classroomData,
        isLoading
    } = useClassrooms({
        page: currentPage,
        pageSize: perPage,
    });

    const total = classroomData?.total ?? 0;
    const lastPage = classroomData?.totalPages ?? Math.ceil(total / perPage);
    const currentData = classroomData?.data ?? [];

    const handleDelete = (room: any) => {
        setDeleteConfig({ isOpen: true, data: room });
    };

    const confirmDelete = () => {
        if (deleteConfig.data) {
            deleteClassroom(Number(deleteConfig.data.id), {
                onSuccess: () => {
                    setDeleteConfig({ isOpen: false, data: undefined });
                },
            });
        }
    };

    const handleEdit = (room: any) => {
        console.log(room);
        setModalConfig({ isOpen: true, data: room });
    };

    const handleAddNew = () => {
        setModalConfig({ isOpen: true, data: undefined });
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className="text-xl font-bold text-gray-800">Quản lý phòng học & Camera thiết bị</h2>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer shadow-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Thêm phòng học
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-border mb-4 flex items-center gap-4 flex-wrap shadow-sm">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm theo tên phòng..."
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
                                <th className="text-left py-3.5 px-4 font-normal">Tên phòng</th>
                                <th className="text-left py-3.5 px-4 font-normal">Trang bị Camera</th>
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
                                    <td colSpan={5} className="py-12 text-center text-muted-foreground italic">Không có phòng học nào</td>
                                </tr>
                            ) : (
                                currentData.map((room: any, index: number) => (
                                    <tr key={room.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4 text-gray-600 font-normal">
                                            {(currentPage - 1) * perPage + index + 1}
                                        </td>
                                        <td className="py-3.5 px-4 font-normal text-gray-900">{room.className}</td>
                                        <td className="py-3.5 px-4">
                                            {room.camera && room.camera.cameraId ? (
                                                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 w-fit px-2.5 py-1 rounded text-xs border border-green-200" title={`IP: ${room.camera.ipAddress || 'N/A'}`}>
                                                    <Camera className="w-3.5 h-3.5" />
                                                    <span>Đã trang bị ({room.camera.cameraName || `ID: ${room.camera.cameraId}`})</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-muted-foreground bg-muted w-fit px-2.5 py-1 rounded text-xs">
                                                    <CameraOff className="w-3.5 h-3.5" />
                                                    <span>Chưa lắp đặt</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-500 font-normal">
                                            {room.createdAt}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-normal">
                                            <ActionDropdown
                                                room={room}
                                                onEditClick={handleEdit}
                                                onDeleteClick={handleDelete}
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

            {modalConfig.isOpen && (
                <ClassroomModal
                    initialData={modalConfig.data}
                    onClose={() => setModalConfig({ isOpen: false })}
                />
            )}

            {deleteConfig.isOpen && (
                <DeleteConfirmationModal
                    classroom={deleteConfig.data}
                    onClose={() => setDeleteConfig({ isOpen: false, data: undefined })}
                    onConfirm={confirmDelete}
                    isPending={isDeleting}
                />
            )}
        </div>
    );
}