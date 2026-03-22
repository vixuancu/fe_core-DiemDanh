import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authService } from '@/features/auth/services';
import { ScanFace, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { config } from '@/shared/config/env';
import { notify } from '@/shared/lib/notify';

type ViewState = 'login' | 'forgot_email' | 'forgot_otp';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const maskedEmail = forgotEmail
    ? forgotEmail.replace(/(.{3})(.*)(?=@)/, '$1***')
    : '';

  const resetForgotState = () => {
    setForgotEmail('');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const backToLogin = () => {
    resetForgotState();
    setView('login');
    setError('');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const nextOtp = [...otp];
      pasted.forEach((char, i) => {
        if (index + i < 6) nextOtp[index + i] = char;
      });
      setOtp(nextOtp);
      const nextIndex = Math.min(5, index + pasted.length);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      const nextOtp = [...otp];
      nextOtp[index - 1] = '';
      setOtp(nextOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Vui lòng nhập email');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authService.requestPasswordReset(forgotEmail.trim());
      notify.success('Đã xác nhận email. Vui lòng nhập mã OTP.');
      setView('forgot_otp');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi mã xác thực';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã xác thực');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authService.confirmPasswordReset({
        email: forgotEmail.trim(),
        otp: code,
        newPassword,
      });
      notify.success('Tạo mật khẩu mới thành công');
      backToLogin();
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Mã xác thực không đúng hoặc mật khẩu mới không hợp lệ';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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
          {view === 'login' && (
            <div className="animate-in fade-in duration-300">
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
                  <button
                    type="button"
                    className="text-sm text-[#009dd9] hover:underline"
                    onClick={() => {
                      setError('');
                      setForgotEmail(email.trim());
                      setView('forgot_email');
                    }}
                  >
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
          )}

          {view === 'forgot_email' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#009dd9]/10 mb-4">
                  <Lock className="w-8 h-8 text-[#009dd9]" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Quên mật khẩu?</h1>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  Vui lòng nhập email đăng ký. Chúng tôi sẽ gửi một mã xác thực (OTP) gồm 6 chữ số đến email này.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] transition"
                    placeholder="Nhập email của bạn"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? 'Đang xác thực...' : 'Gửi mã xác thực'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="inline-flex items-center justify-center gap-2 text-sm text-[#009dd9] hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại trang đăng nhập
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === 'forgot_otp' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-foreground">Tạo mật khẩu mới</h1>
                <div className="mt-3 text-sm text-muted-foreground">
                  Mã xác thực đã được gửi đến:
                  <div className="font-medium text-foreground mt-1">{maskedEmail}</div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm">Mã xác thực (OTP)</label>
                  <div className="flex gap-2 justify-between">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          handleOtpChange(index, e.target.value);
                          setError('');
                        }}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-[3.1rem] h-12 text-center text-lg rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] transition"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] transition pr-11"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 focus:border-[#009dd9] transition pr-11"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-[#009dd9] text-white hover:bg-[#0088be] transition cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? 'Đang xác nhận...' : 'Xác nhận'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setOtp(['', '', '', '', '', '']);
                      setView('forgot_email');
                    }}
                    className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                  >
                    Quay lại gửi mã
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
