```sql
-- Hàm SQL thực hiện sinh ghế cho một suất chiếu với logic lấy giá từ bảng prices
-- Cấu trúc: 8 hàng (A-H), A-G 12 ghế, H 6 ghế đôi.
-- Chạy lệnh này trong Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.generate_seats_for_showtime(p_showtime_id UUID)
RETURNS integer AS $$
DECLARE
    row_char CHAR(1);
    seat_num VARCHAR(10);
    seat_type VARCHAR(20);
    seat_price NUMERIC;
    v_base NUMERIC;
    v_vip NUMERIC;
    v_couple NUMERIC;
    v_multiplier NUMERIC;
    inserted_count INTEGER := 0;
BEGIN
    -- 1. Lấy giá chuẩn từ bảng prices (Nguồn sự thật duy nhất)
    SELECT value INTO v_base FROM public.prices WHERE key = 'regular';
    SELECT value INTO v_vip FROM public.prices WHERE key = 'vip';
    SELECT value INTO v_couple FROM public.prices WHERE key = 'couple';
    
    -- Kiểm tra nếu thiếu cấu hình giá
    IF v_base IS NULL OR v_vip IS NULL OR v_couple IS NULL THEN
        RAISE EXCEPTION 'Chưa cấu hình đầy đủ giá vé trong bảng prices!';
    END IF;

    -- 2. Lấy multiplier thực tế từ suất chiếu (để tính giá cuối tuần/ngày lễ)
    SELECT (price / v_base) INTO v_multiplier FROM public.showtimes WHERE id = p_showtime_id;
    
    -- Nếu không tính được multiplier, mặc định là 1
    IF v_multiplier IS NULL THEN v_multiplier := 1; END IF;

    -- 3. Xóa các ghế cũ của suất chiếu này để làm sạch dữ liệu
    DELETE FROM public.seats WHERE showtime_id = p_showtime_id;
    
    -- 4. Vòng lặp sinh ghế: 8 hàng (A-H)
    FOR i IN 1..8 LOOP
        row_char := CHR(64 + i); -- A, B, C, D, E, F, G, H
        
        FOR j IN 1..12 LOOP
            -- Riêng hàng H chỉ có 6 ghế đôi (mỗi ghế chiếm 2 slot đơn)
            IF i = 8 AND j > 6 THEN CONTINUE; END IF;

            seat_num := row_char || j;
            
            -- Phân loại ghế dựa trên vị trí hàng
            IF i >= 6 AND i <= 7 THEN
                seat_type := 'vip'; 
                seat_price := v_vip;
            ELSIF i = 8 THEN
                seat_type := 'couple'; 
                seat_price := v_couple;
            ELSE
                seat_type := 'regular'; 
                seat_price := v_base;
            END IF;
            
            -- Thực hiện chèn dữ liệu ghế vào bảng seats
            INSERT INTO public.seats (
                showtime_id, 
                seat_number, 
                row_letter, 
                seat_index, 
                seat_type, 
                base_price, 
                price, 
                status,
                created_at,
                updated_at
            ) VALUES (
                p_showtime_id, 
                seat_num, 
                row_char, 
                j, 
                seat_type, 
                seat_price, 
                ROUND(seat_price * v_multiplier), 
                'available',
                NOW(),
                NOW()
            );
            
            inserted_count := inserted_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```