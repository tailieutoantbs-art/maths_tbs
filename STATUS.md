# Trạng Thái Dự Án (Project Status) - Hệ thống Toán TBS

*Tài liệu này dùng để theo dõi tiến độ dự án và cung cấp ngữ cảnh (context) cho AI trong các phiên làm việc tiếp theo.*

## 1. Thông Tin Tổng Quan (Project Overview)
- **Tên dự án:** Cổng Công Nghệ Thông Tin - Thầy Hùng TBS (toan-tbs-platform)
- **Stack công nghệ:** Next.js (App Router), TailwindCSS, Framer Motion.
- **Đa ngôn ngữ (i18n):** Sử dụng `next-intl` (Hỗ trợ Tiếng Việt & Tiếng Anh). 
- **Cơ sở dữ liệu:** Firebase / Firestore.
- **Ngôn ngữ thiết kế (UI):** Premium, Glassmorphism, phong cách hiện đại (Gamification cho học sinh, Dashboard chuyên nghiệp cho giáo viên).

---

## 2. Các Hạng Mục Đã Hoàn Thành (Completed)

✅ **Khởi tạo và thiết lập cơ bản:**
- Khởi tạo thành công dự án Next.js đa ngôn ngữ (`app/[locale]`).
- Cấu hình chuẩn Middleware (`middleware.ts`) và định tuyến (Routing).

✅ **Phân hệ Học sinh (Student Module) & Khảo thí:**
- Xây dựng thành công `StudentLogin` (Đăng nhập bằng Họ tên & Mã).
- Xây dựng thành công `StudentHome` (Không gian học tập có Gamification, Đấu trường, Olympic).
- Đã hoàn thiện UI Phòng thi thực tế (Testing Room) & Logic đấu trường thời gian thực.
- Đã nâng cấp **Student Dashboard**: Kết nối Firebase để kéo dữ liệu thật (Bảng xếp hạng Bảng Vàng Bảng Nhãn) và thông tin EXP.

✅ **Phân hệ Giáo viên - Giai đoạn 1 & 2 (Foundation, Localization & AI):**
- Xây dựng UI **Teacher Dashboard** (`/teacher/dashboard`) kết nối dữ liệu Firebase thật (không còn dùng mock data).
- Xây dựng **Plan Assistant** (`/plan-assistant`): Tích hợp chuẩn giao diện Premium, hỗ trợ đa ngôn ngữ hoàn chỉnh và **Tích hợp API Gemini thực tế**.
- Xây dựng UI chức năng **Ngân hàng đề thi (Bank)** & Khởi tạo mã nhiệm vụ cho Đấu trường.
- Xây dựng module **Kho tài liệu số** (`/documents`), hỗ trợ upload tài liệu nội bộ bộ môn Toán thông qua Cloudinary.

✅ **Gamification & Tích Hợp AI Mở Rộng:**
- Bổ sung công cụ AI hỗ trợ tự động sinh câu hỏi theo chủ đề thẳng vào Ngân hàng đề thi.
- Đồng bộ lưu trữ điểm (Arena points), huy hiệu (Badges) từ phòng chơi (`game_rooms`) ngược về hồ sơ `students`.
- Xây dựng trang Hồ sơ Học sinh cá nhân (Profile) hiển thị chi tiết lịch sử thi và huy hiệu đạt được với Premium UI.

---

## 3. Các Hạng Mục Tiếp Theo (Up Next)

⏳ **(Đang chờ các yêu cầu tiếp theo từ người dùng)**

---

## 4. Ghi Chú Cho AI Ở Phiên Mới (Notes for AI)
Khi bắt đầu một phiên làm việc mới, AI cần:
1. Đọc file `STATUS.md` này để nắm tiến độ hiện tại.
2. Kiểm tra lại cấu trúc thư mục tại `app/[locale]` và thư viện `messages/`.
3. Tuân thủ tuyệt đối quy tắc thiết kế Premium UI (Glassmorphism, Gradient).
4. Mọi văn bản thêm mới trên giao diện đều phải được khai báo trong `vi.json` và `en.json` thông qua `useTranslations`.
5. Tham khảo thêm file `implementation_plan.md` ở các phiên trước (nếu cần xem chi tiết kỹ thuật chuyên sâu).
