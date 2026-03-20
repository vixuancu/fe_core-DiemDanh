import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authService } from '../services';
import type { User } from '../types';
import type { UserRole } from '@/shared/types';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục session khi app load (F5)
  useEffect(() => {
    authService.getCurrentUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const u = await authService.login({ username, password });
      setUser(u);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  /** Chỉ dùng trong demo/mock mode để chuyển role nhanh */
  const switchRole = useCallback((role: UserRole) => {
    const found = DEMO_USERS.find((u) => u.role === role);
    if (found) setUser(found);
  }, []);

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
