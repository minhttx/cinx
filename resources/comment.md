# Kế hoạch triển khai Chức năng Bình luận & Đánh giá (CinX Comments) - Cập nhật

Hệ thống bình luận cho phép cả người dùng thành viên và khách tham gia đóng góp ý kiến, tạo nguồn dữ liệu cho AI phân tích.

## 1. Cơ sở dữ liệu (Database Schema)

Tạo bảng `comments` trong Supabase:

- `id`: uuid (Primary Key)
- `movie_id`: uuid (Foreign Key -> movies.id)
- `user_id`: uuid (Foreign Key -> users.id, **có thể NULL** nếu là khách)
- `author_name`: text (Tên hiển thị: Tên thật của user hoặc "Khách ẩn danh")
- `content`: text (Nội dung bình luận)
- `rating`: integer (Đánh giá từ 1-10 sao)
- `created_at`: timestamp
- `status`: text (Trạng thái: **Mặc định là 'pending'**, 'approved', 'hidden')

## 2. Tầng API (services/api.js)

Bổ sung `commentAPI` với các phương thức:
- `getMovieComments(movieId)`: Lấy danh sách bình luận đã được **'approved'**.
- `postComment(data)`: Gửi bình luận mới. (Cho phép tất cả mọi người).
- **KHÔNG** cung cấp API sửa/xóa cho phía người dùng để đảm bảo tính minh bạch.
- `getModerationList()`: (Cho Admin) Lấy toàn bộ bình luận chờ duyệt.
- `approveComment(id)`: (Cho Admin) Duyệt bình luận.
- `hideComment(id)`: (Cho Admin) Ẩn bình luận vi phạm.

## 3. Giao diện người dùng (User Interface)

Triển khai tại trang **MovieDetails.jsx**:

### A. Danh sách bình luận
- Chỉ hiển thị những bình luận có `status: 'approved'`.
- Hiển thị Tên tác giả, Số sao, Thời gian và Nội dung.
- Không có nút Sửa/Xóa.

### B. Form gửi bình luận
- **Mở công khai:** Hiển thị cho tất cả khách truy cập.
- **Thành phần:**
    - Thanh chọn số sao (Star Rating).
    - Ô nhập liệu văn bản (Textarea).
    - **Thông báo:** *"Bình luận của bạn sẽ được hiển thị sau khi Ban quản trị phê duyệt."*
    - Nút "Gửi bình luận".

## 4. Quản trị viên (Admin Moderation)

Bổ sung Module **"Duyệt Bình luận"** trong Admin Dashboard:
- Hiển thị danh sách bình luận đang ở trạng thái **'pending'**.
- Cung cấp 2 lựa chọn nhanh: **[Duyệt]** (chuyển sang 'approved') hoặc **[Ẩn]** (chuyển sang 'hidden').
- Đây là bước lọc dữ liệu quan trọng trước khi đưa vào AI tóm tắt.

## 5. Định hướng AI Summarize (Giai đoạn sau)

- AI sẽ chỉ quét và tổng hợp dữ liệu từ các bình luận đã được **'approved'**.
- Đảm bảo nội dung tóm tắt luôn tích cực, đúng trọng tâm và không chứa từ ngữ độc hại.

---
*Chờ chỉ thị triển khai...*
