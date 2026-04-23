import { IReportService } from './report.service';
import { ReportFilter, ReportStatsResponse, WeeklyTrendItem, ClassSummaryItem, ReportDetailItem } from '../types';
import type { PaginatedResult } from '@/shared/types';
import { mockDiemDanh } from '@/app/components/data';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const reportMock: IReportService = {
  async getStats(filter: ReportFilter): Promise<ReportStatsResponse> {
    await delay();
    const total = 200;
    return {
      total_records: total,
      co_mat: Math.floor(total * 0.8),
      tre: Math.floor(total * 0.1),
      vang: Math.floor(total * 0.1),
    };
  },

  async getWeeklyTrend(filter: ReportFilter): Promise<WeeklyTrendItem[]> {
    await delay();
    return [
      { week_label: 'Tuần 1', week_start: '2026-01-05', co_mat: 85, tre: 8, vang: 7 },
      { week_label: 'Tuần 2', week_start: '2026-01-12', co_mat: 88, tre: 6, vang: 6 },
      { week_label: 'Tuần 3', week_start: '2026-01-19', co_mat: 82, tre: 10, vang: 8 },
      { week_label: 'Tuần 4', week_start: '2026-01-26', co_mat: 90, tre: 5, vang: 5 },
      { week_label: 'Tuần 5', week_start: '2026-02-02', co_mat: 87, tre: 7, vang: 6 },
    ];
  },

  async getClassSummary(filter: ReportFilter): Promise<ClassSummaryItem[]> {
    await delay();
    return [
      { course_section_id: 1, course_section_name: 'CS1', course_name: 'Toán cao cấp', attendance_rate: 85.5 },
      { course_section_id: 2, course_section_name: 'CS2', course_name: 'Lập trình Web', attendance_rate: 92.0 },
      { course_section_id: 3, course_section_name: 'CS3', course_name: 'Cấu trúc dữ liệu', attendance_rate: 78.5 },
    ];
  },

  async getDetails(filter: ReportFilter): Promise<PaginatedResult<ReportDetailItem>> {
    await delay();
    const { page = 1, per_page = 10 } = filter;
    
    // Convert mock data
    const records = mockDiemDanh.map((dd, i) => {
      let status = 2; // vang
      if (dd.trangThai === 'co_mat') status = 1;
      if (dd.trangThai === 'tre') status = 3;
      
      return {
        id: i + 1,
        student_code: dd.maSV,
        student_name: dd.hoTenSV,
        course_name: dd.tenMonHoc,
        course_section_name: dd.maLop,
        session_date: '2026-01-01',
        attendance_time: '08:00:00',
        status: status,
        status_label: dd.trangThai === 'co_mat' ? 'Có mặt' : dd.trangThai === 'tre' ? 'Đi trễ' : 'Vắng',
      } as ReportDetailItem;
    });

    const start = (page - 1) * per_page;
    const end = start + per_page;
    const data = records.slice(start, end);
    const total = records.length;
    
    return {
      data,
      total,
      page,
      perPage: per_page,
      totalPages: Math.ceil(total / per_page)
    };
  }
};
