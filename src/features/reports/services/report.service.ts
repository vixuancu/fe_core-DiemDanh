import {
  ReportStatsResponse,
  ReportOverviewResponse,
  WeeklyTrendItem,
  ClassSummaryItem,
  ReportDetailItem,
  ReportFilter,
} from "../types";
import type { PaginatedResult } from "@/shared/types";

export interface IReportService {
  getStats(filter: ReportFilter): Promise<ReportStatsResponse>;
  getOverview(): Promise<ReportOverviewResponse>;
  getWeeklyTrend(filter: ReportFilter): Promise<WeeklyTrendItem[]>;
  getClassSummary(filter: ReportFilter): Promise<ClassSummaryItem[]>;
  getDetails(filter: ReportFilter): Promise<PaginatedResult<ReportDetailItem>>;
}
