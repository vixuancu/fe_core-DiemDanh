import type { BaseResult, PaginatedResult } from '@/shared/types';
import type { Classroom, ClassroomCreateRequest, ClassroomFilter, ClassroomUpdateRequest } from '../types';
import { SuccessResponse } from '@/shared/model/api-response.model';
import { ApiEnvelope } from '@/shared/model/api-error.model';

export interface IClassroomService {
    getClassrooms(filter: ClassroomFilter): Promise<PaginatedResult<Classroom>>;
    getAvailableClassrooms(): Promise<BaseResult<Classroom>>
    create(request: ClassroomCreateRequest): Promise<ApiEnvelope<Classroom>>;
    update(id: number, request: ClassroomUpdateRequest): Promise<Classroom>;
    delete(id: number): Promise<void>;
    // list(filter: AccountFilter): Promise<PaginatedResult<Account>>;
    // getStats(): Promise<{ total: number; giaoVu: number; giangVien: number; active: number; locked: number }>;
    // create(dto: CreateAccountDto): Promise<Account>;
    // update(id: string, dto: UpdateAccountDto): Promise<Account>;
    // delete(id: string): Promise<void>;
    // resetPassword(id: string): Promise<void>;
}
