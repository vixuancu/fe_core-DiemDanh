import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services';
import type { ReportFilter } from '../types';

export const reportKeys = {
  all: ['reports'] as const,
  stats: (filter: ReportFilter) => [...reportKeys.all, 'stats', filter] as const,
  weeklyTrend: (filter: ReportFilter) => [...reportKeys.all, 'weeklyTrend', filter] as const,
  classSummary: (filter: ReportFilter) => [...reportKeys.all, 'classSummary', filter] as const,
  details: (filter: ReportFilter) => [...reportKeys.all, 'details', filter] as const,
};

export function useReportStats(filter: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.stats(filter),
    queryFn: () => reportService.getStats(filter),
    placeholderData: (prev) => prev,
  });
}

export function useWeeklyTrend(filter: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.weeklyTrend(filter),
    queryFn: () => reportService.getWeeklyTrend(filter),
    placeholderData: (prev) => prev,
  });
}

export function useClassSummary(filter: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.classSummary(filter),
    queryFn: () => reportService.getClassSummary(filter),
    placeholderData: (prev) => prev,
  });
}

export function useReportDetails(filter: ReportFilter) {
  return useQuery({
    queryKey: reportKeys.details(filter),
    queryFn: () => reportService.getDetails(filter),
    placeholderData: (prev) => prev,
  });
}
