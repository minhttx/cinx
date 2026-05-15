# LƯỢC ĐỒ CƠ SỞ DỮ LIỆU VẬT LÝ (PHYSICAL DATABASE SCHEMA)

Tài liệu này mô tả cấu trúc chi tiết các bảng, kiểu dữ liệu và các ràng buộc trong cơ sở dữ liệu PostgreSQL (Supabase) của hệ thống CinX.

## 1. Lược đồ vật lý (Mermaid Diagram)

```mermaid
erDiagram
    MOVIES {
        uuid id PK "uuid_generate_v4()"
        text title "NOT NULL"
        text genre
        int4 duration
        int4 rating
        text status "CHECK (showing, coming, ended)"
        date release_date
        text poster
        text description
        uuid room_id FK "REFERENCES rooms(id)"
        bool is_hot "DEFAULT false"
        bool is_imax "DEFAULT false"
        bool is_4dx "DEFAULT false"
        timestamptz created_at
    }

    ROOMS {
        uuid id PK
        text name "NOT NULL"
        text type "NOT NULL"
        numeric multiplier "DEFAULT 1.0"
        text status "DEFAULT 'active'"
    }

    SHOWTIMES {
        uuid id PK
        uuid movie_id FK "REFERENCES movies(id)"
        uuid room_id FK "REFERENCES rooms(id)"
        date show_date "NOT NULL"
        time show_time "NOT NULL"
        text cinema_room
        int4 price "DEFAULT 75000"
    }

    SEATS {
        uuid id PK
        uuid showtime_id FK "REFERENCES showtimes(id) ON DELETE CASCADE"
        text seat_number "NOT NULL"
        text row_letter "NOT NULL"
        text status "CHECK (available, booked, reserved)"
        int4 seat_index "NOT NULL"
        varchar seat_type "DEFAULT 'regular'"
        numeric price "NOT NULL"
    }

    BOOKINGS {
        uuid id PK
        uuid user_id FK "REFERENCES auth.users(id)"
        uuid showtime_id FK "REFERENCES showtimes(id)"
        text customer_name "NOT NULL"
        text customer_email
        text customer_phone
        int4 total_amount "NOT NULL"
        text status "CHECK (pending, confirmed, expired, checked_in)"
        jsonb showtime_info "DEFAULT '{}'"
        jsonb seats "DEFAULT '[]'"
        timestamptz booking_date "DEFAULT now()"
    }

    BOOKING_SEATS {
        uuid id PK
        uuid booking_id FK "REFERENCES bookings(id) ON DELETE CASCADE"
        uuid seat_id FK "REFERENCES seats(id)"
        varchar seat_number "NOT NULL"
        numeric seat_price "NOT NULL"
    }

    REVENUE_HISTORY {
        uuid id PK
        uuid booking_id FK
        text movie_title "NOT NULL"
        text room_name
        int4 amount "NOT NULL"
        int4 seats_count "NOT NULL"
        timestamptz created_at "DEFAULT now()"
    }

    COMMENTS {
        uuid id PK
        uuid movie_id FK "REFERENCES movies(id)"
        uuid user_id FK "REFERENCES users(id)"
        text content "NOT NULL"
        int4 rating "CHECK (0..100)"
        text status "DEFAULT 'pending'"
        float8 ai_sentiment_score
        text ai_sentiment_label
    }

    %% Physical Links
    MOVIES ||--o{ SHOWTIMES : "movie_id"
    ROOMS ||--o{ SHOWTIMES : "room_id"
    SHOWTIMES ||--o{ SEATS : "showtime_id"
    SHOWTIMES ||--o{ BOOKINGS : "showtime_id"
    BOOKINGS ||--o{ BOOKING_SEATS : "booking_id"
    SEATS ||--o{ BOOKING_SEATS : "seat_id"
```

## 2. Đặc tả các kiểu dữ liệu đặc biệt

- **`uuid`**: Sử dụng cho khóa chính để đảm bảo tính duy nhất trên toàn cầu, đặc biệt hữu ích cho việc đồng bộ dữ liệu với Supabase Auth.
- **`jsonb`**: Lưu trữ dữ liệu dạng JSON đã được tối ưu hóa (Binary JSON). Trường `showtime_info` sử dụng kiểu này để lưu snapshot thông tin phim, suất chiếu và danh sách ghế tại thời điểm giao dịch, giúp truy vấn lịch sử nhanh mà không cần Join.
- **`timestamptz`**: Lưu trữ thời gian kèm theo thông tin múi giờ (Timezone), đảm bảo tính chính xác khi hiển thị giờ chiếu cho người dùng ở các vùng khác nhau.

## 3. Các ràng buộc và logic Cascade

- **`ON DELETE CASCADE` (Bảng SEATS & BOOKING_SEATS)**: 
    - Khi một `SHOWTIME` bị xóa, toàn bộ 90 ghế tương ứng trong bảng `SEATS` sẽ tự động bị xóa theo.
    - Khi một `BOOKING` bị xóa, các dòng chi tiết ghế trong `BOOKING_SEATS` cũng sẽ bị xóa tự động để tránh rác dữ liệu.
- **`CHECK Constraints`**: 
    - Đảm bảo trạng thái đơn hàng (`status`) chỉ được nhận các giá trị hợp lệ.
    - Đảm bảo điểm đánh giá phim (`rating`) luôn nằm trong khoảng 0-100.
