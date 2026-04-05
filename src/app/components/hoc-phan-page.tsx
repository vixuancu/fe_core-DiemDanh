import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Loader2, MoreVertical, Plus, Search, X } from 'lucide-react';
import { DataTablePagination } from './ui/data-table-pagination';
import { useCourses, useCreateCourse, useDeleteCourse, useUpdateCourse } from '@/features/courses/hooks/useCourses';
import type { Course } from '@/features/courses/types';

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function ActionDropdown({ course, onDeleteClick, onEditClick }: { course: Course; onDeleteClick: (course: Course) => void; onEditClick: (course: Course) => void }) {
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
        isAbove: shouldOpenAbove,
      });
    }

    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
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
          className="w-40 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-normal"
            onClick={() => {
              onEditClick(course);
              setIsOpen(false);
            }}
          >
            Chỉnh sửa
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => {
              onDeleteClick(course);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
          >
            Xóa học phần
          </button>
        </div>
      )}
    </div>
  );
}

function CourseModal({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: Course;
}) {
  const isEdit = Boolean(initialData);
  const [courseName, setCourseName] = useState(initialData?.courseName ?? '');

  const { mutate: createCourse, isPending: isCreating } = useCreateCourse();
  const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourse();

  const isPending = isCreating || isUpdating;
  const isFormValid = courseName.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    const payload = { course_name: courseName.trim() };

    if (isEdit && initialData) {
      updateCourse(
        { id: initialData.id, request: payload },
        {
          onSuccess: onClose,
        },
      );
      return;
    }

    createCourse(payload, {
      onSuccess: onClose,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Chỉnh sửa học phần' : 'Thêm học phần mới'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              Tên học phần <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:ring-2 focus:ring-[#009dd9]/30 outline-none transition"
              placeholder="VD: Lập trình Web"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button type="button" onClick={onClose} disabled={isPending} className="px-5 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer transition">
            Hủy
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isPending}
            className={`px-5 py-2 rounded-lg text-white text-sm font-semibold shadow-lg transition ${(!isFormValid || isPending)
              ? 'bg-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#009dd9] hover:bg-[#0088be] cursor-pointer'
              }`}
          >
            {isCreating || isUpdating ? 'Đang lưu...' : 'Thêm học phần'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteConfirmationModal({
  onClose,
  onConfirm,
  course,
  isPending,
}: {
  onClose: () => void;
  onConfirm: () => void;
  course: Course | null;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Bạn có chắc chắn muốn xóa học phần <span className="font-semibold text-gray-800">"{course?.courseName}"</span>?
            <br />
          </p>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition cursor-pointer ${isPending ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isPending ? 'Đang xóa...' : 'Đồng ý xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HocPhanPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; data?: Course }>({ isOpen: false, data: undefined });
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; data?: Course }>({ isOpen: false, data: undefined });

  const { data: courseData, isLoading, isError, error } = useCourses({
    search,
    page: currentPage,
    pageSize: perPage,
  });
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse();

  const total = courseData?.total ?? 0;
  const lastPage = courseData?.totalPages ?? Math.ceil(total / perPage);
  const currentData = courseData?.data ?? [];

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleAddNew = () => setModalConfig({ isOpen: true, data: undefined });
  const handleEdit = (course: Course) => setModalConfig({ isOpen: true, data: course });
  const handleDelete = (course: Course) => setDeleteConfig({ isOpen: true, data: course });

  const confirmDelete = () => {
    if (!deleteConfig.data) return;
    deleteCourse(deleteConfig.data.id, {
      onSuccess: () => setDeleteConfig({ isOpen: false, data: undefined }),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý học phần</h2>
        </div>
        <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer shadow-sm font-medium">
          <Plus className="w-4 h-4" /> Thêm học phần
        </button>
      </div>

      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu'} />}

      <div className="bg-white rounded-xl p-4 border border-border mb-4 flex items-center gap-4 flex-wrap shadow-sm">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học phần..."
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
                <th className="text-left py-3.5 px-4 font-normal">Tên học phần</th>
                <th className="text-left py-3.5 px-4 font-normal w-[180px]">Ngày tạo</th>
                <th className="text-center py-3.5 px-4 font-normal w-[120px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#009dd9]" />
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground italic">Không có học phần nào</td>
                </tr>
              ) : (
                currentData.map((course, index) => (
                  <tr key={course.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-gray-600 font-normal">{(currentPage - 1) * perPage + index + 1}</td>
                    <td className="py-3.5 px-4 font-normal text-gray-900 whitespace-pre-wrap">{course.courseName}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-normal">{course.createdAt}</td>
                    <td className="py-3.5 px-4 text-center font-normal">
                      <ActionDropdown
                        course={course}
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

      {total > 0 && (
        <div className="mt-4">
          <DataTablePagination
            currentPage={currentPage}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={(value) => { setPerPage(value); setCurrentPage(1); }}
            perPageOptions={[10, 20, 30, 50]}
          />
        </div>
      )}

      {modalConfig.isOpen && (
        <CourseModal
          onClose={() => setModalConfig({ isOpen: false, data: undefined })}
          initialData={modalConfig.data}
        />
      )}

      {deleteConfig.isOpen && (
        <DeleteConfirmationModal
          onClose={() => setDeleteConfig({ isOpen: false, data: undefined })}
          onConfirm={confirmDelete}
          course={deleteConfig.data ?? null}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}