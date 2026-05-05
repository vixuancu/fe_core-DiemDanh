import { useAuth } from "@/features/auth/context/AuthContext";
import { roleLabels, type UserRole } from "@/shared/types";
import {
  BarChart3,
  Bell,
  BookCopy,
  Building2,
  CalendarClock,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  DoorOpen,
  FolderKanban,
  Gauge,
  History,
  Layers3,
  LogOut,
  Menu,
  Presentation,
  ScanFace,
  School,
  Users,
  Video,
  UserCog,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

// ─── Nav config ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  children: NavItem[];
}

interface TabMeta {
  title: string;
  description?: string;
}

const NAV_OVERVIEW: NavItem = {
  label: "Tổng quan",
  path: "/dashboard",
  icon: null,
  roles: ["admin", "giao_vu", "giang_vien"],
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Quản lý phòng học và camera",
    icon: null,
    // icon: <Building2 className="w-5 h-5" />,
    children: [
      {
        label: "Phòng học",
        path: "/phong-hoc",
        icon: <DoorOpen className="w-4 h-4" />,
        roles: ["admin", "giao_vu"],
      },
      {
        label: "Camera",
        path: "/camera",
        icon: <Video className="w-4 h-4" />,
        roles: ["admin"],
      },
    ],
  },
  {
    label: "Quản lý lớp học",
    icon: null,
    // icon: <Layers3 className="w-5 h-5" />,
    children: [
      {
        label: "Lớp hành chính",
        path: "/lop-hanh-chinh",
        icon: <School className="w-4 h-4" />,
        roles: ["admin", "giao_vu"],
      },
      {
        label: "Học phần",
        path: "/hoc-phan",
        icon: <BookCopy className="w-4 h-4" />,
        roles: ["admin"],
      },
      {
        label: "Lớp tín chỉ",
        path: "/lop-tin-chi",
        icon: <Presentation className="w-4 h-4" />,
        roles: ["admin", "giao_vu"],
      },
    ],
  },
  {
    label: "Quản lý lịch học",
    icon: null,
    // icon: <CalendarClock className="w-5 h-5" />,
    children: [
      {
        label: "Lịch học",
        path: "/lich-hoc",
        icon: <CalendarDays className="w-4 h-4" />,
        roles: ["admin", "giao_vu", "giang_vien"],
      },
      {
        label: "Điều chỉnh lịch học",
        path: "/dieu-chinh",
        icon: <CalendarClock className="w-4 h-4" />,
        roles: ["admin", "giao_vu"],
      },
    ],
  },
  {
    label: "Quản lý điểm danh",
    icon: null,
    // icon: <ClipboardCheck className="w-5 h-5" />,
    children: [
      {
        label: "Điểm danh",
        path: "/diem-danh",
        icon: <ScanFace className="w-4 h-4" />,
        roles: ["admin", "giao_vu", "giang_vien"],
      },
      {
        label: "Lịch sử điểm danh",
        path: "/lich-su",
        icon: <History className="w-4 h-4" />,
        roles: ["admin", "giao_vu", "giang_vien"],
      },
    ],
  },
  {
    label: "Quản lý hệ thống",
    icon: null,
    // icon: <FolderKanban className="w-5 h-5" />,
    children: [
      {
        label: "Quản lý tài khoản",
        path: "/tai-khoan",
        icon: <UserCog className="w-4 h-4" />,
        roles: ["admin"],
      },
      {
        label: "Quản lý sinh viên",
        path: "/sinh-vien",
        icon: <Users className="w-4 h-4" />,
        roles: ["admin", "giao_vu"],
      },
      {
        label: "Thu thập video SV",
        path: "/thu-thap-video-sinh-vien",
        icon: <Video className="w-4 h-4" />,
        roles: ["admin", "giao_vu"],
      },
      {
        label: "Báo cáo thống kê",
        path: "/bao-cao",
        icon: <BarChart3 className="w-4 h-4" />,
        roles: ["admin", "giao_vu"],
      },
      {
        label: "Kết quả điểm danh",
        path: "/ket-qua-diem-danh",
        icon: <ClipboardCheck className="w-4 h-4" />,
        roles: ["admin", "giao_vu", "giang_vien"],
      },
    ],
  },
];

const TAB_META: Record<string, TabMeta> = {
  "/dashboard": {
    title: "Tổng quan",
  },
  "/sinh-vien": {
    title: "Quản lý sinh viên",
  },
  "/lop-hanh-chinh": {
    title: "Lớp hành chính",
  },
  "/lop-tin-chi": {
    title: "Lớp tín chỉ",
  },
  "/lop-tin-chi/:lopTinChiId/sinh-vien": {
    title: "Danh sách sinh viên",
  },
  "/phong-hoc": {
    title: "Phòng học",
  },
  "/lich-hoc": {
    title: "Lịch dạy",
  },
  "/dieu-chinh": {
    title: "Điều chỉnh lịch học",
  },
  "/diem-danh": {
    title: "Điểm danh",
  },
  "/thu-thap-video-sinh-vien": {
    title: "Thu thập video sinh viên",
  },
  "/ket-qua-diem-danh": {
    title: "Kết quả điểm danh",
  },
  "/lich-su": {
    title: "Lịch sử điểm danh",
  },
  "/bao-cao": {
    title: "Báo cáo thống kê",
  },
  "/camera": {
    title: "Quản lý camera",
  },
  "/tai-khoan": {
    title: "Quản lý tài khoản",
  },
  "/doi-mat-khau": {
    title: "Đổi mật khẩu",
  },
};

const APP_BREADCRUMB = "Hệ thống điểm danh";

function getTabMeta(pathname: string): TabMeta {
  if (/^\/lop-tin-chi\/[^/]+\/sinh-vien$/.test(pathname)) {
    return { title: "Chi tiết danh sách sinh viên" };
  }

  const exact = TAB_META[pathname];
  if (exact) return exact;

  const matchedPath = Object.keys(TAB_META).find((path) =>
    pathname.startsWith(path),
  );
  return matchedPath ? TAB_META[matchedPath] : { title: "Trang hiện tại" };
}

function getBestMatchedPath(paths: string[], pathname: string): string | null {
  const matched = paths
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length);
  return matched[0] ?? null;
}

// ─── AppShell ───────────────────────────────────────────────────────────────

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  if (!user) return null;

  const canViewOverview = NAV_OVERVIEW.roles.includes(user.role);
  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    children: group.children.filter((item) => item.roles.includes(user.role)),
  })).filter((group) => group.children.length > 0);
  const flatNavItems = filteredGroups.flatMap((group) => group.children);
  const tabMeta = getTabMeta(location.pathname);
  const isCreditClassStudentDetail = /^\/lop-tin-chi\/[^/]+\/sinh-vien$/.test(
    location.pathname,
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  return (
    <div className="min-h-screen flex bg-[#f0f4f8]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-border flex flex-col transition-all duration-300 shrink-0 z-20`}
      >
        <div
          className={`h-16 flex items-center ${sidebarOpen ? "gap-3 px-5" : "justify-center px-0"} border-b border-border shrink-0 transition-padding duration-300`}
        >
          <div className="w-9 h-9 rounded-lg bg-[#009dd9] flex items-center justify-center shrink-0">
            <ScanFace className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm text-[#009dd9] font-medium truncate">
                Hệ thống điểm danh
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Nhận dạng khuôn mặt
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
          {canViewOverview && (
            <Link
              to={NAV_OVERVIEW.path}
              title={!sidebarOpen ? NAV_OVERVIEW.label : undefined}
              className={`flex items-center ${sidebarOpen ? "gap-3 px-3 justify-start" : "justify-center px-0"} py-2.5 rounded-lg transition-colors text-sm w-full ${
                location.pathname === NAV_OVERVIEW.path
                  ? "bg-[#009dd9] text-white"
                  : "text-foreground hover:bg-[#009dd9]/5 hover:text-[#009dd9]"
              }`}
            >
              <div className="shrink-0">{NAV_OVERVIEW.icon}</div>
              {sidebarOpen && (
                <span className="truncate">{NAV_OVERVIEW.label}</span>
              )}
            </Link>
          )}

          {!sidebarOpen &&
            flatNavItems.map((item) => (
              <Link
                key={`${item.path}-${item.label}`}
                to={item.path}
                title={item.label}
                className={`flex items-center justify-center px-0 py-2.5 rounded-lg transition-colors text-sm w-full ${
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`)
                    ? "bg-[#009dd9] text-white"
                    : "text-foreground hover:bg-[#009dd9]/5 hover:text-[#009dd9]"
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
              </Link>
            ))}

          {sidebarOpen &&
            filteredGroups.map((group) => {
              const groupActivePath = getBestMatchedPath(
                group.children.map((item) => item.path),
                location.pathname,
              );
              const isGroupActive = Boolean(groupActivePath);
              const isExpanded = Boolean(expandedGroups[group.label]);
              return (
                <div key={group.label} className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    title={group.label}
                    className={`w-full flex items-center ${group.icon ? "gap-2" : "gap-1"} px-3 py-2 rounded-lg text-xs uppercase tracking-wide font-semibold cursor-pointer ${
                      isGroupActive
                        ? "text-[#009dd9] bg-[#009dd9]/5"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {group.icon ? (
                      <div className="shrink-0">{group.icon}</div>
                    ) : null}
                    <span className="flex-1 text-left leading-4 whitespace-normal break-words">
                      {group.label}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-3 border-l border-border pl-2 space-y-1">
                      {group.children.map((item) => {
                        const isActive = groupActivePath === item.path;
                        return (
                          <Link
                            key={`${group.label}-${item.path}-${item.label}`}
                            to={item.path}
                            className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-sm ${
                              isActive
                                ? "bg-[#009dd9] text-white"
                                : "text-foreground hover:bg-[#009dd9]/5 hover:text-[#009dd9]"
                            }`}
                          >
                            <div className="shrink-0">{item.icon}</div>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Đăng xuất" : undefined}
            className={`flex items-center ${sidebarOpen ? "gap-3 px-3 justify-start" : "justify-center px-0"} w-full py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition cursor-pointer`}
          >
            <div className="shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
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
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div className="hidden md:flex min-w-0 flex-col justify-center">
              <div className="flex items-center gap-2 min-w-0 text-sm text-muted-foreground">
                {isCreditClassStudentDetail ? (
                  <>
                    <span className="truncate">{APP_BREADCRUMB}</span>
                    <span className="shrink-0">/</span>
                    <span className="truncate">Lớp tín chỉ</span>
                    <span className="shrink-0">/</span>
                    <span className="truncate text-foreground font-medium">
                      {tabMeta.title}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{APP_BREADCRUMB}</span>
                    <span className="shrink-0">/</span>
                    <span className="truncate text-foreground font-medium">
                      {tabMeta.title}
                    </span>
                  </>
                )}
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
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[user.role]}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-border z-50 py-2">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm">{user.hoTen}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      to="/doi-mat-khau"
                      onClick={() => setProfileOpen(false)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-muted transition cursor-pointer"
                    >
                      Đổi mật khẩu
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
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
