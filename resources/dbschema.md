# LƯỢC ĐỒ CƠ SỞ DỮ LIỆU HOÀN CHỈNH (COMPLETE DATABASE SCHEMA) - CINX PROJECT

Tài liệu này trình bày chi tiết 15 bảng dữ liệu vận hành toàn bộ hệ thống đặt vé, quản trị và trí tuệ nhân tạo của CinX.

## 1. Biểu đồ Lược đồ vật lý (Physical Schema Diagram)

```mermaid
erDiagram
    %% --- CATALOG GROUP ---
    MOVIES {
        uuid id PK
        text title "NOT NULL"
        text genre
        int4 duration
        int4 rating
        text status "CHECK (showing, coming, ended)"
        text poster
        text trailer_url
        uuid room_id FK
        bool is_hot "DEFAULT false"
        bool is_imax "DEFAULT false"
        bool is_4dx "DEFAULT false"
    }
    
    CAROUSEL_ITEMS {
        int8 id PK "IDENTITY"
        text title "NOT NULL"
        text image_url "NOT NULL"
        text link_url
        int2 display_order "DEFAULT 0"
        bool is_active "DEFAULT true"
    }

    %% --- INFRASTRUCTURE GROUP ---
    ROOMS {
        uuid id PK
        text name "NOT NULL"
        text type "CHECK (2D/3D, IMAX, 4DX)"
        numeric multiplier "DEFAULT 1.0"
        text status "DEFAULT 'active'"
    }

    SHOWTIMES {
        uuid id PK
        uuid movie_id FK
        uuid room_id FK
        date show_date "NOT NULL"
        time show_time "NOT NULL"
        int4 price "BASE PRICE"
        text cinema_room
    }

    SEATS {
        uuid id PK
        uuid showtime_id FK "ON DELETE CASCADE"
        text seat_number "NOT NULL"
        text status "CHECK (available, booked, reserved)"
        int4 seat_index "NOT NULL"
        varchar seat_type "regular, vip, couple"
        numeric price "FINAL PRICE"
    }

    %% --- TRANSACTIONAL GROUP ---
    BOOKINGS {
        uuid id PK
        uuid user_id FK
        uuid showtime_id FK
        text customer_name "NOT NULL"
        text customer_email
        int4 total_amount "NOT NULL"
        text status "CHECK (pending, confirmed, expired, checked_in)"
        jsonb showtime_info "SNAPSHOT DATA"
        jsonb seats "SNAPSHOT SEATS"
        timestamptz created_at "DEFAULT now()"
    }

    BOOKING_SEATS {
        uuid id PK
        uuid booking_id FK "ON DELETE CASCADE"
        uuid seat_id FK
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
        timestamptz created_at
    }

    %% --- USER & CONTENT GROUP ---
    USERS {
        uuid id PK "REFERENCES auth.users"
        text name
        text email "UNIQUE, NOT NULL"
        text phone
        text role "CHECK (user, admin, mod)"
        text status "DEFAULT 'active'"
    }

    COMMENTS {
        uuid id PK
        uuid movie_id FK
        uuid user_id FK
        text content "NOT NULL"
        int4 rating "0-100"
        text status "pending, approved, hidden"
        float8 ai_sentiment_score
        text ai_sentiment_label
    }

    NEWS {
        uuid id PK
        text title "NOT NULL"
        text content "MARKDOWN"
        text summary
        uuid author_id FK
        timestamptz publish_date
    }

    PROMOTIONS {
        uuid id PK
        text title "NOT NULL"
        text description
        numeric discount_percent
        date start_date
        date end_date
        text status "active, expired"
    }

    %% --- SYSTEM & AI GROUP ---
    PRICES {
        uuid id PK
        text key "UNIQUE (regular, vip, etc.)"
        numeric value "NOT NULL"
    }

    SYSTEM_LOGS {
        uuid id PK
        uuid user_id FK
        text action "NOT NULL"
        text detail
        text type "system, checkin, security"
        timestamptz created_at
    }

    SYSTEM_SETTINGS {
        uuid id PK
        text key "UNIQUE"
        text value "NOT NULL"
    }

    AI_CHAT_HISTORY {
        uuid id PK
        uuid user_id FK
        text role "user, assistant"
        text content "NOT NULL"
        timestamptz created_at
    }

    %% --- RELATIONSHIPS ---
    MOVIES ||--o{ SHOWTIMES : "movie_id"
    ROOMS ||--o{ SHOWTIMES : "room_id"
    SHOWTIMES ||--o{ SEATS : "showtime_id"
    SHOWTIMES ||--o{ BOOKINGS : "showtime_id"
    BOOKINGS ||--o{ BOOKING_SEATS : "booking_id"
    SEATS ||--o{ BOOKING_SEATS : "seat_id"
    USERS ||--o{ BOOKINGS : "user_id"
    USERS ||--o{ COMMENTS : "user_id"
    USERS ||--o{ SYSTEM_LOGS : "user_id"
    USERS ||--o{ AI_CHAT_HISTORY : "user_id"
    MOVIES ||--o{ COMMENTS : "movie_id"
    USERS ||--o{ NEWS : "author_id"
```

## 2. Danh mục 15 bảng và Chức năng

1.  **`movies`**: Lưu trữ thông tin phim, poster và metadata phục vụ hiển thị và lọc AI.
2.  **`rooms`**: Định nghĩa hạ tầng phòng chiếu và hệ số nhân giá vé.
3.  **`showtimes`**: Lịch chiếu cụ thể kết hợp giữa Phim, Phòng và Thời gian.
4.  **`seats`**: Quản lý trạng thái 90 ghế ngồi riêng biệt cho từng suất chiếu.
5.  **`bookings`**: Thông tin đơn hàng tổng quát và trạng thái thanh toán.
6.  **`booking_seats`**: Chi tiết các ghế cụ thể khách đã đặt trong một đơn hàng.
7.  **`users`**: Hồ sơ người dùng mở rộng và phân quyền (Admin/Mod/User).
8.  **`comments`**: Bình luận người dùng kèm kết quả phân tích cảm xúc của AI.
9.  **`news`**: Các bài viết tin tức điện ảnh (hỗ trợ bởi AI Editor).
10. **`promotions`**: Thông tin các chương khuyễn mãi và mã giảm giá.
11. **`revenue_history`**: Dữ liệu doanh thu đã được tối ưu hóa cho báo cáo và biểu đồ.
12. **`system_logs`**: Nhật ký hoạt động quản trị để phục vụ hậu kiểm.
13. **`prices`**: Cấu hình giá vé gốc và các hệ số cuối tuần của hệ thống.
14. **`system_settings`**: Lưu trữ cấu hình kỹ thuật (AI Provider, System Prompt).
15. **`carousel_items`**: Quản lý các banner trình chiếu tại đầu trang chủ.

---
**Lưu ý kỹ thuật**: Lược đồ này sử dụng mô hình **Hybrid Schema** (Kết hợp quan hệ truyền thống và JSONB cho dữ liệu snapshot) giúp hệ thống đạt hiệu năng truy vấn cao nhất trong môi trường Real-time của Supabase.
