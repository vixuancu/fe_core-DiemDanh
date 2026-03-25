import type { BaseEntity, BaseFilter, BaseResponse, PaginatedResult } from '@/shared/types';

// Entity
export interface Classroom extends BaseEntity {
    className: string;
    camera?: {
        cameraId: number;
        cameraName: string;
        ipAddress: string;
    }
}

// Request
export interface ClassroomFilter extends BaseFilter {
    className?: string;
}

export interface ClassroomCreateRequest {
    class_name: string;
}

export interface ClassroomUpdateRequest {
    class_name?: string;
}

// Response
export interface ClassroomResponse extends BaseResponse {
    class_name: string;
    camera?: {
        camera_id: number;
        camera_name: string;
        ip_address: string;
    }
}
