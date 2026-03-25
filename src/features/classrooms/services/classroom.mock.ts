import type { ClassroomCreateRequest, ClassroomFilter, ClassroomUpdateRequest } from '../types';
import type { BaseResult, PaginatedResult } from '@/shared/types';
import { mockClassroom } from '@/app/components/data';
import { Classroom } from '../types';
import { IClassroomService } from './classroom.service';
import type { ApiEnvelope } from '@/shared/model/api-error.model';

let STORE: Classroom[] = [...mockClassroom] as Classroom[];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const classroomMock: IClassroomService = {
    async getClassrooms({ }: ClassroomFilter): Promise<PaginatedResult<Classroom>> {
        await delay();

        const data = null, total = null, page = null, perPage = null, totalPages = 0;
        return {
            data,
            total,
            page,
            perPage,
            totalPages,
        };
    },

    async getAvailableClassrooms(): Promise<BaseResult<Classroom>> {
        await delay();
        return { data: STORE };
    },

    async create(request: ClassroomCreateRequest): Promise<ApiEnvelope<Classroom>> {
        await delay();
        const newItem: Classroom = {
            id: STORE.length ? Math.max(...STORE.map((item) => Number(item.id))) + 1 : 1,
            className: request.class_name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        STORE = [newItem, ...STORE];
        return { success: true, data: newItem, message: 'OK' };
    },

    async update(id: number, request: ClassroomUpdateRequest): Promise<Classroom> {
        await delay();
        const idx = STORE.findIndex((item) => Number(item.id) === id);
        if (idx < 0) throw new Error('Không tìm thấy phòng học');
        STORE[idx] = {
            ...STORE[idx],
            className: request.class_name ?? STORE[idx].className,
            updatedAt: new Date().toISOString(),
        };
        return STORE[idx];
    },

    async delete(id: number): Promise<void> {
        await delay();
        STORE = STORE.filter((item) => Number(item.id) !== id);
    },
}