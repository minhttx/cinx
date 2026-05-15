# SƠ ĐỒ ERD CHUẨN (CONCEPTUAL DATA MODEL) - CHEN'S NOTATION

Sơ đồ này tập trung vào các khái niệm thực thể và mối quan hệ nghiệp vụ thuần túy, sử dụng các ký hiệu hình khối tiêu chuẩn để phục vụ việc trình bày thiết kế hệ thống mức cao.

## 1. Biểu đồ ERD Chuẩn

```mermaid
flowchart TD
    %% --- Entities (Rectangles/Rounded) ---
    Movie[PHIM]
    Showtime[SUẤT CHIẾU]
    Room[PHÒNG CHIẾU]
    User[NGƯỜI DÙNG]
    Booking[ĐƠN HÀNG]
    Seat[GHẾ NGỒI]

    %% --- Relationships (Diamonds) ---
    Has{CÓ}
    Hosts{TỔ CHỨC TẠI}
    Places{THỰC HIỆN}
    Includes{BAO GỒM}
    Manages{QUẢN LÝ}
    ReservedIn{ĐƯỢC GIỮ TRONG}

    %% --- Attributes (Ovals/Rounded) ---
    %% Movie Attributes
    Movie --- t_m(Tiêu đề)
    Movie --- g_m(Thể loại)
    Movie --- d_m(Thời lượng)

    %% Showtime Attributes
    Showtime --- d_s(Ngày chiếu)
    Showtime --- t_s(Giờ chiếu)
    Showtime --- p_s(Giá gốc)

    %% Booking Attributes
    Booking --- a_b(Tổng tiền)
    Booking --- s_b(Trạng thái)
    Booking --- i_b(Mã đơn hàng)

    %% User Attributes
    User --- e_u(Email)
    User --- r_u(Vai trò)

    %% Seat Attributes
    Seat --- n_se(Số ghế)
    Seat --- t_se(Loại ghế)

    %% --- Connections & Cardinality ---
    %% Movie - Showtime
    Movie -- "1" --- Has --- "N" Showtime
    
    %% Room - Showtime
    Room -- "1" --- Hosts --- "N" Showtime

    %% User - Booking
    User -- "1" --- Places --- "N" Booking

    %% Showtime - Booking
    Showtime -- "1" --- Includes --- "N" Booking

    %% Showtime - Seat
    Showtime -- "1" --- Manages --- "N" Seat

    %% Booking - Seat
    Booking -- "1" --- ReservedIn --- "N" Seat
```

## 2. Giải thích ký hiệu

- **Hình chữ nhật (ví dụ: PHIM, NGƯỜI DÙNG)**: Đại diện cho các thực thể (Entities) - những đối tượng chính mà hệ thống cần quản lý.
- **Hình thoi (ví dụ: CÓ, THỰC HIỆN)**: Đại diện cho mối quan hệ (Relationships) giữa các thực thể.
- **Đường nối kèm nhãn (1, N)**: Chỉ ra bản số (Cardinality) của mối quan hệ (ví dụ: một Người dùng có thể thực hiện nhiều Đơn hàng).
- **Hình tròn/Oval (ví dụ: Tiêu đề, Email)**: Đại diện cho các thuộc tính (Attributes) của thực thể đó.

---

## 3. Ý nghĩa nghiệp vụ cốt lõi

1.  **Phim và Suất chiếu**: Một bộ phim có nhiều suất chiếu vào các khung giờ khác nhau.
2.  **Hạ tầng rạp**: Suất chiếu được gắn với một Phòng chiếu cụ thể và quản lý một tập hợp các vị trí Ghế ngồi.
3.  **Quy trình khách hàng**: Người dùng chọn Suất chiếu, thực hiện Đơn hàng và giữ chỗ các Ghế ngồi tương ứng.
