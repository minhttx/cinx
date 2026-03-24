# Kế hoạch Tích hợp Hệ thống Thanh toán VNPAY (Sandbox)

Tài liệu này mô tả chi tiết quy trình và kỹ thuật tích hợp cổng thanh toán VNPAY vào quy trình đặt vé của CinemaHub.

---

## 1. Luồng Người dùng (User Flow)

### Bước 1: Chọn Phim & Suất chiếu (Step 1)
- Người dùng chọn phim từ Carousel.
- Chọn suất chiếu trong Slide Drawer.

### Bước 2: Chọn Ghế (Step 2)
- Người dùng chọn các vị trí ghế trên sơ đồ 8x12.
- Nút "Xác nhận đặt vé" đổi tên thành **"Tiến hành Thanh toán"**.

### Bước 3: Thanh toán & Giữ chỗ (Step 3 - Mới)
- Khi bấm nút, hệ thống tạo một đơn hàng tạm thời (`status: 'pending'`) trong Database.
- Slide Drawer hiển thị giao diện thanh toán:
    - **Đồng hồ đếm ngược:** 15:00 phút (Giờ giữ chỗ). Nếu hết giờ, đơn hàng bị hủy, ghế được giải phóng.
    - **Nút "Thanh toán qua VNPAY":** Mở cổng thanh toán VNPAY trong tab mới hoặc chuyển hướng.
- Giao diện Drawer hiển thị trạng thái "Đang chờ thanh toán...".

### Bước 4: Hoàn tất & Nhận Vé (Step 4)
- Sau khi thanh toán xong tại VNPAY, người dùng được quay lại CinemaHub.
- Hệ thống kiểm tra chữ ký (Checksum) và mã phản hồi (`vnp_ResponseCode == '00'`).
- **Thành công:** Cập nhật đơn hàng thành `confirmed`, ghế thành `booked`. Hiển thị mã QR và thông tin vé.
- **Thất bại/Hủy:** Thông báo lỗi và cho phép thực hiện lại hoặc chọn ghế khác.

---

## 2. Thông số Kỹ thuật VNPAY (Sandbox)

- **vnp_TmnCode:** 463HIKMC
- **vnp_HashSecret:** W270PLDKTP5UKM7PF86LGQMNXD6JD7EP
- **vnp_Url:** https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
- **Thuật toán băm:** HMACSHA512

---

## 3. Các thành phần cần triển khai

### A. Frontend (React)
1. **Quản lý trạng thái:**
    - Thêm `step: 'payment'` vào `BookingPage`.
    - Thêm Component `CountdownTimer` (15 phút).
2. **Xử lý URL trả về (`vnp_ReturnUrl`):**
    - Tạo Route mới `/booking/callback` để tiếp nhận dữ liệu từ VNPAY.
    - Kiểm tra tính toàn vẹn của dữ liệu trả về bằng `vnp_SecureHash`.
3. **Giao diện Slide Drawer:**
    - Thiết kế lại phần Bill Summary để chèn nút thanh toán và đồng hồ đếm ngược.

### B. Backend (Supabase / API Service)
1. **Logic Tạo URL Thanh toán:**
    - Tạo hàm `generateVnpayUrl` trong `api.js`. 
    - *Lưu ý:* Để bảo mật tuyệt đối, Secret Key nên để ở server. Tuy nhiên, trong môi trường prototype, ta sẽ triển khai logic băm trong một service utility được bảo vệ.
2. **Cập nhật Database:**
    - Thêm cột `payment_status` và `expire_at` vào bảng `bookings`.
    - Viết logic giải phóng ghế tự động nếu đơn hàng hết hạn (có thể dùng Postgres Cron hoặc xử lý khi người dùng load lại trang).

---

## 4. Kế hoạch triển khai (Action Items)

1. **Task 1:** Tạo thư mục `utils/vnpay.js` để chứa logic tạo URL và kiểm tra chữ ký (HMACSHA512).
2. **Task 2:** Cập nhật `api.js` để thêm hàm `createPaymentUrl`.
3. **Task 3:** Chỉnh sửa `BookingPage.jsx`:
    - Thêm bước `payment` vào quy trình.
    - Tích hợp `CountdownTimer` vào Slide Drawer.
    - Thay đổi logic nút "Đặt vé" thành "Thanh toán".
4. **Task 4:** Triển khai trang `BookingCallback.jsx` để xử lý kết quả trả về từ VNPAY.
5. **Task 5:** Đồng bộ hóa trạng thái ghế và đơn hàng trong Database sau khi thanh toán.

---

**Bạn có đồng ý với kế hoạch này không? Nếu đồng ý, tôi sẽ bắt đầu thực hiện Task 1.**
