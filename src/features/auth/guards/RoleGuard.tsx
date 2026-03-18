import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '@/shared/types';

interface RoleGuardProps {
  /** Danh sách role được phép truy cập route này */
  allowedRoles: UserRole[];
}

/**
 * RoleGuard — Bảo vệ route theo role
 * Nếu role không được phép → redirect về /dashboard
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
