import type { PaginatedResult } from '@/shared/types';

export interface AdministrativeClassItem {
  id: string;
  name: string;
  studentCount: number;
  status: 'active' | 'locked';
}

export interface AdministrativeClassFilter {
  search?: string;
  status?: 'active' | 'locked' | '';
  page?: number;
  perPage?: number;
}

export interface CreateAdministrativeClassDto {
  name: string;
}

export interface UpdateAdministrativeClassDto {
  name: string;
}

export interface AdministrativeClassStats {
  total: number;
  active: number;
  locked: number;
}

export type AdministrativeClassPage = PaginatedResult<AdministrativeClassItem>;
