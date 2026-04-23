import {
  ReportStatsResponse,
  WeeklyTrendItem,
  ClassSummaryItem,
  ReportDetailItem,
  ReportFilter
} from '../types';
import type { PaginatedResult } from '@/shared/types';

export interface IReportService {
  getStats(filter: ReportFilter): Promise<ReportStatsResponse>;
  getWeeklyTrend(filter: ReportFilter): Promise<WeeklyTrendItem[]>;
  getClassSummary(filter: ReportFilter): Promise<ClassSummaryItem[]>;
  getDetails(filter: ReportFilter): Promise<PaginatedResult<ReportDetailItem>>;
}
