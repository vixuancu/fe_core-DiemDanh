// Mock data for the attendance system

import { Classroom } from "@/features/classrooms/types";

export type UserRole = 'admin' | 'giao_vu' | 'giang_vien';

export interface User {
    id: string;
    hoTen: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export interface SinhVien {
    id: string;
    maSV: string;
    hoTen: string;
    lop: string;
    email: string;
    soDienThoai: string;
    soAnhKhuonMat: number;
}

export interface GiangVien {
    id: string;
    maGV: string;
    hoTen: string;
    email: string;
    soDienThoai: string;
    khoa: string;
    trangThai: 'active' | 'locked';
}

export interface PhongHoc {
    id: string;
    maPhong: string;
    tenPhong: string;
    toaNha: string;
    tang: number;
    sucChua: number;
    cameraId?: string;
}

// export interface Camera {
//     id: string;
//     tenCamera: string;
//     ipAddress: string;
//     phongHocId?: string;
//     tenPhong?: string;
//     trangThai: 'online' | 'offline' | 'error';
// }

export interface Camera {
    id: number;
    cameraName: string;
    ipAddress: string;
    cameraStatus: number;
    createdAt: string;
    updatedAt: string;
}

export interface LopTinChi {
    id: string;
    maLop: string;
    tenMonHoc: string;
    giangVienId: string;
    tenGiangVien: string;
    siSo: number;
    hocKy: string;
}

export interface LichHoc {
    id: string;
    lopTinChiId: string;
    tenMonHoc: string;
    maLop: string;
    tenGiangVien: string;
    phongHocId: string;
    tenPhong: string;
    ngayHoc: string;
    caHoc: 'Sáng' | 'Chiều' | 'Tối';
    tietBatDau: number;
    tietKetThuc: number;
    thu: number; // 2-8 (Mon-Sun)
}

export interface DiemDanh {
    id: string;
    sinhVienId: string;
    maSV: string;
    hoTenSV: string;
    lichHocId: string;
    tenMonHoc: string;
    maLop: string;
    ngay: string;
    thoiGian: string;
    trangThai: 'co_mat' | 'tre' | 'vang';
    ghiChu?: string;
}

export interface TaiKhoan {
    id: string;
    username: string;
    hoTen: string;
    email: string;
    gioiTinh: boolean | null;
    ngaySinh: string;
    role: UserRole;
    trangThai: 'active' | 'locked';
}

// Mock users
export const mockUsers: User[] = [
    { id: '1', hoTen: 'Nguyễn Văn Admin', email: 'admin@edu.vn', role: 'admin' },
    { id: '2', hoTen: 'Trần Thị Giáo Vụ', email: 'giaovu@edu.vn', role: 'giao_vu' },
    { id: '3', hoTen: 'Đỗ Duy Trình', email: 'trinh.dd@edu.vn', role: 'giang_vien' },
];

export const mockSinhVien: SinhVien[] = [
    { id: '1', maSV: '22A1001D0043', hoTen: 'Vi Xuân Cử', lop: 'K23-7E1062', email: 'cu.vx@edu.vn', soDienThoai: '0901234567', soAnhKhuonMat: 15 },
    { id: '2', maSV: '22A1001D0044', hoTen: 'Nguyễn Văn An', lop: 'K23-7E1062', email: 'an.nv@edu.vn', soDienThoai: '0901234568', soAnhKhuonMat: 20 },
    { id: '3', maSV: '22A1001D0045', hoTen: 'Trần Thị Bình', lop: 'K23-7E1062', email: 'binh.tt@edu.vn', soDienThoai: '0901234569', soAnhKhuonMat: 18 },
    { id: '4', maSV: '22A1001D0046', hoTen: 'Lê Hoàng Cường', lop: 'K23-7E1061', email: 'cuong.lh@edu.vn', soDienThoai: '0901234570', soAnhKhuonMat: 12 },
    { id: '5', maSV: '22A1001D0047', hoTen: 'Phạm Minh Đức', lop: 'K23-7E1061', email: 'duc.pm@edu.vn', soDienThoai: '0901234571', soAnhKhuonMat: 0 },
    { id: '6', maSV: '22A1001D0048', hoTen: 'Hoàng Thị Em', lop: 'K23-7E1061', email: 'em.ht@edu.vn', soDienThoai: '0901234572', soAnhKhuonMat: 20 },
    { id: '7', maSV: '22A1001D0049', hoTen: 'Ngô Văn Phúc', lop: 'K23-7E1062', email: 'phuc.nv@edu.vn', soDienThoai: '0901234573', soAnhKhuonMat: 10 },
    { id: '8', maSV: '22A1001D0050', hoTen: 'Đặng Thị Giang', lop: 'K23-7E1062', email: 'giang.dt@edu.vn', soDienThoai: '0901234574', soAnhKhuonMat: 16 },
];

export const mockGiangVien: GiangVien[] = [
    { id: '3', maGV: 'GV001', hoTen: 'Đỗ Duy Trình', email: 'trinh.dd@edu.vn', soDienThoai: '0912345678', khoa: 'Công nghệ thông tin', trangThai: 'active' },
    { id: '5', maGV: 'GV002', hoTen: 'Vũ Xuân Hạnh', email: 'hanh.vx@edu.vn', soDienThoai: '0912345679', khoa: 'Công nghệ thông tin', trangThai: 'active' },
    { id: '6', maGV: 'GV003', hoTen: 'Nguyễn Thị Lan', email: 'lan.nt@edu.vn', soDienThoai: '0912345680', khoa: 'Khoa học máy tính', trangThai: 'active' },
    { id: '7', maGV: 'GV004', hoTen: 'Trần Minh Quang', email: 'quang.tm@edu.vn', soDienThoai: '0912345681', khoa: 'Hệ thống thông tin', trangThai: 'locked' },
];

export const mockTaiKhoan: TaiKhoan[] = [
    { id: '2', username: 'giaovu01', hoTen: 'Trần Thị Giáo Vụ', email: 'giaovu@edu.vn', gioiTinh: false, ngaySinh: '1988-07-12', role: 'giao_vu', trangThai: 'active' },
    { id: '10', username: 'hungpv', hoTen: 'Phạm Văn Hùng', email: 'hung.pv@edu.vn', gioiTinh: true, ngaySinh: '1986-09-01', role: 'giao_vu', trangThai: 'active' },
    { id: '3', username: 'trinhdd', hoTen: 'Đỗ Duy Trình', email: 'trinh.dd@edu.vn', gioiTinh: true, ngaySinh: '1985-03-10', role: 'giang_vien', trangThai: 'active' },
    { id: '5', username: 'hanhvx', hoTen: 'Vũ Xuân Hạnh', email: 'hanh.vx@edu.vn', gioiTinh: false, ngaySinh: '1987-11-20', role: 'giang_vien', trangThai: 'active' },
    { id: '6', username: 'lannt', hoTen: 'Nguyễn Thị Lan', email: 'lan.nt@edu.vn', gioiTinh: false, ngaySinh: '1989-05-15', role: 'giang_vien', trangThai: 'active' },
    { id: '7', username: 'quangtm', hoTen: 'Trần Minh Quang', email: 'quang.tm@edu.vn', gioiTinh: true, ngaySinh: '1984-01-06', role: 'giang_vien', trangThai: 'locked' },
    { id: '11', username: 'sonlv', hoTen: 'Lê Văn Sơn', email: 'son.lv@edu.vn', gioiTinh: true, ngaySinh: '1990-04-18', role: 'giang_vien', trangThai: 'active' },
    { id: '12', username: 'yennh', hoTen: 'Nguyễn Hải Yến', email: 'yen.nh@edu.vn', gioiTinh: false, ngaySinh: '1991-02-25', role: 'giang_vien', trangThai: 'active' },
];

export const mockPhongHoc: PhongHoc[] = [
    { id: '1', maPhong: 'FIT.P11', tenPhong: 'KGĐ FITHOU-FIT.P11', toaNha: 'FITHOU', tang: 1, sucChua: 60, cameraId: '1' },
    { id: '2', maPhong: 'FIT.P23', tenPhong: 'KGĐ FITHOU-FIT.P23', toaNha: 'FITHOU', tang: 2, sucChua: 80, cameraId: '2' },
    { id: '3', maPhong: 'FIT.P31', tenPhong: 'KGĐ FITHOU-FIT.P31', toaNha: 'FITHOU', tang: 3, sucChua: 50 },
    { id: '4', maPhong: 'A.201', tenPhong: 'Nhà A - Phòng 201', toaNha: 'Nhà A', tang: 2, sucChua: 100, cameraId: '3' },
    { id: '5', maPhong: 'A.301', tenPhong: 'Nhà A - Phòng 301', toaNha: 'Nhà A', tang: 3, sucChua: 120 },
];

// export const mockCamera: Camera[] = [
//     { id: '1', tenCamera: 'Camera FIT.P11', ipAddress: '192.168.1.101', phongHocId: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', trangThai: 'online' },
//     { id: '2', tenCamera: 'Camera FIT.P23', ipAddress: '192.168.1.102', phongHocId: '2', tenPhong: 'KGĐ FITHOU-FIT.P23', trangThai: 'online' },
//     { id: '3', tenCamera: 'Camera A.201', ipAddress: '192.168.1.103', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', trangThai: 'offline' },
//     { id: '4', tenCamera: 'Camera A.301', ipAddress: '192.168.1.104', trangThai: 'error' },
//     { id: '5', tenCamera: 'Camera A.201', ipAddress: '192.168.1.103', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', trangThai: 'offline' },
//     { id: '6', tenCamera: 'Camera A.201', ipAddress: '192.168.1.103', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', trangThai: 'offline' },
//     { id: '7', tenCamera: 'Camera A.201', ipAddress: '192.168.1.103', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', trangThai: 'offline' },
// ];

export const mockLopTinChi: LopTinChi[] = [
    { id: '1', maLop: 'K23-7E1062.22-2.2526-1.1_LT', tenMonHoc: 'Khóa luận tốt nghiệp', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình', siSo: 35, hocKy: '2025-2026.2' },
    { id: '2', maLop: 'K23-7E1061.22-2.2526-3.3_LT', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', giangVienId: '5', tenGiangVien: 'Vũ Xuân Hạnh', siSo: 40, hocKy: '2025-2026.2' },
    { id: '3', maLop: 'K23-7E1062.22-2.2526-2.1_LT', tenMonHoc: 'Trí tuệ nhân tạo', giangVienId: '3', tenGiangVien: 'Đỗ Duy Trình', siSo: 45, hocKy: '2025-2026.2' },
    { id: '4', maLop: 'K23-7E1061.22-2.2526-4.2_LT', tenMonHoc: 'Lập trình web nâng cao', giangVienId: '6', tenGiangVien: 'Nguyễn Thị Lan', siSo: 50, hocKy: '2025-2026.2' },
];

export const mockLichHoc: LichHoc[] = [
    { id: '1', lopTinChiId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', ngayHoc: '09/03/2026', caHoc: 'Tối', tietBatDau: 9, tietKetThuc: 12, thu: 2 },
    { id: '2', lopTinChiId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', tenGiangVien: 'Vũ Xuân Hạnh', phongHocId: '2', tenPhong: 'KGĐ FITHOU-FIT.P23', ngayHoc: '10/03/2026', caHoc: 'Tối', tietBatDau: 9, tietKetThuc: 12, thu: 3 },
    { id: '3', lopTinChiId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', ngayHoc: '11/03/2026', caHoc: 'Sáng', tietBatDau: 1, tietKetThuc: 4, thu: 4 },
    { id: '4', lopTinChiId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', tenGiangVien: 'Nguyễn Thị Lan', phongHocId: '2', tenPhong: 'KGĐ FITHOU-FIT.P23', ngayHoc: '12/03/2026', caHoc: 'Sáng', tietBatDau: 1, tietKetThuc: 4, thu: 5 },
    { id: '5', lopTinChiId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', ngayHoc: '13/03/2026', caHoc: 'Tối', tietBatDau: 9, tietKetThuc: 12, thu: 6 },
    { id: '6', lopTinChiId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', tenGiangVien: 'Đỗ Duy Trình', phongHocId: '1', tenPhong: 'KGĐ FITHOU-FIT.P11', ngayHoc: '10/03/2026', caHoc: 'Chiều', tietBatDau: 5, tietKetThuc: 8, thu: 3 },
    { id: '7', lopTinChiId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', tenGiangVien: 'Nguyễn Thị Lan', phongHocId: '4', tenPhong: 'Nhà A - Phòng 201', ngayHoc: '10/03/2026', caHoc: 'Chiều', tietBatDau: 5, tietKetThuc: 8, thu: 3 },
];

export const mockDiemDanh: DiemDanh[] = [
    // === KHÓA LUẬN TỐT NGHIỆP — 6 SV × 6 ngày ===
    // Ngày 09/03/2026
    { id: '1', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '09/03/2026', thoiGian: '18:05:23', trangThai: 'co_mat', ghiChu: '' },
    { id: '2', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '09/03/2026', thoiGian: '18:02:15', trangThai: 'co_mat', ghiChu: '' },
    { id: '3', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '09/03/2026', thoiGian: '18:20:45', trangThai: 'tre', ghiChu: 'Kẹt xe' },
    { id: '4', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '09/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Xin phép nghỉ' },
    { id: '5', sinhVienId: '5', maSV: '22A1001D0047', hoTenSV: 'Phạm Minh Đức', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '09/03/2026', thoiGian: '18:01:10', trangThai: 'co_mat', ghiChu: '' },
    { id: '6', sinhVienId: '6', maSV: '22A1001D0048', hoTenSV: 'Hoàng Thị Em', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '09/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: '' },
    // Ngày 13/03/2026
    { id: '13', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '5', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '13/03/2026', thoiGian: '18:03:10', trangThai: 'co_mat', ghiChu: '' },
    { id: '14', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '5', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '13/03/2026', thoiGian: '18:18:40', trangThai: 'tre', ghiChu: 'Do mưa lớn' },
    { id: '15', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '5', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '13/03/2026', thoiGian: '18:01:05', trangThai: 'co_mat', ghiChu: '' },
    { id: '16', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '5', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '13/03/2026', thoiGian: '18:04:30', trangThai: 'co_mat', ghiChu: '' },
    { id: '17', sinhVienId: '5', maSV: '22A1001D0047', hoTenSV: 'Phạm Minh Đức', lichHocId: '5', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '13/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Bị ốm' },
    { id: '18', sinhVienId: '6', maSV: '22A1001D0048', hoTenSV: 'Hoàng Thị Em', lichHocId: '5', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '13/03/2026', thoiGian: '18:02:00', trangThai: 'co_mat', ghiChu: '' },
    // Ngày 16/03/2026
    { id: '19', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '16/03/2026', thoiGian: '18:00:50', trangThai: 'co_mat', ghiChu: '' },
    { id: '20', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '16/03/2026', thoiGian: '18:01:30', trangThai: 'co_mat', ghiChu: '' },
    { id: '21', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '16/03/2026', thoiGian: '18:03:20', trangThai: 'co_mat', ghiChu: '' },
    { id: '22', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '16/03/2026', thoiGian: '18:22:00', trangThai: 'tre', ghiChu: 'Xe hỏng giữa đường' },
    { id: '23', sinhVienId: '5', maSV: '22A1001D0047', hoTenSV: 'Phạm Minh Đức', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '16/03/2026', thoiGian: '18:02:45', trangThai: 'co_mat', ghiChu: '' },
    { id: '24', sinhVienId: '6', maSV: '22A1001D0048', hoTenSV: 'Hoàng Thị Em', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '16/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Không phép' },
    // Ngày 20/03/2026
    { id: '25', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '20/03/2026', thoiGian: '18:15:00', trangThai: 'tre', ghiChu: 'Tắc đường' },
    { id: '26', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '20/03/2026', thoiGian: '18:00:30', trangThai: 'co_mat', ghiChu: '' },
    { id: '27', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '20/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Xin phép nghỉ ốm' },
    { id: '28', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '20/03/2026', thoiGian: '18:02:10', trangThai: 'co_mat', ghiChu: '' },
    { id: '29', sinhVienId: '5', maSV: '22A1001D0047', hoTenSV: 'Phạm Minh Đức', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '20/03/2026', thoiGian: '18:01:55', trangThai: 'co_mat', ghiChu: '' },
    { id: '30', sinhVienId: '6', maSV: '22A1001D0048', hoTenSV: 'Hoàng Thị Em', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '20/03/2026', thoiGian: '18:03:15', trangThai: 'co_mat', ghiChu: '' },
    // Ngày 23/03/2026
    { id: '31', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '23/03/2026', thoiGian: '18:02:40', trangThai: 'co_mat', ghiChu: '' },
    { id: '32', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '23/03/2026', thoiGian: '18:01:00', trangThai: 'co_mat', ghiChu: '' },
    { id: '33', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '23/03/2026', thoiGian: '18:04:00', trangThai: 'co_mat', ghiChu: '' },
    { id: '34', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '23/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Việc gia đình' },
    { id: '35', sinhVienId: '5', maSV: '22A1001D0047', hoTenSV: 'Phạm Minh Đức', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '23/03/2026', thoiGian: '18:20:10', trangThai: 'tre', ghiChu: 'Đến muộn' },
    { id: '36', sinhVienId: '6', maSV: '22A1001D0048', hoTenSV: 'Hoàng Thị Em', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '23/03/2026', thoiGian: '18:01:30', trangThai: 'co_mat', ghiChu: '' },
    // Ngày 27/03/2026
    { id: '37', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '27/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Nghỉ phép' },
    { id: '38', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '27/03/2026', thoiGian: '18:02:20', trangThai: 'co_mat', ghiChu: '' },
    { id: '39', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '27/03/2026', thoiGian: '18:16:50', trangThai: 'tre', ghiChu: 'Kẹt xe' },
    { id: '40', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '27/03/2026', thoiGian: '18:01:15', trangThai: 'co_mat', ghiChu: '' },
    { id: '41', sinhVienId: '5', maSV: '22A1001D0047', hoTenSV: 'Phạm Minh Đức', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '27/03/2026', thoiGian: '18:03:30', trangThai: 'co_mat', ghiChu: '' },
    { id: '42', sinhVienId: '6', maSV: '22A1001D0048', hoTenSV: 'Hoàng Thị Em', lichHocId: '1', tenMonHoc: 'Khóa luận tốt nghiệp', maLop: 'K23-7E1062.22-2.2526-1.1_LT', ngay: '27/03/2026', thoiGian: '18:00:45', trangThai: 'co_mat', ghiChu: '' },

    // === TRÍ TUỆ NHÂN TẠO — 3 SV × 5 ngày ===
    // Ngày 11/03/2026
    { id: '9', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '11/03/2026', thoiGian: '07:05:10', trangThai: 'co_mat', ghiChu: '' },
    { id: '10', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '11/03/2026', thoiGian: '07:02:05', trangThai: 'co_mat', ghiChu: '' },
    { id: '11', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '11/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Ốm' },
    // Ngày 18/03/2026
    { id: '43', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '6', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '18/03/2026', thoiGian: '07:01:20', trangThai: 'co_mat', ghiChu: '' },
    { id: '44', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '6', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '18/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Xin phép nghỉ' },
    { id: '45', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '6', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '18/03/2026', thoiGian: '07:15:30', trangThai: 'tre', ghiChu: 'Ngủ quên' },
    // Ngày 25/03/2026
    { id: '46', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '25/03/2026', thoiGian: '07:03:00', trangThai: 'co_mat', ghiChu: '' },
    { id: '47', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '25/03/2026', thoiGian: '07:04:15', trangThai: 'co_mat', ghiChu: '' },
    { id: '48', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '25/03/2026', thoiGian: '07:02:40', trangThai: 'co_mat', ghiChu: '' },
    // Ngày 01/04/2026
    { id: '49', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '01/04/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Lý do cá nhân' },
    { id: '50', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '01/04/2026', thoiGian: '07:18:00', trangThai: 'tre', ghiChu: 'Xe hỏng' },
    { id: '51', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '01/04/2026', thoiGian: '07:01:50', trangThai: 'co_mat', ghiChu: '' },
    // Ngày 08/04/2026
    { id: '52', sinhVienId: '1', maSV: '22A1001D0043', hoTenSV: 'Vi Xuân Cử', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '08/04/2026', thoiGian: '07:02:30', trangThai: 'co_mat', ghiChu: '' },
    { id: '53', sinhVienId: '2', maSV: '22A1001D0044', hoTenSV: 'Nguyễn Văn An', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '08/04/2026', thoiGian: '07:01:10', trangThai: 'co_mat', ghiChu: '' },
    { id: '54', sinhVienId: '3', maSV: '22A1001D0045', hoTenSV: 'Trần Thị Bình', lichHocId: '3', tenMonHoc: 'Trí tuệ nhân tạo', maLop: 'K23-7E1062.22-2.2526-2.1_LT', ngay: '08/04/2026', thoiGian: '07:03:45', trangThai: 'co_mat', ghiChu: '' },

    // === CHUYÊN ĐỀ THỰC TẬP — 2 SV × 4 ngày ===
    // Ngày 10/03/2026
    { id: '7', sinhVienId: '7', maSV: '22A1001D0049', hoTenSV: 'Ngô Văn Phúc', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '10/03/2026', thoiGian: '18:05:30', trangThai: 'co_mat', ghiChu: '' },
    { id: '8', sinhVienId: '8', maSV: '22A1001D0050', hoTenSV: 'Đặng Thị Giang', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '10/03/2026', thoiGian: '18:15:22', trangThai: 'tre', ghiChu: 'Kẹt xe' },
    // Ngày 17/03/2026
    { id: '55', sinhVienId: '7', maSV: '22A1001D0049', hoTenSV: 'Ngô Văn Phúc', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '17/03/2026', thoiGian: '18:02:10', trangThai: 'co_mat', ghiChu: '' },
    { id: '56', sinhVienId: '8', maSV: '22A1001D0050', hoTenSV: 'Đặng Thị Giang', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '17/03/2026', thoiGian: '18:01:45', trangThai: 'co_mat', ghiChu: '' },
    // Ngày 24/03/2026
    { id: '57', sinhVienId: '7', maSV: '22A1001D0049', hoTenSV: 'Ngô Văn Phúc', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '24/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Nghỉ phép' },
    { id: '58', sinhVienId: '8', maSV: '22A1001D0050', hoTenSV: 'Đặng Thị Giang', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '24/03/2026', thoiGian: '18:03:00', trangThai: 'co_mat', ghiChu: '' },
    // Ngày 31/03/2026
    { id: '59', sinhVienId: '7', maSV: '22A1001D0049', hoTenSV: 'Ngô Văn Phúc', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '31/03/2026', thoiGian: '18:04:30', trangThai: 'co_mat', ghiChu: '' },
    { id: '60', sinhVienId: '8', maSV: '22A1001D0050', hoTenSV: 'Đặng Thị Giang', lichHocId: '2', tenMonHoc: 'Chuyên đề thực tập chuyên ngành', maLop: 'K23-7E1061.22-2.2526-3.3_LT', ngay: '31/03/2026', thoiGian: '18:20:15', trangThai: 'tre', ghiChu: 'Mưa to' },

    // === LẬP TRÌNH WEB NÂNG CAO — 1 SV × 4 ngày ===
    { id: '12', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', ngay: '12/03/2026', thoiGian: '07:10:30', trangThai: 'tre', ghiChu: 'Kẹt xe' },
    { id: '61', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', ngay: '19/03/2026', thoiGian: '07:02:00', trangThai: 'co_mat', ghiChu: '' },
    { id: '62', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', ngay: '26/03/2026', thoiGian: '', trangThai: 'vang', ghiChu: 'Xin nghỉ' },
    { id: '63', sinhVienId: '4', maSV: '22A1001D0046', hoTenSV: 'Lê Hoàng Cường', lichHocId: '4', tenMonHoc: 'Lập trình web nâng cao', maLop: 'K23-7E1061.22-2.2526-4.2_LT', ngay: '02/04/2026', thoiGian: '07:01:15', trangThai: 'co_mat', ghiChu: '' },
];

export const roleLabels: Record<UserRole, string> = {
    admin: 'Quản trị viên',
    giao_vu: 'Giáo vụ',
    giang_vien: 'Giảng viên',
};

export const trangThaiLabels: Record<string, string> = {
    co_mat: 'Có mặt',
    tre: 'Đi trễ',
    vang: 'Vắng',
};

export const trangThaiColors: Record<string, string> = {
    co_mat: 'bg-green-100 text-green-700',
    tre: 'bg-yellow-100 text-yellow-700',
    vang: 'bg-red-100 text-red-700',
};

export const thuLabels: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ nhật',
};


export const mockCamera: Camera[] = [
    {
        id: 1,
        cameraName: 'Camera FIT.P11',
        ipAddress: '192.168.1.101',
        cameraStatus: 1,
        createdAt: '2026-03-01T08:00:00Z',
        updatedAt: '2026-03-15T10:30:00Z'
    },
    {
        id: 2,
        cameraName: 'Camera FIT.P12',
        ipAddress: '192.168.1.102',
        cameraStatus: 1,
        createdAt: '2026-03-02T09:15:00Z',
        updatedAt: '2026-03-20T14:20:00Z'
    },
    {
        id: 3,
        cameraName: 'Camera FIT.P13',
        ipAddress: '192.168.1.103',
        cameraStatus: 0,
        createdAt: '2026-03-05T07:45:00Z',
        updatedAt: '2026-03-05T07:45:00Z'
    },
    {
        id: 4,
        cameraName: 'Camera FIT.P14',
        ipAddress: '192.168.1.104',
        cameraStatus: 1,
        createdAt: '2026-03-10T11:00:00Z',
        updatedAt: '2026-03-10T11:00:00Z'
    },
    {
        id: 5,
        cameraName: 'Camera FIT.P15',
        ipAddress: '192.168.1.105',
        cameraStatus: 1,
        createdAt: '2026-03-12T15:30:00Z',
        updatedAt: '2026-03-21T08:00:00Z'
    },
    {
        id: 6,
        cameraName: 'Camera FIT.P16',
        ipAddress: '192.168.1.200',
        cameraStatus: 0,
        createdAt: '2026-03-15T13:20:00Z',
        updatedAt: '2026-03-15T13:20:00Z'
    },
    {
        id: 7,
        cameraName: 'Camera FIT.P21',
        ipAddress: '192.168.1.201',
        cameraStatus: 1,
        createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
    }
];

export const mockClassroom: Classroom[] = [
    {
        id: 1, className: 'Phòng P1.1', createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
    },
    {
        id: 2, className: 'Phòng P1.2', createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
    },
    {
        id: 3, className: 'Phòng P1.3', createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
    },
    {
        id: 4, className: 'Phòng P1.4', createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
    },
    {
        id: 5, className: 'Phòng P2.1', createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
    },
];
