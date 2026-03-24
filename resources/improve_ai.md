# Kế hoạch Nâng cấp Năng lực Tư vấn của CinX AI

Tài liệu này đề xuất các bước cải tiến kỹ thuật để khắc phục tình trạng AI (Llama 3.2) trả lời chung chung và tối ưu hóa việc sử dụng dữ liệu thực tế từ hệ thống.

## 1. Mục tiêu
- Biến CinX từ một chatbot trả lời dựa trên phỏng đoán thành một trợ lý chính xác 100% dựa trên dữ liệu thực.
- Tối ưu hóa hiệu suất của mô hình Llama 3.2 (3B) trong môi trường tài nguyên giới hạn.
- Giảm thiểu hiện tượng "ảo giác" (hallucination) của AI.

## 2. Các giải pháp kỹ thuật đề xuất

### Giai đoạn 1: Phân loại Ý định (Intent Classification) & Nạp dữ liệu mục tiêu
Thay vì gửi toàn bộ dữ liệu rạp vào mỗi câu chat (gây nhiễu), hệ thống sẽ:
1. **Bước đệm**: Dùng một prompt cực ngắn để AI xác định người dùng đang hỏi về cái gì (Phim, Giá vé, Lịch chiếu, hay Tư vấn chung).
2. **Nạp dữ liệu trúng đích**:
   - Nếu hỏi về lịch chiếu: Chỉ nạp bảng lịch chiếu 24h tới.
   - Nếu hỏi về giá vé: Chỉ nạp bảng giá và chính sách khuyến mãi.
   - Nếu hỏi về phim: Nạp tóm tắt nội dung và điểm đánh giá.

### Giai đoạn 2: Cấu trúc hóa Context (Structured Data Injection)
Chuyển đổi dữ liệu từ dạng văn bản thô sang dạng cấu trúc mà LLM nhỏ dễ xử lý:
- **Markdown Tables**: Sử dụng bảng Markdown cho lịch chiếu và ghế trống. Llama 3.2 xử lý dạng bảng cực kỳ chính xác so với văn bản liệt kê.
- **JSON Snippets**: Cung cấp các đoạn JSON ngắn cho các thông số kỹ thuật (thời lượng, định dạng IMAX/4DX).

### Giai đoạn 3: Giả lập Function Calling (Tool Use)
Cấp cho AI quyền "yêu cầu" dữ liệu khi cần thiết:
1. AI trả về một mã đặc biệt, ví dụ: `[CALL: get_available_seats(showtime_id="abc")]`.
2. Phía Client (JavaScript) bắt mã này, thực hiện truy vấn Supabase.
3. Gửi kết quả ngược lại cho AI để nó tổng hợp câu trả lời cuối cùng.

### Giai đoạn 4: Tích hợp Web Context Provider (Đọc URL cho AI Offline)
Giải quyết vấn đề AI không có internet khi soạn thảo tin tức/khuyến mãi:
1. **Proxy Extraction**: Sử dụng dịch vụ trung gian (ví dụ: `r.jina.ai`) để cào nội dung từ URL mà Admin cung cấp.
2. **Markdown Conversion**: Biến trang web phức tạp thành văn bản Markdown sạch sẽ (loại bỏ quảng cáo, menu).
3. **Content Feeding**: Gửi trực tiếp toàn bộ văn bản đã trích xuất vào Prompt cho Llama 3.2 thay vì chỉ gửi URL.
Jina API key (đưa vào .env): jina_4fd6e09603bb4e198a9489077f4cc066gqlIuofSow0xflyWYhgXyGqbrI38

## 3. Lộ trình thực hiện (Implementation Roadmap)

### Bước 1: Cập nhật `ai.js` (Phân loại ý định)
- Thêm hàm `detectIntent(userMessage)` để trả về tag ý định.
- Chỉnh sửa `getCinXResponse` để chọn lọc context dựa trên kết quả của `detectIntent`.

### Bước 2: Chuẩn hóa định dạng Context
- Viết lại hàm `gatherAIContext` để trả về dữ liệu dưới dạng bảng Markdown sạch sẽ.
- Giới hạn số lượng bản ghi (ví dụ: chỉ lấy 5 phim trending nhất thay vì toàn bộ).

### Bước 3: Tinh chỉnh System Prompt
- Cập nhật `DEFAULT_SYSTEM_PROMPT` để yêu cầu AI: "Nếu thông tin trong bảng dữ liệu không có, hãy trả lời là không biết hoặc yêu cầu người dùng cung cấp thêm thông tin, tuyệt đối không tự bịa ra suất chiếu".

### Bước 4: Triển khai Web Scraper cho Admin Panel
- Cập nhật `NewsManagement` và `PromotionsManagement`.
- Khi bấm "AI Writing", hệ thống sẽ gọi API trung gian để lấy nội dung từ URL trước khi gửi cho AI.

### Bước 5: Kiểm thử với Llama 3.2
- Chạy các kịch bản kiểm thử (Test Cases):
  - "Tối nay 19h có phim gì?" -> Phải trả về đúng phim và số ghế trống.
  - "Viết bài từ link báo Thanh Niên này" -> AI phải tóm tắt đúng nội dung bài báo mặc dù nó không có internet.

## 4. Kết quả mong đợi
- Tốc độ phản hồi nhanh hơn (do Prompt ngắn hơn).
- Độ tin cậy cao: AI không còn tư vấn các suất chiếu không tồn tại.
- Trải nghiệm người dùng chuyên nghiệp: Thông tin rõ ràng, minh bạch.

---
*Tài liệu được soạn thảo bởi CinX Engineering Team.*
