/**
 * Backward-compat re-export
 * Các component cũ dùng: import { useAuth } from './auth-context'
 * vẫn hoạt động mà không cần sửa.
 */
export { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
export type { User } from '@/features/auth/types';
export type { UserRole } from '@/shared/types';
