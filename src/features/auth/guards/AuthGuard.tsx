import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * AuthGuard — Bảo vệ các route cần đăng nhập
 * Nếu chưa đăng nhập → redirect về /login
 */
export function AuthGuard() {
  const { user, isLoading } = useAuth();

  // Đang khôi phục session (tránh flash redirect)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#009dd9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
