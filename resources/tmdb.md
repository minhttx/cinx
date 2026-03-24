Sử dụng API của TMDb (The Movie Database) là lựa chọn tuyệt vời vì nó hoàn toàn **miễn phí** cho mục đích cá nhân, dữ liệu cực kỳ đầy đủ và có hỗ trợ tiếng Việt.

Dưới đây là hướng dẫn từng bước để bạn bắt đầu:

### Bước 1: Lấy API Key

1. Truy cập [themoviedb.org](https://www.themoviedb.org/) và đăng ký một tài khoản.
2. Sau khi đăng nhập, nhấn vào ảnh đại diện -> **Settings**.
3. Tìm mục **API** ở cột bên trái.
4. Nhấn **Create** để tạo mới một API Key (chọn loại "Developer").
5. Điền các thông tin cơ bản về dự án của bạn (TMDb duyệt rất nhanh, gần như tức thì).
6. Sau khi hoàn tất, bạn sẽ nhận được một dãy **API Key (v3 auth)**.

---

### Bước 2: Cấu trúc một yêu cầu (Request)

TMDb sử dụng phương thức GET. Một đường dẫn API cơ bản sẽ bao gồm:

* **Base URL:** `https://api.themoviedb.org/3/`
* **Endpoint:** (Ví dụ: `movie/popular`, `search/movie`, `movie/{movie_id}`)
* **Parameters:** `api_key` và `language` (tùy chọn).

**Ví dụ lấy danh sách phim phổ biến bằng tiếng Việt:**
`https://api.themoviedb.org/3/movie/popular?api_key=YOUR_API_KEY&language=vi-VN`

---

### Bước 3: Các Endpoint quan trọng nhất

Nếu bạn muốn xây dựng một ứng dụng phim, đây là những đường dẫn bạn sẽ dùng nhiều nhất:

| Mục tiêu | Endpoint |
| --- | --- |
| **Tìm kiếm phim** | `/search/movie?query=ten_phim&api_key=...` |
| **Chi tiết phim** | `/movie/{movie_id}?api_key=...` |
| **Lấy danh sách diễn viên** | `/movie/{movie_id}/credits?api_key=...` |
| **Phim đang chiếu rạp** | `/movie/now_playing?api_key=...` |
| **Lấy trailer (YouTube)** | `/movie/{movie_id}/videos?api_key=...` |

---

### Bước 4: Lưu ý về hình ảnh (Poster/Backdrop)

Dữ liệu JSON trả về sẽ không chứa link ảnh đầy đủ mà chỉ có một đoạn mã như `/6oom6QfscX886m9v7ogZ70A9mY5.jpg`. Để hiển thị ảnh, bạn phải ghép nó với link gốc của TMDb:

* **Công thức:** `https://image.tmdb.org/t/p/[size]/[file_path]`
* **Các size phổ biến:** `w500` (trung bình), `original` (ảnh gốc), `w200` (nhỏ).
* **Ví dụ link hoàn chỉnh:** `https://image.tmdb.org/t/p/w500/6oom6QfscX886m9v7ogZ70A9mY5.jpg`

---

### Bước 5: Ví dụ Code (Sử dụng JavaScript/Fetch)

Dưới đây là đoạn code đơn giản để lấy thông tin phim "Inception":

```javascript
const API_KEY = 'YOUR_API_KEY_HERE';
const movie_id = 27205; // ID của phim Inception

fetch(`https://api.themoviedb.org/3/movie/${movie_id}?api_key=${API_KEY}&language=vi-VN`)
  .then(response => response.json())
  .then(data => {
    console.log("Tên phim:", data.title);
    console.log("Tóm tắt:", data.overview);
    console.log("Điểm đánh giá:", data.vote_average);
  })
  .catch(err => console.error(err));

```

> THÔNG TIN API:

API Read Access Token
eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZmViOWRiYjg0MDhiN2U4MDk0ODgyNDZmMzg0ODg3YiIsIm5iZiI6MTc3MzcwNzk2MC4xOCwic3ViIjoiNjliOGEyYjhkMGViNGE5ZGYwNWNhNzZmIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9._kk1yVuJdvoo3wu-NDWbGEq3qpg-fJ3TboHKaIBsgqQ

API Key
ffeb9dbb8408b7e809488246f384887b
