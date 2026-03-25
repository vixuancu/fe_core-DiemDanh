import { config } from '@/shared/config/env';
import type { ICameraService } from './camera.service';
import type { Camera, CameraFilter, CameraResponse } from '../types';
import { CameraCreateRequest, CameraUpdateRequest, CameraDeleteRequest } from '../types'
import type { PaginatedResult } from '@/shared/types';
import { forceLogout, getAccessToken, getAuthHeaders } from '@/features/auth/session';
import { formatDateTime, toIsoDate } from '@/shared/util/format';
import { parseEnvelope, parseListEnvelope, ApiEnvelope } from '@/shared/model/api-error.model';

const API_URL = `${config.apiBaseUrl}/cameras`;


function mapCamera(item: CameraResponse): Camera {
    return {
        id: Number(item.id),
        cameraName: item.camera_name?.trim(),
        ipAddress: item.ip_address?.trim(),
        cameraStatus: item.camera_status,
        classroomId: item.classroom_id,
        createdAt: formatDateTime(item.created_at),
        updatedAt: formatDateTime(item.updated_at)
    }
}

export const cameraApi: ICameraService = {
    async getCameras(filter: CameraFilter): Promise<PaginatedResult<Camera>> {
        const params = new URLSearchParams();
        if (filter.cameraName) params.set('cameraName', filter.cameraName);
        params.set('page', String(filter.page ?? 1));
        params.set('page_size', String(filter.pageSize ?? 10));

        const res = await fetch(`${API_URL}?${params.toString()}`, {
            headers: getAuthHeaders(),
        });
        const payload = await parseListEnvelope<CameraResponse>(res);
        const data = payload.data.map(mapCamera);
        return {
            data,
            total: payload.total,
            page: payload.page,
            perPage: payload.page_size,
            totalPages: payload.total_pages,
        };
    },

    async create(request: CameraCreateRequest): Promise<ApiEnvelope<Camera>> {
        const body = {
            camera_name: request.cameraName,
            ip_address: request.ipAddress,
            classroom_id: request.classroomId ? Number(request.classroomId) : null,
            camera_status: request.cameraStatus
        };
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });

        const camera = await parseEnvelope<Camera>(res);
        return camera;
    },

    async update(request: CameraUpdateRequest): Promise<ApiEnvelope<Camera>> {
        const id = request.cameraId;
        const body = {
            camera_name: request.cameraName,
            ip_address: request.ipAddress,
            classroom_id: request.classroomId ? Number(request.classroomId) : null,
            camera_status: request.cameraStatus
        };

        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });

        const camera = await parseEnvelope<Camera>(res);
        return camera;
    },

    async delete(request: CameraDeleteRequest): Promise<ApiEnvelope<Camera>> {
        const id = request.cameraId;
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        });

        const camera = await parseEnvelope<Camera>(res);
        return camera;
    },
};
