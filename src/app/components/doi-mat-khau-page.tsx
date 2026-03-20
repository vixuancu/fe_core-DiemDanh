import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { authService } from '@/features/auth/services';

export function DoiMatKhauPage() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!oldPass || !newPass || !confirmPass) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPass.length < 6) {
      setError('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }

    if (newPass !== confirmPass) {
      setError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword(oldPass, newPass);
      setSuccess('Đổi mật khẩu thành công');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đổi mật khẩu thất bại';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="mb-6">Đổi mật khẩu</h2>

      <div className="bg-white rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-[#009dd9]/5 border border-[#009dd9]/20">
          <KeyRound className="w-5 h-5 text-[#009dd9]" />
          <p className="text-sm text-[#009dd9]">Vui lòng nhập mật khẩu cũ và mật khẩu mới để thay đổi.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Mật khẩu cũ</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 pr-10"
                placeholder="Nhập mật khẩu cũ"
              />
              <button onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 pr-10"
                placeholder="Nhập mật khẩu mới"
              />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-[#009dd9]/30 pr-10"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={resetForm}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted cursor-pointer"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-[#009dd9] text-white text-sm hover:bg-[#0088be] cursor-pointer disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
}
