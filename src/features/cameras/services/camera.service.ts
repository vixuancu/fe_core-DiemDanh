import type { PaginatedResult } from '@/shared/types';
import type { Camera, CameraCreateRequest, CameraUpdateRequest, CameraDeleteRequest, CameraFilter } from '../types';
import { ApiEnvelope } from '@/shared/model/api-error.model';

export interface ICameraService {
    getCameras(filter: CameraFilter): Promise<PaginatedResult<Camera>>;
    create(request: CameraCreateRequest): Promise<ApiEnvelope<Camera>>;
    update(request: CameraUpdateRequest): Promise<ApiEnvelope<Camera>>;
    delete(request: CameraDeleteRequest): Promise<ApiEnvelope<Camera>>;
}
