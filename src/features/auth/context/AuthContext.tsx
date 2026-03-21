import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services';
import type { User } from '../types';
import type { UserRole } from '@/shared/types';
import { AUTH_LOGOUT_EVENT } from '../session';
import { notify } from '@/shared/lib/notify';

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Chuyển role nhanh trong demo mode */
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const DEMO_USERS: User[] = [
  { id: '1', hoTen: 'Nguyễn Văn Admin', email: 'admin@edu.vn', role: 'admin' },
  { id: '2', hoTen: 'Trần Thị Giáo Vụ', email: 'giaovu@edu.vn', role: 'giao_vu' },
  { id: '3', hoTen: 'Đỗ Duy Trình', email: 'trinh.dd@edu.vn', role: 'giang_vien' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục session khi app load (F5)
  useEffect(() => {
    authService.getCurrentUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      queryClient.clear();
      notify.warning('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout as EventListener);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout as EventListener);
    };
  }, [queryClient]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const u = await authService.login({ username, password });
      queryClient.clear();
      setUser(u);
      return true;
    } catch {
      await authService.logout();
      queryClient.clear();
      setUser(null);
      notify.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      return false;
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    await authService.logout();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  /** Chỉ dùng trong demo/mock mode để chuyển role nhanh */
  const switchRole = useCallback((role: UserRole) => {
    const found = DEMO_USERS.find((u) => u.role === role);
    if (found) {
      queryClient.clear();
      setUser(found);
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
