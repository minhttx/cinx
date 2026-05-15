# CinX Codebase File Catalog

## 1. Root Directory (`main/`)
Các file cấu hình hệ thống, triển khai và tài liệu kỹ thuật cốt lõi.

| File Name | Function/Purpose |
|-----------|------------------|
| `package.json` | Quản lý thông tin dự án, các thư viện phụ thuộc (dependencies) và scripts khởi chạy/build. |
| `dockerfile` | Định nghĩa quy trình đóng gói ứng dụng React thành Docker image. |
| `docker-compose.yml` | Điều phối đồng thời nhiều container (Frontend, Proxy, Ollama) để triển khai hệ thống. |
| `nginx.conf` | Cấu hình máy chủ web Nginx, phục vụ file tĩnh và đóng vai trò là Reverse Proxy cho các API. |
| `ai.md` | Tài liệu kỹ thuật về tích hợp trí tuệ nhân tạo Ollama và các Prompt hệ thống. |
| `db.md` | Bản mô tả cấu trúc các bảng trong cơ sở dữ liệu PostgreSQL (Supabase). |
| `tongquan.md` | Tổng quan kiến trúc dự án và thiết kế luồng nghiệp vụ mức cao. |
| `vnpay-integration.md` | Hướng dẫn chi tiết luồng tích hợp và kiểm thử cổng thanh toán VNPAY. |
| `generate_seats.md` | Tài liệu/Script phục vụ logic tự động khởi tạo sơ đồ 90 ghế cho mỗi suất chiếu mới. |

## 2. Public Assets (`main/public/`)
Các tài nguyên tĩnh được trình duyệt truy cập trực tiếp.

| File Name | Function/Purpose |
|-----------|------------------|
| `index.html` | File HTML gốc của ứng dụng Single Page (SPA). |
| `manifest.json` | Cấu hình Web App Manifest cho tính năng Progressive Web App (PWA). |
| `logo-pwa.svg` | Logo ứng dụng định dạng vector phục vụ cài đặt PWA. |
| `logo.ico` | Biểu tượng icon hiển thị trên tab của trình duyệt. |
| `robots.txt` | Chỉ dẫn dành cho các bộ máy tìm kiếm (SEO). |
| `img/` | Thư mục chứa các hình ảnh tĩnh như logo VNPAY, background hệ thống. |

## 3. Source Code (`main/src/`)

### 3.1. Core Files
| File Name | Function/Purpose |
|-----------|------------------|
| `App.js` | Thành phần gốc điều phối Routing (React Router), quản lý các Guard và Provider toàn cục. |
| `index.js` | Điểm bắt đầu (Entry point) của ứng dụng, kết nối React với DOM và Redux Store. |
| `App.css` / `index.css` | Các định dạng kiểu dáng (styles) toàn cục cho ứng dụng. |
| `setupTests.js` | Cấu hình môi trường kiểm thử Jest cho dự án. |

### 3.2. Components (`src/components/`)
Các thành phần giao diện có tính tái sử dụng cao.

| File Name | Function/Purpose |
|-----------|------------------|
| `Header.jsx` | Thanh tiêu đề trên cùng, chứa logo và nút kích hoạt nhanh Chatbot AI. |
| `Navigation.jsx` | Menu điều hướng và là nơi nhúng trực tiếp cửa sổ Chat với trợ lý ảo CinX. |
| `SearchBar.jsx` | Thanh tìm kiếm phim thông minh tích hợp nút gọi AI Assistant. |
| `BookingGuard.jsx` | Thành phần bảo mật ngăn chặn người dùng rời khỏi trang khi đang trong quy trình đặt ghế. |
| `ConfirmModal.jsx` | Modal xác nhận dùng chung (Xác nhận thanh toán, Thoát quy trình). |
| `MovieCard.jsx` | Thẻ hiển thị thông tin phim (Poster, Tên, Rating) tại trang chủ và tìm kiếm. |
| `MovieInfoSidebar.jsx`| Thanh bên hiển thị nhanh thông tin phim khi người dùng click vào link từ AI Chat. |
| `ProtectedRoute.jsx` | Thành phần bao bọc (Wrapper) để kiểm tra quyền Admin/User trước khi truy cập. |
| `HeroCarousel.jsx` | Slider trình chiếu các bộ phim và tin tức nổi bật tại đầu trang chủ. |
| `GenericSkeleton.jsx` | Hiệu ứng chờ tải dữ liệu (Loading) cho các thành phần giao diện. |
| `admin/` | Thư mục chứa các phân hệ quản trị: Overview, Movie Mgt, Analytics, User Mgt, v.v. |

### 3.3. Pages (`src/pages/`)
Các trang màn hình chính của hệ thống.

| File Name | Function/Purpose |
|-----------|------------------|
| `HomePage.jsx` | Trang chủ hiển thị danh sách phim đang chiếu và sắp chiếu. |
| `MovieDetails.jsx` | Xem thông tin chi tiết một bộ phim, lịch chiếu cụ thể và bình luận. |
| `BookingPage.jsx` | Giao diện quy trình đặt vé 4 bước (Phim -> Suất chiếu -> Ghế -> Thanh toán). |
| `BookingCallback.jsx`| Tiếp nhận phản hồi từ VNPAY, xác thực chữ ký và cập nhật trạng thái đơn hàng. |
| `BookingSuccess.jsx`| Hiển thị kết quả đặt vé thành công, mã QR và cuống vé điện tử. |
| `CheckinScanner.jsx` | Công cụ quét mã QR dành cho nhân viên rạp để kiểm soát vé vào phòng chiếu. |
| `MyTicketsPage.jsx` | Ví vé cá nhân lưu trữ lịch sử các vé đã đặt thành công. |
| `AdminDashboard.jsx` | Trang trung tâm điều hành mọi hoạt động của hệ thống quản trị. |
| `LoginPage.jsx` | Giao diện đăng nhập và đăng ký tài khoản tích hợp Supabase Auth. |
| `UserProfile.jsx` | Trang quản lý thông tin cá nhân và cài đặt người dùng. |

### 3.4. Logic & State Management (`src/services/`, `src/redux/`, `src/contexts/`)
Tầng xử lý dữ liệu và quản lý trạng thái ứng dụng.

| File Name | Function/Purpose |
|-----------|------------------|
| `services/ai.js` | **AI Orchestrator**: Trái tim AI của hệ thống, xử lý NLU và kết nối với Ollama. |
| `services/api.js` | **Data Access Layer**: Tổng hợp các hàm giao tiếp với Supabase và logic Analytics phức tạp. |
| `services/supabaseClient.js`| Khởi tạo kết nối tới Supabase Cloud thông qua biến môi trường. |
| `services/tmdb.js` | Dịch vụ lấy dữ liệu phim tự động từ API The Movie Database. |
| `redux/configStore.js` | Cấu hình Store trung tâm của Redux. |
| `redux/reducers/datVeReducer.js`| Quản lý trạng thái chọn ghế và tiến trình đặt vé theo thời gian thực. |
| `contexts/AuthContext.jsx`| Quản lý trạng thái đăng nhập, Session và phân quyền người dùng. |
| `contexts/ContentContext.jsx`| Bộ nhớ đệm (Cache) toàn cục cho các dữ liệu phim, tin tức và khuyến mãi. |

### 3.5. Utilities & Styles (`src/utils/`, `src/styles/`)
Các công cụ bổ trợ và định dạng giao diện.

| File Name | Function/Purpose |
|-----------|------------------|
| `utils/vnpay.js` | Logic tạo URL thanh toán bảo mật và kiểm tra mã Checksum từ VNPAY. |
| `utils/formatUtils.js` | Các hàm hỗ trợ định dạng tiền tệ (VND) và định dạng ngày giờ chuẩn Việt Nam. |
| `styles/variables.css` | Nơi lưu trữ các biến màu hệ thống, khoảng cách và kiểu chữ dùng chung. |
| `styles/*.css` | Các file định dạng riêng biệt cho từng thành phần giao diện và trang màn hình. |
