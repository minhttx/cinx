# Kế hoạch triển khai Chức năng Lấy thông tin phim tự động (CinX Movie Fetcher) - Đã hoàn thành

Sử dụng API từ TMDB (The Movie Database) để tự động hóa việc nhập liệu thông tin phim, giúp Admin tiết kiệm thời gian và đảm bảo dữ liệu chính xác.

## 1. Nâng cấp Hệ thống Điểm số (Rating System) - Đã xong

Chuyển đổi thang điểm từ 1-10 (số thực) sang 1-100 (số nguyên - phần trăm) để đồng bộ với tiêu chuẩn của các trang đánh giá quốc tế và dữ liệu TMDB.

- **Database:** Cập nhật cột `rating` trong bảng `movies` và `comments` sang kiểu `integer`.
- **Giao diện:** 
    - Hiển thị điểm dạng `85%` thay vì `8.5`.
    - Star Rating (10 sao) mỗi sao tương ứng với 10%.

## 2. Nâng cấp Hệ thống Phân loại (Classification) - Đã xong

Thay thế hệ thống phân loại cứng (P, K, T13...) bằng hệ thống linh hoạt dựa trên dữ liệu TMDB.

- **UI Admin:** Chuyển Dropbox chọn xếp loại thành Textbox để hỗ trợ các nhãn quốc tế (PG-13, R, NC-17...).
- **UI Người dùng:** Tự động hiển thị nhãn xếp loại trong Badge với màu sắc mặc định nếu không khớp với các nhãn cũ.

## 3. Tầng Dịch vụ (services/tmdb.js) - Cải tiến

- `getFullMovieDetails(tmdbId)`: 
    - Lấy thông tin chi tiết bằng tiếng Việt.
    - Truy xuất danh sách diễn viên.
    - Truy xuất video (Trailer/Teaser) từ YouTube (không giới hạn ngôn ngữ để đảm bảo luôn có kết quả).
    - Truy xuất `release_dates` để lấy thông tin xếp loại (Certification) từ VN hoặc US.

## 4. Quy trình thực hiện tại Slide Drawer (Admin)

1.  **Nhập liệu:** Admin nhập "Tên phim" vào ô tương ứng.
2.  **Kích hoạt:** Nhấn nút **"Auto-fill"** (biểu tượng `auto_fix`).
3.  **Tự động điền (Auto-fill):**
    - `duration`: Lấy từ `runtime`.
    - `release_date`: Lấy từ `release_date`.
    - `genre`: Lấy từ mảng `genres`.
    - `poster`: Lấy `poster_path`.
    - `rating`: Lấy `vote_average * 10`.
    - `actors`: Lấy danh sách `cast`.
    - `trailer_url`: Tự động tìm Trailer YouTube phù hợp nhất.
    - `age`: Tự động điền nhãn phân loại (PG-13, R...).
    - `description`: Lấy từ `overview`.

---
*Hệ thống Movie Fetcher đã sẵn sàng hoạt động.*
