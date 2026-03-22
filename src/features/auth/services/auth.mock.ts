import type { IAuthService, LoginCredentials, User } from '../types';
import { clearAccessToken } from '../session';

// Mock users — giữ nguyên data từ data.ts cũ
const MOCK_USERS: User[] = [
  { id: '1', hoTen: 'Nguyễn Văn Admin', email: 'admin@edu.vn', role: 'admin' },
  { id: '2', hoTen: 'Trần Thị Giáo Vụ', email: 'giaovu@edu.vn', role: 'giao_vu' },
  { id: '3', hoTen: 'Đỗ Duy Trình', email: 'trinh.dd@edu.vn', role: 'giang_vien' },
];

// Session in-memory (dùng cho mock)
let _currentUser: User | null = null;

export const authMock: IAuthService = {
  async login({ username }) {
    await delay(300);
    const input = username.trim().toLowerCase();
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === input || u.email.split('@')[0] === input,
    );
    // Fallback: nếu nhập email bất kỳ vẫn login thành công (demo mode)
    const user = found ?? MOCK_USERS[1];
    _currentUser = user;
    // Lưu vào sessionStorage để giữ state khi F5
    sessionStorage.setItem('mock_user', JSON.stringify(user));
    return user;
  },

  async logout() {
    await delay(100);
    _currentUser = null;
    sessionStorage.removeItem('mock_user');
    clearAccessToken();
  },

  async getCurrentUser() {
    if (_currentUser) return _currentUser;
    const stored = sessionStorage.getItem('mock_user');
    if (stored) {
      _currentUser = JSON.parse(stored);
      return _currentUser;
    }
    return null;
  },

  async changePassword(_oldPassword, _newPassword) {
    await delay(400);
    // Mock: luôn thành công
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
