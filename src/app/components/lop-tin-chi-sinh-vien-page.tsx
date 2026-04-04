import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ChevronLeft, Download, Loader2, MoreVertical, Search, Upload, UserPlus, X } from 'lucide-react';
import {
  useAddStudentToCreditClass,
  useCreditClasses,
  useCreditClassStudents,
  useImportStudentsToCreditClass,
  useRemoveStudentFromCreditClass,
  downloadCreditClassStudentImportTemplate,
} from '@/features/credit-classes/hooks/useCreditClasses';
import { useStudents } from '@/features/students/hooks/useStudents';
import type { CreditClassStudentImportResult } from '@/features/credit-classes/types';
import type { CreditClassStudent } from '@/features/credit-classes/types';
import type { SinhVien } from '@/features/students/types';
import { DataTablePagination } from './ui/data-table-pagination';

type LopTinChiPageState = {
  name?: string;
  code?: string;
};

type StudentOption = Pick<SinhVien, 'id' | 'maSV' | 'hoTen' | 'lopHanhChinh'>;

function ImportStudentsExcelModal({
  isOpen,
  importFile,
  importError,
  importResult,
  isSubmitting,
  isDownloadingTemplate,
  onClose,
  onFileChange,
  onSubmit,
  onDownloadTemplate,
}: {
  isOpen: boolean;
  importFile: File | null;
  importError: string;
  importResult: CreditClassStudentImportResult | null;
  isSubmitting: boolean;
  isDownloadingTemplate: boolean;
  onClose: () => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onDownloadTemplate: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3>Nhập sinh viên từ Excel</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded hover:bg-muted transition cursor-pointer disabled:opacity-60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">File mẫu</label>
            <button
              type="button"
              onClick={onDownloadTemplate}
              disabled={isDownloadingTemplate || isSubmitting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white text-sm hover:bg-muted transition cursor-pointer disabled:opacity-60"
            >
              {isDownloadingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Tải file mẫu (.xlsx)
            </button>
          </div>

          <div>
            <label className="block mb-1 text-sm">Chọn file Excel</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <input
                value={importFile?.name ?? ''}
                disabled
                placeholder="Chưa chọn file"
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="shrink-0 px-3 py-2 rounded-lg border border-border bg-white text-sm hover:bg-muted transition cursor-pointer disabled:opacity-60"
              >
                Chọn file
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Chỉ hỗ trợ định dạng .xlsx</p>
          </div>

          {importError && <p className="text-sm text-red-600">{importError}</p>}

          {importResult && (
            <div className="rounded-lg border border-border p-3 bg-muted/20 space-y-2">
              {importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-border rounded p-2 bg-white">
                  {importResult.errors.slice(0, 20).map((err, idx) => (
                    <p key={`${err.row}-${idx}`} className="text-xs text-red-700">
                      Dòng {err.row}: {err.message}{err.studentCode ? ` (${err.studentCode})` : ''}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!importFile || isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isSubmitting ? 'Đang thêm...' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStudentModal({
  isOpen,
  studentOptions,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  studentOptions: StudentOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (student: StudentOption) => void;
}) {
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);
  const codeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStudentCodeInput('');
      setIsCodeDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        codeDropdownRef.current &&
        !codeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCodeDropdownOpen(false);
      }
    }

    if (isCodeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCodeDropdownOpen]);

  const selectedStudent = useMemo(
    () =>
      studentOptions.find(
        (sv) => sv.maSV.toLowerCase() === studentCodeInput.trim().toLowerCase(),
      ),
    [studentOptions, studentCodeInput],
  );

  const filteredCodeOptions = useMemo(() => {
    const keyword = studentCodeInput.trim().toLowerCase();
    if (!keyword) return studentOptions;
    return studentOptions.filter((sv) => sv.maSV.toLowerCase().includes(keyword));
  }, [studentCodeInput, studentOptions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3>Thêm sinh viên vào lớp</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded hover:bg-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div ref={codeDropdownRef} className="relative">
            <label className="block mb-1 text-sm">Mã sinh viên</label>
            <input
              value={studentCodeInput}
              onChange={(e) => setStudentCodeInput(e.target.value)}
              onFocus={() => setIsCodeDropdownOpen(true)}
              disabled={isSubmitting}
              placeholder="Nhập hoặc chọn mã sinh viên"
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 disabled:cursor-not-allowed disabled:opacity-70"
            />

            {isCodeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-white shadow-xl z-20">
                {filteredCodeOptions.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Không có mã sinh viên phù hợp</p>
                ) : (
                  filteredCodeOptions.map((sv) => (
                    <button
                      key={sv.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/40 transition"
                      onClick={() => {
                        setStudentCodeInput(sv.maSV);
                        setIsCodeDropdownOpen(false);
                      }}
                    >
                      <p className="text-sm text-gray-800">{sv.maSV}</p>
                      <p className="text-xs text-muted-foreground">{sv.hoTen} • {sv.lopHanhChinh}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm">Họ tên</label>
            <input
              value={selectedStudent?.hoTen ?? ''}
              disabled
              placeholder=""
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Lớp hành chính</label>
            <input
              value={selectedStudent?.lopHanhChinh ?? ''}
              disabled
              placeholder=""
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedStudent || isSubmitting}
            onClick={() => {
              if (!selectedStudent) return;
              onConfirm(selectedStudent);
            }}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang thêm...
              </span>
            ) : (
              'Thêm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentActionDropdown({
  student,
  onRemove,
}: {
  student: CreditClassStudent;
  onRemove: (student: CreditClassStudent) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, isAbove: false });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 64;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenAbove = spaceBelow < dropdownHeight;

      setCoords({
        top: shouldOpenAbove ? rect.top - dropdownHeight : rect.bottom,
        left: rect.right - 176,
        isAbove: shouldOpenAbove,
      });
    }

    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
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
          className="w-44 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-normal"
            onClick={() => {
              onRemove(student);
              setIsOpen(false);
            }}
          >
            Xóa khỏi lớp
          </button>
        </div>
      )}
    </div>
  );
}

export function LopTinChiSinhVienPage() {
  const navigate = useNavigate();
  const { lopTinChiId } = useParams();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<CreditClassStudentImportResult | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const addStudentLockRef = useRef(false);
  const location = useLocation();
  const routeState = location.state as LopTinChiPageState | null;

  const { data, isLoading } = useCreditClasses({ perPage: 100 });
  const lopTinChi = useMemo(
    () => data?.data.find((item) => item.id === lopTinChiId),
    [data?.data, lopTinChiId],
  );

  const title = routeState?.name ?? lopTinChi?.tenMonHoc ?? 'Danh sách sinh viên';
  const code = routeState?.code ?? lopTinChi?.maLop ?? '';
  const isMissingClass = !isLoading && !lopTinChi && !routeState;

  const {
    data: enrolledStudentsData,
    isLoading: isLoadingEnrolledStudents,
  } = useCreditClassStudents(lopTinChiId ?? '', {
    search,
    page: currentPage,
    perPage,
  });

  const {
    data: studentsData,
    isLoading: isLoadingStudents,
  } = useStudents({
    page: 1,
    perPage: 100,
    search: '',
    trangThai: 'active',
  });

  const { mutate: addStudentToCreditClass, isPending: isAddingStudent } = useAddStudentToCreditClass();
  const { mutate: removeStudentFromCreditClass, isPending: isRemovingStudent } = useRemoveStudentFromCreditClass();
  const importMutation = useImportStudentsToCreditClass(lopTinChiId ?? '');

  const enrolledStudents = enrolledStudentsData?.data ?? [];

  const addableStudents = useMemo(() => {
    const existedIds = new Set(enrolledStudents.map((sv) => sv.id));
    const allStudents = studentsData?.data ?? [];
    return allStudents.filter((sv) => !existedIds.has(sv.id));
  }, [enrolledStudents, studentsData?.data]);

  const total = enrolledStudentsData?.total ?? 0;
  const lastPage = Math.max(1, enrolledStudentsData?.totalPages ?? 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleRemoveStudent = (student: CreditClassStudent) => {
    if (!lopTinChiId) return;
    removeStudentFromCreditClass({ sectionId: lopTinChiId, studentId: student.id });
  };

  const handleAddStudent = (student: StudentOption) => {
    if (!lopTinChiId) return;
    if (addStudentLockRef.current || isAddingStudent) return;
    addStudentLockRef.current = true;
    addStudentToCreditClass(
      { sectionId: lopTinChiId, studentId: student.id },
      {
        onSuccess: () => setIsAddModalOpen(false),
        onSettled: () => {
          addStudentLockRef.current = false;
        },
      },
    );
  };

  const isTableLoading = isLoadingEnrolledStudents || isRemovingStudent;

  const handleDownloadTemplate = async () => {
    if (!lopTinChiId) return;
    try {
      setIsDownloadingTemplate(true);
      await downloadCreditClassStudentImportTemplate(lopTinChiId);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImportStudents = () => {
    if (!lopTinChiId) return;
    if (!importFile) {
      setImportError('Vui lòng chọn file Excel trước khi import');
      return;
    }

    const lowerName = importFile.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx')) {
      setImportError('Chỉ chấp nhận file Excel .xlsx');
      return;
    }

    setImportError('');
    importMutation.mutate(importFile, {
      onSuccess: (result) => {
        setImportResult(result);
        if (result.failedCount === 0) {
          setIsImportModalOpen(false);
          setImportFile(null);
        }
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/lop-tin-chi')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white text-sm hover:bg-muted transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>
          <div>
            <h2>Chi tiết danh sách sinh viên</h2>
            <p className="text-sm text-muted-foreground">
              {title}
              {code ? ` - ${code}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setImportError('');
              setImportResult(null);
              setImportFile(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-sm hover:bg-muted transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Nhập Excel
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            disabled={addableStudents.length === 0 || isLoadingStudents || isAddingStudent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title={addableStudents.length === 0 ? 'Không còn sinh viên để thêm' : 'Thêm sinh viên vào lớp'}
          >
            <UserPlus className="w-4 h-4" />
            Thêm sinh viên
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-border shadow-sm py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#009dd9]" />
        </div>
      ) : isMissingClass ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 text-sm text-muted-foreground">
          Không tìm thấy lớp tín chỉ phù hợp.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-4 border border-border mb-4 shadow-sm">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sinh viên..."
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
                  <th className="text-left py-3.5 px-4 font-normal">Mã SV</th>
                  <th className="text-left py-3.5 px-4 font-normal">Họ tên</th>
                  <th className="text-left py-3.5 px-4 font-normal">Lớp hành chính</th>
                  <th className="text-center py-3.5 px-4 font-normal w-[120px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {isTableLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#009dd9]" />
                    </td>
                  </tr>
                ) : enrolledStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                      Không tìm thấy sinh viên phù hợp.
                    </td>
                  </tr>
                ) : (
                  enrolledStudents.map((sv, index) => (
                    <tr key={sv.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-gray-600">{(currentPage - 1) * perPage + index + 1}</td>
                      <td className="py-3.5 px-4 text-gray-700">{sv.maSV}</td>
                      <td className="py-3.5 px-4 text-gray-700">{sv.hoTen}</td>
                      <td className="py-3.5 px-4 text-gray-700">{sv.lopHanhChinh}</td>
                      <td className="py-3.5 px-4 text-center">
                        <StudentActionDropdown student={sv} onRemove={handleRemoveStudent} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setCurrentPage(1);
            }}
            perPageOptions={[10, 20, 30, 50]}
          />
        </div>
        </>
      )}

      <AddStudentModal
        isOpen={isAddModalOpen}
        studentOptions={addableStudents}
        isSubmitting={isAddingStudent}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddStudent}
      />

      <ImportStudentsExcelModal
        isOpen={isImportModalOpen}
        importFile={importFile}
        importError={importError}
        importResult={importResult}
        isSubmitting={importMutation.isPending}
        isDownloadingTemplate={isDownloadingTemplate}
        onClose={() => setIsImportModalOpen(false)}
        onFileChange={(file) => {
          setImportFile(file);
          setImportError('');
          setImportResult(null);
        }}
        onSubmit={handleImportStudents}
        onDownloadTemplate={handleDownloadTemplate}
      />
    </div>
  );
}
