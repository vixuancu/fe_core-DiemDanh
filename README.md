# 🎓 Giao diện Điểm danh Sinh viên (Face Recognition Attendance)

Dự án này là hệ thống Frontend (viết bằng **React.js + Vite** và **TailwindCSS**) phục vụ cho nghiệp vụ quản lý sinh viên và điểm danh nhận diện khuôn mặt. 

Dự án được xây dựng dựa trên nguyên lý **Feature-Sliced Design (FSD)** - chia nhỏ chức năng theo từng cấu phần độc lập giúp mã nguồn cực dễ đọc, dễ bảo trì và mở rộng.

---

## 📂 1. Cấu trúc Dự án (Luồng Hoạt động)

Dự án có kiến trúc chia rõ ràng thành 3 phần chính trong thư mục `src/`:

- **`app/`**: Chứa toàn bộ giao diện cốt lõi, bao gồm:
  - `components/`: Nơi chứa các màn hình (`-page.tsx`) và module UI chung.
  - `router.tsx`: Khai báo luồng chuyển trang (Routing) cho toàn dự án.
- **`features/`**: **Trái tim của dự án**. Các logic nghiệp vụ được chia vào từng thư mục riêng lẻ như: `students` (Sinh viên), `auth` (Xác thực), `attendances` (Điểm danh), v.v. Trong mỗi Feature chứa:
  - `types.ts`: Kiểu dữ liệu TypeScript.
  - `hooks/`: Nơi gọi API (thường kết hợp với React Query) để lấy data ném ra UI. Component chỉ cần gọi Hook thay vì nhúng logic phức tạp.
  - `services/`: Nơi giao tiếp với Backend hoặc trả về dữ liệu ảo (Mock). *Thực tế sẽ gọi Axios tại đây*.
- **`shared/`**: Các thành phần tái sử dụng ở cấp độ toàn cục như cấu hình hệ thống (`config`), format ngày tháng, và các component UI (`components/ui`).

---

## 🚀 2. Hướng dẫn Chạy Dự án (Local Development)

### Yêu cầu môi trường
- NodeJS >= 18
- pnpm (hoặc npm)

### Các bước cài đặt
1. **Cài đặt thư viện phụ thuộc:**
   Dự án đang sử dụng pnpm (bạn có thể dùng `npm install` nếu không có `pnpm`)
   ```bash
   pnpm install
   ```
2. **Khởi chạy máy chủ phát triển (Dev server):**
   ```bash
   pnpm dev
   ```
   Mở thông báo terminal, thường sẽ chạy ở [http://localhost:5173](http://localhost:5173).

---

## 🔌 3. Hướng dẫn Ghép nối API Backend

Hiện tại, hệ thống đang sử dụng **dữ liệu ảo (Mock Data)** được lập trình sẵn trong các tệp `*.mock.ts` ở các Features. Điều này giúp Frontend có thể thiết kế đầy đủ luồng mà không cần đợi Backend hoàn thành.

Để thay đổi sang gọi dữ liệu Backend thật thông qua API, kiến trúc đã chuẩn bị sẵn theo phương pháp **Adapter Pattern (ServiceProvider)**. Bạn hãy làm theo 3 bước sau mà **KHÔNG CẦN CHỈNH SỬA Ở FILE GIAO DIỆN (UI) NÀO**:

### Bước 1: Viết tệp `.api.ts` kết nối Axios
Vào trong thư mục services của tính năng tương ứng (VD: `src/features/students/services/`), tạo file `student.api.ts` implements chung một interface `IStudentService`.
*Ví dụ `student.api.ts`:*
```typescript
import axios from 'axios';
import { IStudentService } from './student.service';

export const studentApi: IStudentService = {
  list: async (filters) => {
    const res = await axios.get('/api/students', { params: filters });
    return res.data;
  },
  // Các khai báo method create, update, delete...
};
```

### Bước 2: Bật / Tắt trạng thái kết nối
Các service được quyết định lấy API thật hay Mock dựa vào biến môi trường `VITE_DATA_SOURCE`.
Trong file `.env` (bạn hãy tạo từ `.env.example`), cấu hình:
```env
VITE_DATA_SOURCE=api
# Có thể trỏ Backend URL tại đây:
VITE_API_BASE_URL=http://localhost:8000/api
```

### Bước 3: Xem kết quả
File định tuyến dịch vụ `index.ts` (VD: `src/features/students/services/index.ts`) đã được viết sẵn cơ chế tự động chuyển đổi logic:
```typescript
import { createService } from '@/shared/services/service-provider';
import { studentMock } from './student.mock';
import { studentApi } from './student.api';

// Hàm createService sẽ tự động nhả về 'studentApi' nếu env VITE_DATA_SOURCE='api'
export const studentService = createService(studentMock, studentApi); 
```

**Mọi hooks gọi từ UI đều giữ nguyên cấu trúc cũ**. Tới đây, toàn bộ UI sẽ tự động đẩy dữ liệu từ Backend thực tế của bạn. 🎉 