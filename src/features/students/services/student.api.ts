import { config } from "@/shared/config/env";
import { forceLogout, getAccessToken } from "@/features/auth/session";
import { toDateInputValue } from "@/shared/lib/date-time";
import type { IStudentService } from "./student.service";
import type {
  CreateSinhVienDto,
  LopHanhChinhOption,
  PaginatedResult,
  SinhVien,
  StudentFaceItem,
  StudentFilter,
  StudentImportResult,
  StudentStats,
  UpdateSinhVienDto,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiListEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface BackendStudent {
  id: number;
  student_code: string;
  full_name: string;
  birth_of_date?: string | null;
  gender?: boolean | null;
  administrative_class_id?: number | null;
  administrative_class_name?: string | null;
  face_count?: number;
  is_cancel: boolean;
}

interface BackendFace {
  id: number;
  student_id: number;
  image_url: string;
  created_at?: string | null;
}

interface BackendAdministrativeClass {
  id: number;
  name: string;
}

interface BackendImportError {
  row: number;
  field: string;
  student_code?: string | null;
  message: string;
}

interface BackendImportResult {
  total_rows: number;
  imported_count: number;
  failed_count: number;
  errors: BackendImportError[];
}

interface BackendStudentStats {
  total: number;
  active_count: number;
  locked_count: number;
}

const API_URL = `${config.apiBaseUrl}/students`;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function mapStudent(item: BackendStudent): SinhVien {
  return {
    id: String(item.id),
    maSV: item.student_code,
    hoTen: item.full_name,
    ngaySinh: toDateInputValue(item.birth_of_date),
    gioiTinh: item.gender ?? null,
    lopHanhChinhId: item.administrative_class_id
      ? String(item.administrative_class_id)
      : "",
    lopHanhChinh: item.administrative_class_name || "Chưa phân lớp",
    trangThai: item.is_cancel ? "locked" : "active",
    soAnhKhuonMat: item.face_count ?? 0,
  };
}

function mapFace(item: BackendFace): StudentFaceItem {
  return {
    id: String(item.id),
    imageUrl: item.image_url,
    createdAt: item.created_at || undefined,
  };
}

function mapImportResult(item: BackendImportResult): StudentImportResult {
  return {
    totalRows: item.total_rows,
    importedCount: item.imported_count,
    failedCount: item.failed_count,
    errors: item.errors.map((error) => ({
      row: error.row,
      field: error.field,
      studentCode: error.student_code || undefined,
      message: error.message,
    })),
  };
}

function mapStats(item: BackendStudentStats): StudentStats {
  return {
    total: item.total,
    active: item.active_count,
    locked: item.locked_count,
  };
}

function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAccessToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const payload = (await res.json().catch(() => ({}))) as Partial<
    ApiEnvelope<T>
  >;
  if (res.status === 401) {
    forceLogout();
    throw new ApiError(
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      401,
    );
  }
  if (!res.ok || !payload.success) {
    throw new ApiError(
      payload.message || "Có lỗi xảy ra từ máy chủ",
      res.status,
    );
  }
  return payload as ApiEnvelope<T>;
}

async function parseListEnvelope<T>(
  res: Response,
): Promise<ApiListEnvelope<T>> {
  const payload = (await res.json().catch(() => ({}))) as Partial<
    ApiListEnvelope<T>
  >;
  if (res.status === 401) {
    forceLogout();
    throw new ApiError(
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      401,
    );
  }
  if (!res.ok || !payload.success) {
    throw new ApiError(
      payload.message || "Có lỗi xảy ra từ máy chủ",
      res.status,
    );
  }
  return payload as ApiListEnvelope<T>;
}

export const studentApi: IStudentService = {
  async list(filter: StudentFilter): Promise<PaginatedResult<SinhVien>> {
    const params = new URLSearchParams();
    if (filter.search) params.set("search", filter.search);
    if (filter.lopHanhChinhId)
      params.set("administrative_class_id", filter.lopHanhChinhId);
    if (filter.trangThai)
      params.set("is_cancel", String(filter.trangThai === "locked"));
    params.set("page", String(filter.page ?? 1));
    params.set("page_size", String(filter.perPage ?? 10));

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseListEnvelope<BackendStudent>(res);
    return {
      data: payload.data.map(mapStudent),
      total: payload.total,
      page: payload.page,
      perPage: payload.page_size,
      totalPages: payload.total_pages,
    };
  },

  async getById(id: string): Promise<SinhVien> {
    const res = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    const payload = await parseEnvelope<BackendStudent>(res);
    return mapStudent(payload.data);
  },

  async create(dto: CreateSinhVienDto): Promise<SinhVien> {
    const body = {
      student_code: dto.maSV,
      full_name: dto.hoTen,
      birth_of_date: dto.ngaySinh ? `${dto.ngaySinh}T00:00:00` : null,
      gender: dto.gioiTinh ?? null,
      administrative_class_id: Number(dto.lopHanhChinhId),
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    const payload = await parseEnvelope<BackendStudent>(res);
    return { ...mapStudent(payload.data), soAnhKhuonMat: 0 };
  },

  async update(id: string, dto: UpdateSinhVienDto): Promise<SinhVien> {
    const body: Record<string, unknown> = {
      student_code: dto.maSV,
      full_name: dto.hoTen,
      birth_of_date: dto.ngaySinh
        ? `${dto.ngaySinh}T00:00:00`
        : dto.ngaySinh === ""
          ? null
          : undefined,
      gender: dto.gioiTinh,
      administrative_class_id: dto.lopHanhChinhId
        ? Number(dto.lopHanhChinhId)
        : undefined,
      is_cancel:
        dto.trangThai === undefined ? undefined : dto.trangThai === "locked",
    };

    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    const payload = await parseEnvelope<BackendStudent>(res);
    return mapStudent(payload.data);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/${id}?hard=true`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    await parseEnvelope<null>(res);
  },

  async getLopOptions(): Promise<LopHanhChinhOption[]> {
    const res = await fetch(`${API_URL}/administrative-classes`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseListEnvelope<BackendAdministrativeClass>(res);
    return payload.data.map((item) => ({
      id: String(item.id),
      name: item.name,
    }));
  },

  async getStats(
    filter: Pick<StudentFilter, "search" | "lopHanhChinhId">,
  ): Promise<StudentStats> {
    const params = new URLSearchParams();
    if (filter.search) params.set("search", filter.search);
    if (filter.lopHanhChinhId)
      params.set("administrative_class_id", filter.lopHanhChinhId);

    const query = params.toString();
    const res = await fetch(`${API_URL}/stats${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseEnvelope<BackendStudentStats>(res);
    return mapStats(payload.data);
  },

  async importFromExcel(file: File): Promise<StudentImportResult> {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const res = await fetch(`${API_URL}/import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    const payload = await parseEnvelope<BackendImportResult>(res);
    return mapImportResult(payload.data);
  },

  async downloadImportTemplate(): Promise<Blob> {
    const res = await fetch(`${API_URL}/import/template`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      forceLogout();
      throw new ApiError(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        401,
      );
    }
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new ApiError(
        payload.message || "Tải file mẫu thất bại",
        res.status,
      );
    }
    return await res.blob();
  },

  async listFaces(studentId: string): Promise<StudentFaceItem[]> {
    const res = await fetch(`${API_URL}/${studentId}/faces`, {
      headers: getAuthHeaders(),
    });
    const payload = await parseListEnvelope<BackendFace>(res);
    return payload.data.map(mapFace);
  },

  async addFace(studentId: string, imageUrl: string): Promise<StudentFaceItem> {
    const res = await fetch(`${API_URL}/${studentId}/faces`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ image_url: imageUrl }),
    });
    const payload = await parseEnvelope<BackendFace>(res);
    return mapFace(payload.data);
  },

  async deleteFace(studentId: string, faceId: string): Promise<void> {
    const res = await fetch(`${API_URL}/${studentId}/faces/${faceId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    await parseEnvelope<null>(res);
  },
  async uploadFaceFiles(studentId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const res = await fetch(`${API_URL}/${studentId}/faces/upload`, {
      method: "POST",
      headers: getAuthHeaders(), // KHÔNG set Content-Type, để browser tự set
      body: formData,
    });
    const payload = await parseEnvelope<any>(res);
    return payload.data;
  },
};
