# PROJECT PROPOSAL: CINEMAHUB (CINX)

## 1. GIỚI THIỆU DỰ ÁN (INTRODUCTION)
**CinemaHub (Cinx)** là một nền tảng web hiện đại dành cho việc quản lý và đặt vé xem phim trực tuyến. Dự án hướng tới việc cung cấp trải nghiệm người dùng mượt mà, từ khâu tìm kiếm phim, xem chi tiết, chọn suất chiếu cho đến việc đặt ghế ngồi trong thời gian thực. Hệ thống cũng tích hợp bộ công cụ quản trị mạnh mẽ dành cho nhân viên rạp phim.

## 2. MỤC TIÊU DỰ ÁN (PROJECT OBJECTIVES)
*   **Trải nghiệm người dùng:** Cung cấp giao diện hiện đại, tối ưu hóa trên nhiều thiết bị.
*   **Hệ thống đặt vé:** Xây dựng logic chọn ghế thông minh, hỗ trợ nhiều loại ghế (Thường, VIP, Couple) với giá vé linh hoạt.
*   **Quản lý dữ liệu:** Sử dụng Supabase làm Backend-as-a-Service để quản lý người dùng, phim, suất chiếu và giao dịch một cách an toàn và nhanh chóng.
*   **Bộ công cụ Admin:** Cho phép quản lý toàn diện nội dung (phim, tin tức, khuyến mãi) và theo dõi doanh thu/người dùng.

## 3. CÁC TÍNH NĂNG CHÍNH (KEY FEATURES)

### 3.1. Dành cho người dùng (Customer Features)
*   **Trang chủ:** Banner Carousel nổi bật, danh sách phim đang chiếu và sắp chiếu.
*   **Tìm kiếm & Lọc:** Tìm kiếm phim theo tên, lọc theo trạng thái.
*   **Chi tiết phim:** Xem thông tin chi tiết, trailer và lịch chiếu của từng phim.
*   **Đặt vé trực tuyến:**
    *   Chọn suất chiếu theo ngày/giờ.
    *   Sơ đồ ghế ngồi trực quan (hiển thị trạng thái ghế trống/đã đặt).
    *   Tính tổng tiền dựa trên loại ghế và chương trình khuyến mãi.
*   **Quản lý tài khoản:** Xem lịch sử đặt vé (My Tickets), cập nhật thông tin cá nhân.
*   **Tin tức & Khuyến mãi:** Cập nhật các ưu đãi và thông tin điện ảnh mới nhất.

### 3.2. Dành cho quản trị viên (Admin Features)
*   **Dashboard:** Tổng quan về doanh thu, số lượng vé bán ra và người dùng mới.
*   **Quản lý Phim:** Thêm, sửa, xóa phim và cập nhật trạng thái chiếu.
*   **Quản lý Suất chiếu & Ghế:** Thiết lập lịch chiếu và giá vé cho từng phòng máy.
*   **Quản lý Người dùng:** Theo dõi danh sách thành viên và phân quyền (User/Admin).
*   **Quản lý Nội dung:** Cập nhật Carousel, Tin tức và các chương trình Khuyến mãi.

## 4. CÔNG NGHỆ SỬ DỤNG (TECH STACK)
*   **Frontend:** React.js (v18), Redux (quản lý state đặt vé), React Router DOM (điều hướng).
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage).
*   **Giao diện:** Vanilla CSS (Modern UI), Swiper.js (Carousel), Lucide Icons.
*   **Quản lý dự án:** Agile/Scrum.

## 5. KIẾN TRÚC DỮ LIỆU (DATABASE SCHEMA)
Hệ thống sử dụng cơ sở dữ liệu quan hệ với các bảng chính:
*   `movies`: Lưu trữ thông tin phim.
*   `showtimes`: Quản lý các suất chiếu của phim.
*   `seats`: Trạng thái ghế ngồi cho từng suất chiếu.
*   `bookings` & `booking_seats`: Lưu trữ thông tin giao dịch và chi tiết ghế đã đặt.
*   `users`: Thông tin định danh và phân quyền người dùng.
*   `news` & `promotions`: Nội dung tin tức và khuyến mãi.

## 6. KẾ HOẠCH TRIỂN KHAI (IMPLEMENTATION PLAN)
Dự án được chia thành 4 giai đoạn chính (Sprints):
1.  **Sprint 1: Nền tảng & Auth:** Thiết lập Supabase, xây dựng Layout chính và hệ thống Đăng nhập/Đăng ký.
2.  **Sprint 2: Browsing & Discovery:** Hoàn thiện trang chủ, trang chi tiết phim và chức năng tìm kiếm.
3.  **Sprint 3: Booking System:** Phát triển logic chọn ghế, tính tiền và lưu trữ giao dịch đặt vé.
4.  **Sprint 4: Admin Dashboard & Polish:** Xây dựng bộ công cụ quản trị, tối ưu hóa hiệu năng và kiểm thử toàn diện.

---
**Người soạn thảo:** Gemini CLI
**Ngày:** 09/03/2026
