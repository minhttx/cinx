```sql
-- Hàm SQL thực hiện xóa lịch chiếu và toàn bộ dữ liệu liên quan (Cascade Delete)
-- Chạy lệnh này trong Supabase SQL Editor

CREATE OR REPLACE FUNCTION clear_movie_showtimes_cascade(target_movie_id UUID)
RETURNS void AS $$
BEGIN
    -- 1. Xóa chi tiết ghế đặt (booking_seats) liên kết với các suất chiếu của phim này
    DELETE FROM public.booking_seats 
    WHERE seat_id IN (
        SELECT id FROM public.seats WHERE showtime_id IN (
            SELECT id FROM public.showtimes WHERE movie_id = target_movie_id
        )
    );

    -- 2. Xóa các đơn đặt vé (bookings) liên kết với các suất chiếu của phim này
    DELETE FROM public.bookings 
    WHERE showtime_id IN (
        SELECT id FROM public.showtimes WHERE movie_id = target_movie_id
    );

    -- 3. Xóa tất cả ghế (seats) của các suất chiếu phim này
    DELETE FROM public.seats 
    WHERE showtime_id IN (
        SELECT id FROM public.showtimes WHERE movie_id = target_movie_id
    );

    -- 4. Cuối cùng mới xóa các suất chiếu (showtimes)
    DELETE FROM public.showtimes WHERE movie_id = target_movie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```