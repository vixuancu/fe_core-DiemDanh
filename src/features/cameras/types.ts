import type { BaseEntity, BaseFilter, BaseResponse, PaginatedResult } from '@/shared/types';

// Entity
export interface Camera extends BaseEntity {
    cameraName: string;
    ipAddress: string;
    cameraStatus: number;
    classroomId: number;
}


// Request
export interface CameraFilter extends BaseFilter {
    cameraName?: string;
}

export interface CameraCreateRequest {
    cameraName: string;
    ipAddress: string;
    classroomId: number;
    cameraStatus?: number;
}

export interface CameraUpdateRequest {
    cameraId: number;
    cameraName?: string;
    ipAddress?: string;
    classroomId?: number;
    cameraStatus?: number;
}

export interface CameraDeleteRequest {
    cameraId: number;
}

// Response
export interface CameraResponse extends BaseResponse {
    camera_name: string;
    ip_address: string;
    camera_status: number;
    classroom_id: number;
}