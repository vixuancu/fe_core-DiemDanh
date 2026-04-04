import { config } from '@/shared/config/env';
import type { PaginatedResult, BaseResult } from '@/shared/types';
import { getAuthHeaders } from '@/features/auth/session';
import { formatDateTime } from '@/shared/util/format';
import { Classroom, ClassroomFilter, ClassroomResponse, ClassroomUpdateRequest } from '../types';
import { IClassroomService } from './classroom.service';
import { ClassroomCreateRequest } from '../types'
import { parseEnvelope, parseListEnvelope, ApiEnvelope } from '@/shared/model/api-error.model';

const API_URL = `${config.apiBaseUrl}/classrooms`;

function mapClassroom(item: ClassroomResponse): Classroom {
    return {
        id: Number(item.id),
        className: item.class_name?.trim(),
        camera: item.camera ? {
            cameraId: item.camera.camera_id,
            cameraName: item.camera.camera_name,
            ipAddress: item.camera.ip_address
        } : undefined,
        createdAt: formatDateTime(item.created_at),
        updatedAt: formatDateTime(item.updated_at)
    }
}

export const classroomApi: IClassroomService = {
    async getClassrooms(filter: ClassroomFilter): Promise<PaginatedResult<Classroom>> {
        const params = new URLSearchParams();
        if (filter.className) params.set('className', filter.className);
        params.set('page', String(filter.page ?? 1));
        params.set('page_size', String(filter.pageSize ?? 10));

        const res = await fetch(`${API_URL}?${params.toString()}`, {
            headers: getAuthHeaders(),
        });
        const payload = await parseListEnvelope<ClassroomResponse>(res);
        const sortedItems = [...payload.data].sort((a, b) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
            const byCreatedAt = bTime - aTime;

            if (Number.isNaN(byCreatedAt) || byCreatedAt === 0) {
                return Number(b.id) - Number(a.id);
            }

            return byCreatedAt;
        });

        const data = sortedItems.map(mapClassroom);
        return {
            data,
            total: payload.total,
            page: payload.page,
            perPage: payload.page_size,
            totalPages: payload.total_pages,
        };
    },

    async getAvailableClassrooms(): Promise<BaseResult<Classroom>> {
        const res = await fetch(`${API_URL}/available`, {
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        return data;
    },

    async create(request: ClassroomCreateRequest): Promise<ApiEnvelope<Classroom>> {
        const res = await fetch(`${config.apiBaseUrl}/classrooms`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(request),
        });
        const classroom = await parseEnvelope<Classroom>(res);
        return classroom;
    },

    async update(id: number, request: ClassroomUpdateRequest): Promise<Classroom> {
        const res = await fetch(`${config.apiBaseUrl}/classrooms/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(request),
        });
        const payload = await parseEnvelope<ClassroomResponse>(res);
        return mapClassroom(payload.data);
    },

    async delete(id: number): Promise<void> {
        const res = await fetch(`${config.apiBaseUrl}/classrooms/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        await parseEnvelope<ClassroomResponse>(res);
    },
};
