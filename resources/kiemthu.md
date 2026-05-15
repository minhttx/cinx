# BÁO CÁO KẾ HOẠCH VÀ KẾT QUẢ KIỂM THỬ HỆ THỐNG CINX

## 1. Mục tiêu kiểm thử
Đảm bảo tính ổn định, chính xác và an toàn của hệ thống đặt vé xem phim tích hợp AI. Tập trung vào các luồng nghiệp vụ cốt lõi: Đặt vé, Thanh toán, Tư vấn AI, Quản trị hệ thống và Soát vé QR.

## 2. Môi trường kiểm thử
- **Hệ điều hành**: Linux (Fedora 43, Ubuntu 24.04).
- **Trình duyệt**: Google Chrome, Microsoft Edge, Mozilla Firefox.
- **Thiết bị**: Desktop (1920x1080), Mobile (iPhone 14 Pro, Samsung S23 Ultra - Giả lập).
- **Mạng**: Môi trường Localhost và Cloudflare Tunnel.

## 3. Các cấp độ kiểm thử

### 3.1. Kiểm thử đơn vị (Unit Testing)
- **Component UI**: Kiểm tra hiển thị của Movie Card, Seat Map, Countdown Timer.
- **Logic Helper**: Kiểm tra các hàm tính toán giá vé, định dạng ngày tháng, chuẩn hóa giờ chiếu.
- **Redux State**: Đảm bảo trạng thái chọn ghế và tổng tiền được cập nhật đúng sau mỗi hành động click.

### 3.2. Kiểm thử tích hợp (Integration Testing)
- **Frontend - Supabase**: Kiểm tra luồng dữ liệu khi Thêm/Sửa/Xóa phim và suất chiếu.
- **Frontend - Ollama (AI)**: Kiểm tra khả năng kết nối và trích xuất dữ liệu (NLU) từ tin nhắn người dùng.
- **Frontend - VNPAY**: Kiểm tra tính chính xác của URL thanh toán và chữ ký bảo mật (Checksum).

### 3.3. Kiểm thử hệ thống (System Testing)
- Kiểm thử luồng đặt vé từ đầu đến cuối (End-to-End).
- Kiểm thử khả năng chịu tải khi tạo lịch chiếu tuần (Xử lý hàng ngàn dòng ghế đồng thời).

---

## 4. Kịch bản kiểm thử chi tiết (Test Scenarios)

### Nhóm 1: Xác thực và Phân quyền
| ID | Chức năng | Mô tả kịch bản | Kết quả mong đợi | Trạng thái |
|----|-----------|----------------|------------------|------------|
| TC-01 | Đăng ký | Đăng ký với Email đã tồn tại | Hệ thống báo lỗi "Email đã được sử dụng" | Đạt |
| TC-02 | Phân quyền | Tài khoản 'User' truy cập trực tiếp link `/admin` | Tự động chuyển hướng về trang chủ hoặc báo lỗi 403 | Đạt |
| TC-03 | Duy trì phiên | F5 trang web sau khi đăng nhập | Trạng thái đăng nhập vẫn được giữ nguyên | Đạt |

### Nhóm 2: Trợ lý AI (CinX Chatbot)
| ID | Chức năng | Mô tả kịch bản | Kết quả mong đợi | Trạng thái |
|----|-----------|----------------|------------------|------------|
| TC-04 | NLU Extraction | Nhập: "Tìm phim hành động tối nay" | AI trích xuất đúng `Genre: Action`, `Time: Evening` | Đạt |
| TC-05 | Link Action | Click vào giờ chiếu AI gợi ý | Chuyển thẳng sang trang đặt vé, đúng phim, đúng suất | Đạt |
| TC-06 | Sentiment | Gửi bình luận cực kỳ tiêu cực | AI gắn nhãn "Negative" trong trang quản trị | Đạt |

### Nhóm 3: Đặt vé và Thanh toán
| ID | Chức năng | Mô tả kịch bản | Kết quả mong đợi | Trạng thái |
|----|-----------|----------------|------------------|------------|
| TC-07 | Giữ ghế | Chọn ghế và để hết 15 phút không trả tiền | Ghế được tự động giải phóng (Available) | Đạt |
| TC-08 | Chuyển hướng | Bấm "Thanh toán qua VNPAY" | Hiện Modal xác nhận nội bộ, không hiện popup trình duyệt | Đạt |
| TC-09 | Callback | Thanh toán thành công tại Sandbox VNPAY | Chuyển về trang thành công, hiển thị đúng vé và mã QR | Đạt |

### Nhóm 4: Quản trị và Soát vé (Admin & Staff)
| ID | Chức năng | Mô tả kịch bản | Kết quả mong đợi | Trạng thái |
|----|-----------|----------------|------------------|------------|
| TC-10 | Analytics | Kiểm tra Heatmap sau khi có đơn hàng mới | Ô tương ứng trên Heatmap đậm màu hơn, đếm đúng số đơn | Đạt |
| TC-11 | Check-in | Quét vé trước giờ chiếu 60 phút | Hiện Modal: "Chưa đến giờ quét QR cho suất chiếu này" | Đạt |
| TC-12 | Check-in | Quét vé đã sử dụng | Hiện thông báo: "Vé đã Check-in" | Đạt |
| TC-13 | Movie Sync | Thêm phim qua tìm kiếm TMDB | Tự động điền Poster, Trailer, Mô tả và Diễn viên | Đạt |

---

## 5. Kiểm thử hồi quy (Regression Testing)
Sau khi thực hiện các bản sửa lỗi (Bug Fixes), hệ thống đã được kiểm tra lại để đảm bảo:
- **Lỗi 90 ghế trống**: Đã được khắc phục hoàn toàn bằng cách đếm trực tiếp từ Database.
- **Lỗi hiển thị chớp nhoáng**: Trang Callback đã mượt mà, không còn hiện bảng lỗi khi đang xử lý.
- **Lỗi giờ chiếu quá hạn**: Các suất chiếu đã trôi qua tự động ẩn khỏi danh sách lựa chọn.

## 6. Kết luận
Hệ thống CinX đáp ứng tốt các yêu cầu về nghiệp vụ và tính năng thông minh. Quy trình thanh toán an toàn, logic soát vé chặt chẽ và các công cụ phân tích AI cung cấp thông tin có giá trị cao cho người quản lý. Hệ thống đã sẵn sàng cho giai đoạn triển khai thực tế.
