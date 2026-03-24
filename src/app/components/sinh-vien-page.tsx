import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  downloadStudentImportTemplate,
  useAddStudentFace,
  useCreateStudent,
  useDeleteStudentFace,
  useDeleteStudent,
  useImportStudents,
  useLopOptions,
  useStudentFaces,
  useStudents,
  useUpdateStudent,
} from '@/features/students/hooks/useStudents';
import type {
  CreateSinhVienDto,
  SinhVien,
  StudentFaceItem,
  StudentImportResult,
  UpdateSinhVienDto,
} from '@/features/students/types';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  FileSpreadsheet,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  Search,
  Trash2,
  Unlock,
  Upload,
  X,
} from 'lucide-react';
import { PortableSelect } from './ui/portable-form-controls';
import { formatDateVi } from '@/shared/lib/date-time';
import { notify } from '@/shared/lib/notify';

const perPageOptions = [10, 20, 30, 40];
const MAX_FACE_FILES = 20;
const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

type StudentFormState = CreateSinhVienDto & {
  trangThai: 'active' | 'locked';
};

type PendingFaceUpload = {
  id: string;
  name: string;
  imageData: string;
};

type ImportModalProps = {
  isOpen: boolean;
  selectedFile: File | null;
  isPending: boolean;
  error?: string;
  onClose: () => void;
  onSelectFile: (file: File) => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
};

type ImportErrorModalProps = {
  isOpen: boolean;
  result: StudentImportResult | null;
  isDownloading: boolean;
  onDownloadErrorFile: () => void;
  onClose: () => void;
};

const EMPTY_FORM: StudentFormState = {
  maSV: '',
  hoTen: '',
  ngaySinh: '',
  gioiTinh: null,
  lopHanhChinhId: '',
  trangThai: 'active',
};

function formatDate(value: string): string {
  return formatDateVi(value);
}

function genderLabel(value: boolean | null): string {
  if (value === true) return 'Nam';
  if (value === false) return 'Nữ';
  return 'Khác';
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <tr>
      <td colSpan={9} className="py-14 text-center text-muted-foreground text-sm">
        {hasFilter ? 'Không tìm thấy sinh viên phù hợp' : 'Chưa có sinh viên nào'}
      </td>
    </tr>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Không thể đọc dữ liệu ảnh'));
    };
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh'));
    reader.readAsDataURL(file);
  });
}

function ImportExcelModal({
  isOpen,
  selectedFile,
  isPending,
  error,
  onClose,
  onSelectFile,
  onImport,
  onDownloadTemplate,
}: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const trySelectFile = (file: File | null) => {
    if (!file) return;
    onSelectFile(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3>Nhập danh sách sinh viên từ Excel</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onDownloadTemplate}
          className="inline-flex items-center gap-2 text-[#009dd9] hover:underline text-sm mb-4 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Tải file mẫu (.xlsx)
        </button>

        {error && <ErrorState message={error} />}

        <div
          role="button"
          tabIndex={0}
          onClick={() => !isPending && fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !isPending) {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!isPending) setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (isPending) return;
            trySelectFile(event.dataTransfer.files?.[0] || null);
          }}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
            isDragging ? 'border-[#009dd9] bg-[#009dd9]/5' : 'border-border/80 bg-muted/20'
          } ${isPending ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/40'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            disabled={isPending}
            onChange={(event) => {
              trySelectFile(event.target.files?.[0] || null);
              event.currentTarget.value = '';
            }}
          />
          <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-base text-muted-foreground">Kéo thả file Excel hoặc nhấn để chọn file</p>
          <p className="text-sm text-muted-foreground mt-1">Hỗ trợ: .xlsx, .xls</p>
          {selectedFile && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded text-sm text-[#0b6b8d]">
              <FileSpreadsheet className="w-4 h-4" />
              {selectedFile.name}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onImport}
            disabled={isPending || !selectedFile}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận nhập
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportErrorModal({
  isOpen,
  result,
  isDownloading,
  onDownloadErrorFile,
  onClose,
}: ImportErrorModalProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3>Lỗi import sinh viên</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer" title="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border border-border rounded-lg p-3 space-y-2">
          <p className="text-sm">Kết quả: nhập {result.importedCount}/{result.totalRows} dòng</p>
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {result.errors.map((item, idx) => (
              <p key={`${item.row}-${item.field}-${idx}`} className="text-xs text-red-600">
                Dòng {item.row}: {item.message}
                {item.studentCode ? ` (${item.studentCode})` : ''}
              </p>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onDownloadErrorFile}
            disabled={isDownloading}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {isDownloading && <Loader2 className="w-4 h-4 animate-spin" />}
            Tải file lỗi
          </button>
        </div>
      </div>
    </div>
  );
}

type StudentModalProps = {
  title: string;
  mode: 'create' | 'edit';
  form: StudentFormState;
  classOptions: { id: string; name: string }[];
  isPending: boolean;
  isFacePending: boolean;
  pendingFaces: PendingFaceUpload[];
  existingFaces: StudentFaceItem[];
  onChange: <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => void;
  onDropFaces: (files: File[]) => void;
  onRemovePendingFace: (id: string) => void;
  onDeleteFace: (faceId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  error?: string;
};

function StudentModal({
  title,
  mode,
  form,
  classOptions,
  isPending,
  isFacePending,
  pendingFaces,
  existingFaces,
  onChange,
  onDropFaces,
  onRemovePendingFace,
  onDeleteFace,
  onClose,
  onSubmit,
  error,
}: StudentModalProps) {
  const isEdit = mode === 'edit';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFace, setIsDraggingFace] = useState(false);

  const handleSelectFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onDropFaces(Array.from(files));
  };

  const openFacePicker = () => {
    if (isFacePending) return;
    fileInputRef.current?.click();
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setIsDraggingFace(false);
    if (isFacePending) return;
    handleSelectFiles(event.dataTransfer.files);
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <ErrorState message={error} />}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Mã sinh viên <span className="text-red-500">*</span></label>
              <input
                value={form.maSV}
                onChange={(e) => onChange('maSV', e.target.value)}
                disabled={isEdit}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Nhập mã sinh viên"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Họ và tên <span className="text-red-500">*</span></label>
              <input
                value={form.hoTen}
                onChange={(e) => onChange('hoTen', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                placeholder="Nhập họ và tên"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm">Ngày sinh</label>
              <input
                type="date"
                value={form.ngaySinh || ''}
                onChange={(e) => onChange('ngaySinh', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Giới tính</label>
              <PortableSelect
                value={form.gioiTinh === null ? '' : String(form.gioiTinh)}
                onChange={(e) => {
                  if (e.target.value === 'true') onChange('gioiTinh', true);
                  else if (e.target.value === 'false') onChange('gioiTinh', false);
                  else onChange('gioiTinh', null);
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
              <label className="block mb-1 text-sm">Lớp hành chính <span className="text-red-500">*</span></label>
              <PortableSelect
                value={form.lopHanhChinhId}
                onChange={(e) => onChange('lopHanhChinhId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                labelClassName="text-sm"
              >
                <option value="">Chọn lớp</option>
                {classOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </PortableSelect>
            </div>
          </div>

          {isEdit && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm">Trạng thái</label>
                <PortableSelect
                  value={form.trangThai}
                  onChange={(e) => onChange('trangThai', e.target.value as 'active' | 'locked')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
                  labelClassName="text-sm"
                >
                  <option value="active">Hoạt động</option>
                  <option value="locked">Đã khóa</option>
                </PortableSelect>
              </div>
            </div>
          )}

          <div className="border border-border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm">Ảnh khuôn mặt ({existingFaces.length + pendingFaces.length})</p>
              {!isEdit && <p className="text-xs text-muted-foreground">Có thể bỏ qua và cập nhật sau</p>}
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={openFacePicker}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openFacePicker();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!isFacePending) setIsDraggingFace(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDraggingFace(false);
              }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                isDraggingFace
                  ? 'border-[#009dd9] bg-[#009dd9]/5'
                  : 'border-border/80 bg-muted/20'
              } ${isFacePending ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/40'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={isFacePending}
                onChange={(event) => {
                  handleSelectFiles(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
              <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isFacePending ? 'Đang tải ảnh lên...' : 'Kéo thả hoặc nhấn để tải ảnh lên'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG, WEBP</p>
            </div>

            {(existingFaces.length > 0 || pendingFaces.length > 0) && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {existingFaces.map((face) => (
                  <div key={face.id} className="flex items-center justify-between gap-2 text-sm bg-muted/40 rounded px-2 py-1.5">
                    <a
                      href={face.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#009dd9] hover:underline truncate"
                    >
                      {face.imageUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => onDeleteFace(face.id)}
                      className="p-1 rounded hover:bg-red-50 cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
                {pendingFaces.map((face) => (
                  <div key={face.id} className="flex items-center justify-between gap-2 text-sm bg-blue-50 rounded px-2 py-1.5">
                    <span className="truncate text-[#0b6b8d]">{face.name}</span>
                    <button
                      type="button"
                      onClick={() => onRemovePendingFace(face.id)}
                      className="p-1 rounded hover:bg-blue-100 cursor-pointer"
                      title="Bỏ ảnh chờ lưu"
                    >
                      <X className="w-4 h-4 text-[#0b6b8d]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isPending}
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

export function SinhVienPage() {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'locked' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportErrorModal, setShowImportErrorModal] = useState(false);
  const [isDownloadingErrorFile, setIsDownloadingErrorFile] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [createForm, setCreateForm] = useState<StudentFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<StudentFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [pendingCreateFaces, setPendingCreateFaces] = useState<PendingFaceUpload[]>([]);

  const { data, isLoading, isError, error } = useStudents({
    search: search || undefined,
    lopHanhChinhId: filterClass || undefined,
    trangThai: filterStatus,
    page: currentPage,
    perPage,
  });
  const { data: classOptions = [] } = useLopOptions();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const importMutation = useImportStudents();
  const addFaceMutation = useAddStudentFace();
  const deleteFaceMutation = useDeleteStudentFace();
  const {
    data: editingFaces = [],
    isFetching: isEditingFacesLoading,
  } = useStudentFaces(editingId || '', showEditModal && !!editingId);

  const students = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilter = !!search || !!filterClass || !!filterStatus;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterClass, filterStatus, perPage]);

  const summary = useMemo(() => {
    const active = students.filter((item) => item.trangThai === 'active').length;
    const locked = students.filter((item) => item.trangThai === 'locked').length;
    return { active, locked };
  }, [students]);

  const updateFormField = <K extends keyof StudentFormState>(
    target: 'create' | 'edit',
    key: K,
    value: StudentFormState[K],
  ) => {
    setFormError('');
    if (target === 'create') {
      setCreateForm((prev) => ({ ...prev, [key]: value }));
      return;
    }
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (form: StudentFormState): string => {
    if (!form.maSV.trim()) return 'Mã sinh viên là bắt buộc';
    if (!form.hoTen.trim()) return 'Họ và tên là bắt buộc';
    if (!form.lopHanhChinhId) return 'Vui lòng chọn lớp hành chính';
    return '';
  };

  const makePendingFaces = async (files: File[]): Promise<PendingFaceUpload[]> => {
    return Promise.all(
      files.map(async (file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        imageData: await fileToDataUrl(file),
      }))
    );
  };

  const pickValidImageFiles = (files: File[]): File[] => {
    return files.filter((file) => file.type.startsWith('image/'));
  };

  const handleDropCreateFaces = async (files: File[]) => {
    const imageFiles = pickValidImageFiles(files);
    if (imageFiles.length === 0) {
      setFormError('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, ...)');
      return;
    }

    const remaining = Math.max(0, MAX_FACE_FILES - pendingCreateFaces.length);
    if (remaining === 0) {
      setFormError(`Tối đa ${MAX_FACE_FILES} ảnh khuôn mặt`);
      return;
    }

    const selected = imageFiles.slice(0, remaining);
    try {
      const pending = await makePendingFaces(selected);
      setPendingCreateFaces((prev) => [...prev, ...pending]);
      setFormError('');
    } catch {
      setFormError('Không thể đọc dữ liệu ảnh');
    }
  };

  const handleDropEditFaces = async (files: File[]) => {
    if (!editingId) return;

    const imageFiles = pickValidImageFiles(files);
    if (imageFiles.length === 0) {
      setFormError('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, ...)');
      return;
    }

    const remaining = Math.max(0, MAX_FACE_FILES - editingFaces.length);
    if (remaining === 0) {
      setFormError(`Tối đa ${MAX_FACE_FILES} ảnh khuôn mặt`);
      return;
    }

    const selected = imageFiles.slice(0, remaining);
    try {
      const pending = await makePendingFaces(selected);
      const results = await Promise.allSettled(
        pending.map((item) =>
          addFaceMutation.mutateAsync({
            studentId: editingId,
            imageUrl: item.imageData,
          })
        )
      );
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        setFormError(`Có ${failed} ảnh tải lên thất bại`);
      } else {
        setFormError('');
      }
    } catch {
      setFormError('Không thể đọc dữ liệu ảnh');
    }
  };

  const handleDeleteEditFace = (faceId: string) => {
    if (!editingId) return;
    deleteFaceMutation.mutate({ studentId: editingId, faceId }, {
      onError: (err) => {
        setFormError(err instanceof Error ? err.message : 'Xóa ảnh khuôn mặt thất bại');
      },
    });
  };

  const handleCreate = async () => {
    const msg = validateForm(createForm);
    if (msg) {
      setFormError(msg);
      return;
    }

    const createDto: CreateSinhVienDto = {
      maSV: createForm.maSV,
      hoTen: createForm.hoTen,
      ngaySinh: createForm.ngaySinh,
      gioiTinh: createForm.gioiTinh,
      lopHanhChinhId: createForm.lopHanhChinhId,
    };

    try {
      const created = await createMutation.mutateAsync(createDto);
      if (pendingCreateFaces.length > 0) {
        await Promise.allSettled(
          pendingCreateFaces.map((item) =>
            addFaceMutation.mutateAsync({ studentId: created.id, imageUrl: item.imageData })
          )
        );
      }
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
      setPendingCreateFaces([]);
      setFormError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Tạo sinh viên thất bại');
    }
  };

  const handleOpenEdit = (item: SinhVien) => {
    setFormError('');
    setEditingId(item.id);
    setEditForm({
      maSV: item.maSV,
      hoTen: item.hoTen,
      ngaySinh: item.ngaySinh || '',
      gioiTinh: item.gioiTinh,
      lopHanhChinhId: item.lopHanhChinhId,
      trangThai: item.trangThai,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const msg = validateForm(editForm);
    if (msg) {
      setFormError(msg);
      return;
    }

    const dto: UpdateSinhVienDto = {
      hoTen: editForm.hoTen,
      ngaySinh: editForm.ngaySinh,
      gioiTinh: editForm.gioiTinh,
      lopHanhChinhId: editForm.lopHanhChinhId,
      trangThai: editForm.trangThai,
    };
    try {
      await updateMutation.mutateAsync({ id: editingId, dto });
      setShowEditModal(false);
      setEditingId(null);
      setFormError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Cập nhật sinh viên thất bại');
    }
  };

  const handleDelete = (item: SinhVien) => {
    if (confirm(`Xóa cứng sinh viên "${item.hoTen}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleToggleLock = (item: SinhVien) => {
    updateMutation.mutate({
      id: item.id,
      dto: {
        maSV: item.maSV,
        hoTen: item.hoTen,
        ngaySinh: item.ngaySinh,
        gioiTinh: item.gioiTinh,
        lopHanhChinhId: item.lopHanhChinhId,
        trangThai: item.trangThai === 'active' ? 'locked' : 'active',
      },
    });
  };

  const handleSelectImportFile = (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      setImportError('Chỉ chấp nhận file Excel .xlsx hoặc .xls');
      setImportFile(null);
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setImportError('File import không được vượt quá 10MB');
      setImportFile(null);
      return;
    }
    setImportError('');
    setImportResult(null);
    setImportFile(file);
  };

  const handleImportExcel = () => {
    if (!importFile) {
      setImportError('Vui lòng chọn file Excel');
      return;
    }
    importMutation.mutate(importFile, {
      onSuccess: (result) => {
        if (result.failedCount === 0) {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
          setImportError('');
          return;
        }

        setShowImportModal(false);
        setImportResult(result);
        setShowImportErrorModal(true);
      },
      onError: (err) => {
        setImportError(err instanceof Error ? err.message : 'Import thất bại');
      },
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadStudentImportTemplate();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Không thể tải file mẫu');
    }
  };

  const handleDownloadErrorFile = async () => {
    if (!importFile || !importResult || importResult.errors.length === 0) {
      notify.error('Không có dữ liệu lỗi để tải');
      return;
    }

    setIsDownloadingErrorFile(true);
    try {
      const XLSX = await import('xlsx');
      const buffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

      if (!firstSheet) {
        throw new Error('Không tìm thấy sheet dữ liệu trong file import');
      }

      const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(firstSheet, {
        header: 1,
        raw: false,
        defval: '',
      });

      const header = (rows[0] ?? []).map((item) => String(item ?? ''));
      if (header.length === 0) {
        throw new Error('File import không có dòng tiêu đề hợp lệ');
      }

      const failedRows = Array.from(
        new Set(importResult.errors.map((item) => item.row).filter((row) => Number.isFinite(row) && row > 1))
      ).sort((a, b) => a - b);

      const errorByRow = new Map<number, string[]>();
      importResult.errors.forEach((item) => {
        const list = errorByRow.get(item.row) ?? [];
        list.push(item.message + (item.studentCode ? ` (${item.studentCode})` : ''));
        errorByRow.set(item.row, list);
      });

      const exportRows: (string | number | boolean | null)[][] = [[...header, 'Lỗi import']];

      failedRows.forEach((rowNumber) => {
        const sourceRow = rows[rowNumber - 1] ?? [];
        const normalized = [...sourceRow];
        while (normalized.length < header.length) normalized.push('');
        const messages = Array.from(new Set(errorByRow.get(rowNumber) ?? []));
        exportRows.push([...normalized, messages.join(' | ')]);
      });

      if (exportRows.length === 1) {
        exportRows.push(['', '', '', '', '', 'Không trích xuất được dòng lỗi từ file gốc']);
      }

      const outWb = XLSX.utils.book_new();
      const outSheet = XLSX.utils.aoa_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(outWb, outSheet, 'students_errors');

      const baseName = importFile.name.replace(/\.[^.]+$/, '');
      XLSX.writeFile(outWb, `${baseName}_errors.xlsx`);
      notify.success('Đã tải file lỗi import');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Không thể tạo file lỗi import');
    } finally {
      setIsDownloadingErrorFile(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2>Quản lý sinh viên</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setImportError('');
              setImportResult(null);
              setShowImportErrorModal(false);
              setImportFile(null);
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-sm hover:bg-muted transition cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Nhập Excel
          </button>
          <button
            onClick={() => {
              setFormError('');
              setCreateForm(EMPTY_FORM);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm sinh viên
          </button>
        </div>
      </div>

      {isError && <ErrorState message={(error as Error)?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu'} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 border border-border text-center">
          <p className="text-2xl text-[#009dd9]">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Tổng sinh viên</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border text-center">
          <p className="text-2xl text-green-600">{summary.active}</p>
          <p className="text-xs text-muted-foreground mt-1">Hoạt động</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border text-center">
          <p className="text-2xl text-red-600">{summary.locked}</p>
          <p className="text-xs text-muted-foreground mt-1">Đã khóa</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-border mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30"
          />
        </div>
        <PortableSelect
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[220px]"
          labelClassName="text-sm"
        >
          <option value="">Tất cả lớp hành chính</option>
          {classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </PortableSelect>
        <PortableSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'active' | 'locked' | '')}
          className="px-4 py-2 rounded-lg border border-border text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 min-w-[180px]"
          labelClassName="text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Đã khóa</option>
        </PortableSelect>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">STT</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Tên sinh viên</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Mã sinh viên</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Ngày sinh</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Giới tính</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Lớp hành chính</th>
                {/* TODO(face): Mở lại cột ảnh khuôn mặt khi triển khai trang quản lý ảnh riêng */}
                {/* <th className="text-left py-3 px-4 font-normal text-muted-foreground">Ảnh mặt</th> */}
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Trạng thái</th>
                <th className="text-left py-3 px-4 font-normal text-muted-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <EmptyState hasFilter={hasFilter} />
              ) : (
                students.map((item, index) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">{(currentPage - 1) * perPage + index + 1}</td>
                    <td className="py-3 px-4">{item.hoTen}</td>
                    <td className="py-3 px-4">{item.maSV}</td>
                    <td className="py-3 px-4">{formatDate(item.ngaySinh)}</td>
                    <td className="py-3 px-4">{genderLabel(item.gioiTinh)}</td>
                    <td className="py-3 px-4">{item.lopHanhChinh}</td>
                    {/* TODO(face): Mở lại cell số ảnh sau khi bật lại cột ảnh khuôn mặt */}
                    {/* <td className="py-3 px-4">{item.soAnhKhuonMat}</td> */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${item.trangThai === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.trangThai === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded hover:bg-muted transition cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                          title="Xóa cứng"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(item)}
                          className="p-1.5 rounded hover:bg-muted transition cursor-pointer"
                          title={item.trangThai === 'active' ? 'Khóa sinh viên' : 'Mở khóa sinh viên'}
                        >
                          {item.trangThai === 'active'
                            ? <Lock className="w-4 h-4 text-orange-500" />
                            : <Unlock className="w-4 h-4 text-green-600" />}
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
                : `Hiển thị ${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, total)} / ${total} sinh viên`}
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
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm cursor-pointer ${currentPage === i + 1 ? 'bg-[#009dd9] text-white' : 'hover:bg-muted'}`}
              >
                {i + 1}
              </button>
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
        <StudentModal
          title="Thêm sinh viên"
          mode="create"
          form={createForm}
          classOptions={classOptions}
          isPending={createMutation.isPending || addFaceMutation.isPending}
          isFacePending={createMutation.isPending || addFaceMutation.isPending}
          pendingFaces={pendingCreateFaces}
          existingFaces={[]}
          onChange={(key, value) => updateFormField('create', key, value)}
          onDropFaces={handleDropCreateFaces}
          onRemovePendingFace={(id) => {
            setPendingCreateFaces((prev) => prev.filter((item) => item.id !== id));
          }}
          onDeleteFace={() => {}}
          onClose={() => {
            setShowCreateModal(false);
            setPendingCreateFaces([]);
            setFormError('');
          }}
          onSubmit={handleCreate}
          error={formError}
        />
      )}

      <ImportExcelModal
        isOpen={showImportModal}
        selectedFile={importFile}
        isPending={importMutation.isPending}
        error={importError}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
          setImportError('');
        }}
        onSelectFile={handleSelectImportFile}
        onImport={handleImportExcel}
        onDownloadTemplate={handleDownloadTemplate}
      />

      <ImportErrorModal
        isOpen={showImportErrorModal}
        result={importResult}
        isDownloading={isDownloadingErrorFile}
        onDownloadErrorFile={handleDownloadErrorFile}
        onClose={() => {
          setShowImportErrorModal(false);
          setImportResult(null);
        }}
      />

      {showEditModal && (
        <StudentModal
          title="Cập nhật sinh viên"
          mode="edit"
          form={editForm}
          classOptions={classOptions}
          isPending={updateMutation.isPending}
          isFacePending={addFaceMutation.isPending || deleteFaceMutation.isPending || isEditingFacesLoading}
          pendingFaces={[]}
          existingFaces={editingFaces}
          onChange={(key, value) => updateFormField('edit', key, value)}
          onDropFaces={handleDropEditFaces}
          onRemovePendingFace={() => {}}
          onDeleteFace={handleDeleteEditFace}
          onClose={() => {
            setShowEditModal(false);
            setEditingId(null);
            setFormError('');
          }}
          onSubmit={handleSaveEdit}
          error={formError}
        />
      )}
    </div>
  );
}
