# Thuật toán Sắp xếp Lịch chiếu Tuần (CinX Weekly Scheduler v2.0)

Hệ thống quy hoạch lịch chiếu tổng thể dựa trên danh sách phim "Đang chiếu" và cấu hình phòng thực tế tại thời điểm lập lịch.

## 1. Thiết lập thuộc tính Phim (Movie Configuration)
Các đặc tính sau được Admin thiết lập trực tiếp trong Slide Drawer khi Thêm/Sửa phim:
- **Hot (Blockbuster)**: Đánh dấu phim trọng điểm cần ưu tiên công suất.
- **Phim IMAX**: Yêu cầu phòng có công nghệ IMAX.
- **Phim 4DX**: Yêu cầu phòng có công nghệ 4DX.
- *(Lưu ý: Một phim có thể vừa là Hot, vừa là IMAX/4DX).*

## 2. Quy trình lập lịch tự động (Dynamic Execution Flow)

### Bước 1: Thu thập tài nguyên (Resource Discovery)
Hệ thống truy vấn danh sách phòng chiếu thực tế từ bảng `rooms`. Số lượng và loại phòng (2D/3D, IMAX, 4DX) là linh hoạt, không cố định.

### Bước 2: Phân bổ Phim vào Phòng (Intelligent Room Mapping)
Hệ thống lấy danh sách phim có trạng thái "Đang chiếu" và thực hiện gán:
1. **Ràng buộc cứng (Hard Constraints)**: 
   - Phim `IMAX` -> Gán vào các phòng có `type: 'IMAX'`.
   - Phim `4DX` -> Gán vào các phòng có `type: '4DX'`.
2. **Phân bổ linh hoạt (Flexible Pool)**: 
   - Các phim còn lại (Phim Thường/Hot) được gán vào các phòng có `type: '2D/3D'`.
   - Nếu số phim ít hơn số phòng thường: Phim `Hot` sẽ được gán thêm vào các phòng trống.
   - Nếu số phim nhiều hơn số phòng: Admin cần điều chỉnh danh sách "Đang chiếu" (Hệ thống sẽ cảnh báo).

### Bước 3: Lập lịch suất chiếu & Chiếm dụng giờ vàng (The Hijack Logic)
Với mỗi ngày (7 ngày tới) và 5 khung giờ chuẩn (`09:00`, `13:00`, `16:00`, `19:00`, `21:30`):

1. **Suất chiếu nền**: Mỗi phòng chiếu bộ phim đã được gán cố định ở Bước 2 cho cả 5 khung giờ.
2. **Ưu tiên Phim Hot (Prime-time Overlay)**:
   - Hệ thống xác định suất chiếu lúc `19:00` ở tất cả các phòng thường (`2D/3D`).
   - Nếu có phim được đánh dấu `is_hot`, hệ thống sẽ thay thế phim thường tại suất `19:00` bằng phim Hot đó.
   - Điều này đảm bảo phim ăn khách nhất luôn chiếm lĩnh khung giờ vàng trên toàn bộ rạp.

### Bước 4: Áp dụng giá vé & Khởi tạo Ghế
- **Tính giá**: `(Giá cơ bản * Hệ số cuối tuần) * Hệ số phòng`.
- **Tạo ghế**: Chạy thủ tục `generate_seats_for_showtime` cho 100% các suất chiếu mới tạo.

## 3. Nguyên tắc vận hành
- **Quy hoạch Hàng tuần**: Nút "Tạo suất chiếu cho tuần" sẽ dọn sạch lịch cũ và thiết lập một chu kỳ mới.
- **Tính nhất quán**: Không cho phép chỉnh sửa lẻ tẻ sau khi đã xuất lịch để bảo vệ dữ liệu vé của khách hàng.
- **Mở rộng**: Hệ thống tự động thích ứng khi Admin thêm phòng chiếu mới trong tương lai.

---
*Tài liệu thuật toán hệ thống CinX - Cập nhật theo cấu hình phòng động*
