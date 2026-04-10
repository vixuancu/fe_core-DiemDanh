import { createBrowserRouter, Navigate } from 'react-router';

// Layout & Guards
import { AppShell } from './layouts/AppShell';
import { AuthGuard } from '@/features/auth/guards/AuthGuard';
import { RoleGuard } from '@/features/auth/guards/RoleGuard';

// Auth pages
import { LoginPage } from '@/app/components/login-page';

// Pages (import từ components cũ — sẽ dần migrate theo từng phase)
import { DashboardPage } from '@/app/components/dashboard-page';
import { SinhVienPage } from '@/app/components/sinh-vien-page';
import { LopHanhChinhPage } from '@/app/components/lop-hanh-chinh-page';
import { LopTinChiPage } from '@/app/components/lop-tin-chi-page';
import { LopTinChiSinhVienPage } from '@/app/components/lop-tin-chi-sinh-vien-page';
import { HocPhanPage } from '@/app/components/hoc-phan-page';
import { PhongHocPage } from '@/app/components/phong-hoc-page';
import { LichHocPage } from '@/app/components/lich-hoc-page';
import { LichHocDieuChinhPage } from '@/app/components/lich-hoc-dieu-chinh-page';
import { DiemDanhPage } from '@/app/components/diem-danh-page';
import { KetQuaDiemDanhPage } from '@/app/components/ket-qua-diem-danh-page';
import { LichSuPage } from '@/app/components/lich-su-page';
import { BaoCaoPage } from '@/app/components/bao-cao-page';
import { CameraPage } from '@/app/components/camera-page';
import { TaiKhoanPage } from '@/app/components/tai-khoan-page';
import { DoiMatKhauPage } from '@/app/components/doi-mat-khau-page';
import { DiemDanhAiDemoPage } from '@/app/components/diem-danh-ai-demo-page';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/diem-danh-ai-demo',
    element: <DiemDanhAiDemoPage />,
  },

  // Protected routes — cần đăng nhập
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          // Redirect / → /dashboard
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // ── Tất cả role ─────────────────────────────────────────────────
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'lich-hoc', element: <LichHocPage /> },
          { path: 'lich-su', element: <LichSuPage /> },
          { path: 'doi-mat-khau', element: <DoiMatKhauPage /> },

          // ── Admin + Giáo vụ ──────────────────────────────────────────────
          {
            element: <RoleGuard allowedRoles={['admin', 'giao_vu']} />,
            children: [
              { path: 'sinh-vien', element: <SinhVienPage /> },
              { path: 'hoc-phan', element: <HocPhanPage /> },
              { path: 'lop-hanh-chinh', element: <LopHanhChinhPage /> },
              { path: 'lop-tin-chi', element: <LopTinChiPage /> },
              { path: 'lop-tin-chi/:lopTinChiId/sinh-vien', element: <LopTinChiSinhVienPage /> },
              { path: 'phong-hoc', element: <PhongHocPage /> },
              { path: 'dieu-chinh', element: <LichHocDieuChinhPage /> },
              { path: 'diem-danh', element: <DiemDanhPage /> },
              { path: 'bao-cao', element: <BaoCaoPage /> },
            ],
          },

          // ── Chỉ Giảng viên ───────────────────────────────────────────────
          {
            element: <RoleGuard allowedRoles={['giang_vien']} />,
            children: [
              { path: 'ket-qua-diem-danh', element: <KetQuaDiemDanhPage /> },
            ],
          },

          // ── Chỉ Admin ────────────────────────────────────────────────────
          {
            element: <RoleGuard allowedRoles={['admin']} />,
            children: [
              { path: 'camera', element: <CameraPage /> },
              { path: 'tai-khoan', element: <TaiKhoanPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback — redirect về dashboard
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
