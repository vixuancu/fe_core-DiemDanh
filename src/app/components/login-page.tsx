import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ScanFace, Eye, EyeOff } from 'lucide-react';
import { config } from '@/shared/config/env';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setIsLoading(true);
    const ok = await login(email, password);
    setIsLoading(false);
    if (!ok) {
      setError('Thông tin đăng nhập không chính xác');
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const quickLogin = async (loginEmail: string) => {
    const ok = await login(loginEmail, '123');
    if (!ok) {
      setError('Đăng nhập nhanh thất bại trong chế độ API');
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#009dd9]/10 via-white to-[#009dd9]/5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#009dd9] mb-4">
              <ScanFace className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-[#009dd9]">Hệ thống điểm danh</h1>
            <p className="text-muted-foreground mt-1">Nhận dạng khuôn mặt</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm">Email / Tên đăng nhập</label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] transition"
                placeholder="Nhập email hoặc tên đăng nhập"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-sm">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] transition pr-11"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-[#009dd9] focus:ring-[#009dd9]"
                />
                <span className="font-normal text-muted-foreground">Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" className="text-sm text-[#009dd9] hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {config.dataSource === 'mock' && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-center text-muted-foreground mb-3">Đăng nhập nhanh (Demo)</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Quản trị viên', email: 'admin@edu.vn' },
                  { label: 'Giáo vụ', email: 'giaovu@edu.vn' },
                  { label: 'Giảng viên', email: 'trinh.dd@edu.vn' },
                ].map((item) => (
                  <button
                    key={item.email}
                    type="button"
                    onClick={() => quickLogin(item.email)}
                    className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-[#009dd9]/5 hover:border-[#009dd9]/30 transition cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
