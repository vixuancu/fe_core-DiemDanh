import type {
  AdministrativeClassFilter,
  AdministrativeClassItem,
  AdministrativeClassPage,
  AdministrativeClassStats,
  CreateAdministrativeClassDto,
  UpdateAdministrativeClassDto,
} from '../types';

export interface IAdministrativeClassService {
  list(filter: AdministrativeClassFilter): Promise<AdministrativeClassPage>;
  getById(id: string): Promise<AdministrativeClassItem>;
  create(dto: CreateAdministrativeClassDto): Promise<AdministrativeClassItem>;
  update(id: string, dto: UpdateAdministrativeClassDto): Promise<AdministrativeClassItem>;
  lock(id: string): Promise<AdministrativeClassItem>;
  unlock(id: string): Promise<AdministrativeClassItem>;
  getStats(filter: Pick<AdministrativeClassFilter, 'search'>): Promise<AdministrativeClassStats>;
}
