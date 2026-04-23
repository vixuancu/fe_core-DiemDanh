import { config } from '@/shared/config/env';
import { IReportService } from './report.service';
import { ReportFilter, ReportStatsResponse, WeeklyTrendItem, ClassSummaryItem, ReportDetailItem } from '../types';
import type { PaginatedResult } from '@/shared/types';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
});

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const reportApi: IReportService = {
  async getStats(filter: ReportFilter): Promise<ReportStatsResponse> {
    const params = new URLSearchParams();
    if (filter.course_section_id) params.append('course_section_id', filter.course_section_id);
    if (filter.from_date) params.append('from_date', filter.from_date);
    if (filter.to_date) params.append('to_date', filter.to_date);

    const res = await fetch(`${config.apiBaseUrl}/reports/stats?${params}`, { headers: getHeaders() });
    const response = await handleResponse<any>(res);
    return response.data;
  },

  async getWeeklyTrend(filter: ReportFilter): Promise<WeeklyTrendItem[]> {
    const params = new URLSearchParams();
    if (filter.course_section_id) params.append('course_section_id', filter.course_section_id);
    if (filter.from_date) params.append('from_date', filter.from_date);
    if (filter.to_date) params.append('to_date', filter.to_date);

    const res = await fetch(`${config.apiBaseUrl}/reports/weekly-trend?${params}`, { headers: getHeaders() });
    const response = await handleResponse<any>(res);
    return response.data;
  },

  async getClassSummary(filter: ReportFilter): Promise<ClassSummaryItem[]> {
    const params = new URLSearchParams();
    if (filter.from_date) params.append('from_date', filter.from_date);
    if (filter.to_date) params.append('to_date', filter.to_date);

    const res = await fetch(`${config.apiBaseUrl}/reports/class-summary?${params}`, { headers: getHeaders() });
    const response = await handleResponse<any>(res);
    return response.data;
  },

  async getDetails(filter: ReportFilter): Promise<PaginatedResult<ReportDetailItem>> {
    const params = new URLSearchParams();
    if (filter.course_section_id) params.append('course_section_id', filter.course_section_id);
    if (filter.from_date) params.append('from_date', filter.from_date);
    if (filter.to_date) params.append('to_date', filter.to_date);
    params.append('page', String(filter.page ?? 1));
    params.append('per_page', String(filter.per_page ?? 10));

    const res = await fetch(`${config.apiBaseUrl}/reports/details?${params}`, { headers: getHeaders() });
    const response = await handleResponse<any>(res);
    
    // Transform from FastAPI generic data response to frontend PaginatedResult
    return {
      data: response.data.data,
      total: response.data.total,
      page: response.data.page,
      perPage: response.data.per_page,
      totalPages: response.data.total_pages
    };
  }
};
