import type {
  CreditClassFormOptions,
  LopTinChi,
  CreateLopTinChiDto,
  UpdateLopTinChiDto,
  CreditClassFilter,
} from '../types';
import type { PaginatedResult } from '@/shared/types';
export interface ICreditClassService {
  list(filter: CreditClassFilter): Promise<PaginatedResult<LopTinChi>>;
  create(dto: CreateLopTinChiDto): Promise<LopTinChi>;
  update(id: string, dto: UpdateLopTinChiDto): Promise<LopTinChi>;
  delete(id: string): Promise<void>;
  getFormOptions(): Promise<CreditClassFormOptions>;
}
