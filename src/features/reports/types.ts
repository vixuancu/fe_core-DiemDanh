import type { PaginatedResult } from "@/shared/types";

export interface ReportStatsResponse {
  total_records: number;
  co_mat: number;
  tre: number;
  vang: number;
}

export interface ReportOverviewResponse {
  student_total: number;
  lecturer_total: number;
  course_section_total: number;
  camera_total: number;
  camera_online: number;
  room_total: number;
  attendance_total: number;
  attendance_present: number;
  attendance_late: number;
  attendance_absent: number;
}

export interface WeeklyTrendItem {
  week_label: string;
  week_start: string;
  co_mat: number;
  tre: number;
  vang: number;
}

export interface ClassSummaryItem {
  course_section_id: number;
  course_section_name: string;
  course_name: string;
  attendance_rate: number;
}

export interface ReportDetailItem {
  id: number | null;
  student_code: string;
  student_name: string;
  course_name: string;
  course_section_name: string;
  session_date: string;
  attendance_time: string | null;
  status: number | null; // 1: C, 2: V, 3: M
  status_label: string;
}

export interface ReportFilter {
  course_section_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}
