import { useAuth } from '@/features/auth/context/AuthContext';
import { roleLabels, type UserRole } from '@/shared/types';
import {
    BarChart3,
    Bell,
    BookOpen, BookOpenText, Building2, CalendarDays,
    Camera,
    ChevronDown,
    ClipboardCheck,
    GraduationCap,
    History,
    LayoutDashboard,
    LogOut, Menu,
    ScanFace,
    School,
    UserCog,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';

// ─── Nav config ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

interface TabMeta {
  title: string;
  description?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'giao_vu', 'giang_vien'] },
  { label: 'Quản lý sinh viên', path: '/sinh-vien', icon: <GraduationCap className="w-5 h-5" />, roles: ['admin', 'giao_vu'] },
  { label: 'Học phần', path: '/hoc-phan', icon: <BookOpenText className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Lớp hành chính', path: '/lop-hanh-chinh', icon: <School className="w-5 h-5" />, roles: ['admin', 'giao_vu'] },
  { label: 'Lớp tín chỉ', path: '/lop-tin-chi', icon: <BookOpen className="w-5 h-5" />, roles: ['admin', 'giao_vu'] },
  { label: 'Phòng học', path: '/phong-hoc', icon: <Building2 className="w-5 h-5" />, roles: ['admin', 'giao_vu'] },
  { label: 'Lịch dạy', path: '/lich-hoc', icon: <CalendarDays className="w-5 h-5" />, roles: ['admin', 'giao_vu', 'giang_vien'] },
  { label: 'Điểm danh', path: '/diem-danh', icon: <ScanFace className="w-5 h-5" />, roles: ['admin', 'giao_vu'] },
  { label: 'Kết quả điểm danh', path: '/ket-qua-diem-danh', icon: <ClipboardCheck className="w-5 h-5" />, roles: ['giang_vien'] },
  { label: 'Lịch sử điểm danh', path: '/lich-su', icon: <History className="w-5 h-5" />, roles: ['admin', 'giao_vu', 'giang_vien'] },
  { label: 'Báo cáo thống kê', path: '/bao-cao', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'giao_vu'] },
  { label: 'Quản lý camera', path: '/camera', icon: <Camera className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Quản lý tài khoản', path: '/tai-khoan', icon: <UserCog className="w-5 h-5" />, roles: ['admin'] },
];

const TAB_META: Record<string, TabMeta> = {
  '/dashboard': {
    title: 'Tổng quan'
  },
  '/sinh-vien': {
    title: 'Quản lý sinh viên'
  },
  '/lop-hanh-chinh': {
    title: 'Lớp hành chính'
  },
  '/lop-tin-chi': {
    title: 'Lớp tín chỉ'
  },
  '/phong-hoc': {
    title: 'Phòng học'
  },
  '/lich-hoc': {
    title: 'Lịch dạy'
  },
  '/diem-danh': {
    title: 'Điểm danh'
  },
  '/ket-qua-diem-danh': {
    title: 'Kết quả điểm danh'
  },
  '/lich-su': {
    title: 'Lịch sử điểm danh'
  },
  '/bao-cao': {
    title: 'Báo cáo thống kê'
  },
  '/camera': {
    title: 'Quản lý camera'
  },
  '/tai-khoan': {
    title: 'Quản lý tài khoản'
  },
  '/doi-mat-khau': {
    title: 'Đổi mật khẩu'
  },
};

const APP_BREADCRUMB = 'Hệ thống điểm danh';

function getTabMeta(pathname: string): TabMeta {
  const exact = TAB_META[pathname];
  if (exact) return exact;

  const matchedPath = Object.keys(TAB_META).find((path) => pathname.startsWith(path));
  return matchedPath ? TAB_META[matchedPath] : { title: 'Trang hiện tại' };
}

// ─── AppShell ───────────────────────────────────────────────────────────────

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const tabMeta = getTabMeta(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#f0f4f8]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-border flex flex-col transition-all duration-300 shrink-0 z-20`}>
        <div className={`h-16 flex items-center ${sidebarOpen ? 'gap-3 px-5' : 'justify-center px-0'} border-b border-border shrink-0 transition-padding duration-300`}>
          <div className="w-9 h-9 rounded-lg bg-[#009dd9] flex items-center justify-center shrink-0">
            <ScanFace className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm text-[#009dd9] font-medium truncate">Hệ thống điểm danh</p>
              <p className="text-xs text-muted-foreground truncate">Nhận dạng khuôn mặt</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center ${sidebarOpen ? 'gap-3 px-3 justify-start' : 'justify-center px-0'} py-2.5 rounded-lg transition-colors text-sm w-full ${
                location.pathname === item.path
                  ? 'bg-[#009dd9] text-white'
                  : 'text-foreground hover:bg-[#009dd9]/5 hover:text-[#009dd9]'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Đăng xuất" : undefined}
            className={`flex items-center ${sidebarOpen ? 'gap-3 px-3 justify-start' : 'justify-center px-0'} w-full py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition cursor-pointer`}
          >
            <div className="shrink-0"><LogOut className="w-5 h-5" /></div>
            {sidebarOpen && <span className="truncate">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted transition cursor-pointer shrink-0"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex min-w-0 flex-col justify-center">
              <div className="flex items-center gap-2 min-w-0 text-sm text-muted-foreground">
                <span className="truncate">{APP_BREADCRUMB}</span>
                <span className="shrink-0">/</span>
                <span className="truncate text-foreground font-medium">{tabMeta.title}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-muted transition cursor-pointer">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-muted transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#009dd9] flex items-center justify-center text-white text-sm">
                  {user.hoTen.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm">{user.hoTen}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-border z-50 py-2">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm">{user.hoTen}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      to="/doi-mat-khau"
                      onClick={() => setProfileOpen(false)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-muted transition cursor-pointer"
                    >
                      Đổi mật khẩu
                    </Link>
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Outlet render page component của route hiện tại */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
