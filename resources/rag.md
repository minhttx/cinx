# Cơ chế RAG & Context Injection của Trợ lý AI CinX

Tài liệu này mô tả chi tiết cách CinX thu thập và xử lý dữ liệu để tư vấn phim, lịch chiếu và ghế ngồi cho khách hàng theo thời gian thực.

## 1. Tổng quan kiến trúc
CinX sử dụng mô hình **JIT (Just-In-Time) Context Injection**. Thay vì sử dụng Vector Database truyền thống (thường có độ trễ trong việc cập nhật dữ liệu rạp), CinX truy xuất dữ liệu trực tiếp từ Database quan hệ (Supabase/PostgreSQL) ngay tại thời điểm người dùng đặt câu hỏi.

## 2. Quy trình 5 bước xử lý yêu cầu

### Bước 1: Thu thập bối cảnh (Context Gathering)
Hàm `gatherAIContext` trong `ai.js` thực hiện truy vấn song song (Parallel Fetching) các nguồn dữ liệu sau:
- **Dữ liệu Phim**: Danh sách phim `showing` và `coming soon` từ bảng `movies`.
- **Dữ liệu Lịch chiếu**: Toàn bộ suất chiếu của các phim đang chiếu trong 7 ngày tới.
- **Dữ liệu Ghế trống**: Sử dụng Database Function `get_bulk_showtime_availability` để lấy số lượng ghế `available` thực tế cho từng suất chiếu.
- **Dữ liệu Xu hướng**: Thống kê 5 phim có số lượng đơn hàng `confirmed` nhiều nhất trong tuần qua.

### Bước 2: Phân tích người dùng (User Profiling)
Hệ thống phân tích lịch sử đặt vé (`booking_history`) của người dùng để trích xuất:
- **Thể loại yêu thích**: Đếm tần suất các tag `genre` từ các bộ phim người dùng đã xem.
- **Khung giờ vàng cá nhân**: Phân tích các đầu giờ `show_time` để biết người dùng thích xem sáng, chiều hay tối.

### Bước 3: Truy xuất lịch sử hội thoại (Short-term Memory)
Hàm `aiChatAPI.getChatHistory` lấy 10 tin nhắn gần nhất trong vòng 7 ngày. Điều này giúp CinX hiểu được các câu hỏi nối tiếp như: *"Còn suất nào muộn hơn không?"* (AI sẽ biết "suất" ở đây là của bộ phim đã đề cập ở câu trước).

### Bước 4: Xây dựng Prompt động (Prompt Engineering)
Hệ thống tổng hợp tất cả dữ liệu thành một cấu trúc tin nhắn gửi đến AI (Llama 3.2 hoặc Gemini 1.5):
1. **System Instruction**: Chỉ dẫn về tính cách, quy tắc biểu cảm (Icon) và quy tắc bán hàng.
2. **Data Context**: Một đoạn tóm tắt trạng thái hệ thống dưới dạng văn bản:
   - *"User: Nguyễn Văn A, thích phim Hành động, thường xem lúc 19:00."*
   - *"Phim Hot: Dune 2, Đào Phở Piano."*
   - *"Suất chiếu: [Dune 2 - 19:00 (15 ghế trống), 21:00 (40 ghế trống)...]"*
3. **Chat History**: Các cặp tin nhắn User/Assistant trước đó.
4. **User Message**: Câu hỏi hiện tại của khách.

### Bước 5: Phản hồi Streaming (Inference & Output)
- AI xử lý dữ liệu và trả về kết quả dưới dạng **Streaming**.
- Nội dung được render bằng `react-markdown` để hiển thị bảng giá vé, danh sách phim hoặc in đậm các lưu ý quan trọng.

## 3. Các hàm API then chốt
- `movieAPI.getTrendingMovies()`: Xác định độ hot của phim.
- `showtimeAPI.getBulkShowtimeAvailability()`: Đảm bảo AI không tư vấn các suất chiếu đã hết vé.
- `aiChatAPI.saveChatMessage()`: Lưu trữ "ký ức" cho các lần chat sau.

## 4. Ưu điểm của cơ chế này
- **Độ chính xác 100%**: AI luôn biết chính xác còn bao nhiêu ghế trống tại thời điểm chat.
- **Tính cá nhân hóa**: Gợi ý phim dựa đúng gu của khách hàng.
- **Tốc độ**: Sử dụng RPC (Remote Procedure Call) để xử lý hàng ngàn bản ghi ghế ngồi chỉ trong vài mil giây.
