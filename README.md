# BÁO CÁO ĐỒ ÁN TỐT NGHIỆP: HỆ THỐNG ĐẶT VÉ XEM PHIM THÔNG MINH CINX (AI-POWERED)

## 1. TỔNG QUAN CÔNG NGHỆ (TECH STACK)

Dự án được xây dựng dựa trên kiến trúc hiện đại, tối ưu hóa cho trải nghiệm người dùng và khả năng mở rộng.

### 1.1. Frontend
*   **React.js (v18):** Thư viện chính xây dựng giao diện người dùng.
*   **Redux:** Quản lý trạng thái ứng dụng (state management), đặc biệt là quy trình đặt vé và sơ đồ ghế.
*   **React Router DOM (v6):** Điều hướng đa trang và quản lý tham số URL.
*   **Material Design 3 (M3):** Hệ thống ngôn ngữ thiết kế (Design System) hiện đại từ Google, áp dụng qua Vanilla CSS.
*   **React Markdown & Remark GFM:** Xử lý hiển thị nội dung định dạng Markdown từ AI.
*   **Lucide Icons & Material Symbols:** Hệ thống biểu tượng trực quan cho giao diện.

### 1.2. Backend & Infrastructure
*   **Supabase (BaaS):** 
    *   **PostgreSQL:** Cơ sở dữ liệu quan hệ lưu trữ Phim, Suất chiếu, Ghế, Giao dịch.
    *   **Supabase Auth:** Quản lý định danh người dùng.
    *   **Supabase Storage:** Lưu trữ hình ảnh poster phim và carousel.
    *   **Database RPC (Remote Procedure Call):** Tối ưu hóa các truy vấn phức tạp (tính toán ghế trống, xóa cascade).
*   **Nginx:** Đóng vai trò Reverse Proxy, cân bằng tải và bảo mật các cổng kết nối.
*   **Podman/Docker:** Đóng gói ứng dụng vào container để dễ dàng triển khai.

### 1.3. Trí tuệ nhân tạo (AI Engine)
*   **Ollama (Local LLM):** Chạy các mô hình ngôn ngữ lớn (Llama 3.2, Gemini-cloud proxy) ngay trong hạ tầng nội bộ.
*   **Jina AI:** Trích xuất nội dung từ URL để hỗ trợ chức năng viết tin tức tự động.

---

## 2. CÁC TÍNH NĂNG CHÍNH CỦA HỆ THỐNG

### 2.1. Dành cho người dùng (Customer Features)
*   **Khám phá phim:** Xem danh sách phim đang chiếu/sắp chiếu với bộ lọc thông minh.
*   **Hệ thống đề xuất (Smart Chips):**
    *   **Xu hướng:** Top 3 phim có lượt đặt vé cao nhất thực tế.
    *   **Đỉnh cao:** Lọc phim có Rating > 80%.
    *   **Dành cho bạn:** Đề xuất phim dựa trên sở thích cá nhân (Gu phim) trích xuất từ lịch sử đặt vé.
*   **Quy trình đặt vé siêu tốc:**
    *   Chọn suất chiếu theo ngày/phòng.
    *   Sơ đồ ghế thời gian thực (Ghế Thường, VIP, Couple).
    *   Thanh toán tích hợp qua cổng **VNPAY**.
*   **Quản lý cá nhân:** Xem lại vé đã đặt, lịch sử giao dịch và cập nhật thông tin thành viên.

### 2.2. Dành cho quản trị viên (Admin Panel)
*   **Dashboard Analytics:** Biểu đồ doanh thu, thống kê lượt đặt vé theo giờ và theo phim.
*   **Quản lý Suất chiếu tự động:** Thuật toán tự động sắp xếp lịch chiếu cả tuần dựa trên loại phòng (IMAX, 4DX, 2D) và độ "Hot" của phim.
*   **Kiểm soát nội dung:** Quản lý phim, tin tức, khuyến mãi và phê duyệt bình luận khách hàng.
*   **Hệ thống Check-in:** Quét mã vé để xác nhận vào rạp.

---

## 3. ĐIỂM NHẤN: TRÍ TUỆ NHÂN TẠO (AI INTEGRATION)

Đây là giá trị cốt lõi của đồ án, biến CinX từ một web đặt vé truyền thống thành một trợ lý ảo thực thụ.

### 3.1. Trợ lý ảo CinX (Chatbot)
*   **Cơ chế JIT (Just-In-Time) Context Injection:** Chatbot không trả lời dựa trên dữ liệu cũ mà truy xuất trực tiếp trạng thái rạp phim (suất chiếu, ghế trống thực tế) ngay tại thời điểm người dùng hỏi.
*   **Khả năng hiểu ngôn ngữ tự nhiên (NLU):** Tự động hiểu các khái niệm thời gian như "tối nay", "cuối tuần", "ngày mai" để lọc suất chiếu chính xác.
*   **Tư vấn cá nhân hóa:** Phân tích "Gu" của người dùng để đưa ra lời khuyên phim phù hợp.
*   **Hệ thống Hyperlink thông minh:** 
    *   Tên phim hiển thị dưới dạng link, bấm vào mở Slide Drawer chi tiết.
    *   Giờ chiếu hiển thị dưới dạng link, bấm vào nhảy thẳng tới bước chọn ghế cho suất chiếu đó.
*   **Chiến thuật bán hàng (Sales Psychology):** AI biết hối thúc khách hàng khi suất chiếu sắp hết vé hoặc gợi ý vị trí "ghế đẹp" (VIP trung tâm, Couple lãng mạn).

### 3.2. AI trong Quản trị (Admin AI Tools)
*   **AI Writing (News & Promotions):** 
    *   Tự động viết bài review/tin tức phim từ một URL bất kỳ hoặc từ một chủ đề gợi ý.
    *   Tự động tạo chiến dịch khuyến mãi hấp dẫn (Catchy titles, FOMO description) chỉ từ một yêu cầu ngắn.
*   **AI System Prompt Management:** Cho phép Admin thay đổi hành vi, tính cách của chatbot ngay trên giao diện mà không cần can thiệp vào code.

---

## 4. PHÂN TÍCH KỸ THUẬT CHUYÊN SÂU

### 4.1. Thuật toán Sắp xếp Lịch chiếu Tuần (Weekly Scheduler)
Hệ thống sử dụng một thuật toán lập lịch thông minh giúp Admin tiết kiệm thời gian quản lý:
1.  **Phân bổ dựa trên công nghệ phòng (Resource Mapping):** Tự động gán phim định dạng IMAX/4DX vào các phòng máy tương ứng. Phim thường được đưa vào nhóm phòng 2D/3D.
2.  **Chiếm dụng giờ vàng (The Hijack Logic):** Thuật toán xác định khung giờ vàng (19:00) hàng ngày. Nếu rạp có phim được đánh dấu "Hot", phim này sẽ tự động thay thế suất chiếu của các phim khác tại giờ vàng trên toàn bộ các phòng thường để tối ưu hóa doanh thu.
3.  **Hệ số giá động:** Giá vé được tính toán tự động dựa trên: `(Giá gốc * Hệ số phòng * Hệ số cuối tuần)`.

### 4.2. Quy trình Thanh toán VNPAY (Payment Integration)
Tích hợp mô hình thanh toán an toàn qua cổng VNPAY Sandbox:
1.  **Khởi tạo đơn hàng:** Hệ thống tạo bản ghi `booking` trạng thái `pending` và tính toán `secure hash` (HMACSHA512) để gửi yêu cầu sang VNPAY.
2.  **Xử lý phản hồi (IPN & Return):** 
    *   **Return URL:** Nhận kết quả từ VNPAY để hiển thị thông báo ngay lập tức cho người dùng.
    *   **IPN (Instant Payment Notification):** Cập nhật trạng thái giao dịch trực tiếp từ máy chủ VNPAY vào database của hệ thống, đảm bảo dữ liệu đơn hàng luôn chính xác ngay cả khi người dùng đóng trình duyệt đột ngột.
3.  **Tự động giữ chỗ:** Ghế được giữ trạng thái `booked` trong 15 phút (thông qua Countdown Timer). Nếu quá thời gian thanh toán, hệ thống tự động giải phóng ghế để người khác có thể đặt.

---

## 5. KIẾN TRÚC DỮ LIỆU VÀ TỐI ƯU HÓA
*   **Vượt giới hạn 1000 dòng:** Sử dụng PostgreSQL RPC (`get_detailed_seat_stats`) để tính toán ghế trống cho hàng trăm suất chiếu cùng lúc, đảm bảo dữ liệu AI tư vấn luôn chính xác 100% mà không bị cắt cụt dữ liệu.
*   **Xử lý Streaming:** Phản hồi của AI được gửi về dưới dạng stream (từng chữ), tạo cảm giác tương tác tức thì như ChatGPT.
*   **Bảo mật:** Quản lý `z-index` phân tầng và lớp mờ (overlay) để đảm bảo chatbot luôn nằm trên cùng nhưng không gây gián đoạn trải nghiệm điều hướng.

---
**Ngày hoàn thành báo cáo:** 20/03/2026
**Người thực hiện:** [Tên của bạn]
