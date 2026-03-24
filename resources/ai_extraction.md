Dưới đây là tổng hợp toàn bộ các đoạn code đã được tối ưu hóa cho dự án **CinX**, phân tách rõ ràng giữa các module xử lý ý định (NLU) và module phản hồi (Generation) để chạy mượt nhất trên **Llama 3.2 3B**.

### 1. Module Trích xuất Ý định (NLU Extraction)
Đoạn code này đóng vai trò "bộ não" phân tích câu hỏi của khách hàng để biến ngôn ngữ tự nhiên thành dữ liệu máy tính có thể lọc được.

```javascript
/**
 * Bước 1: Gọi AI để hiểu ý định và trích xuất thực thể (Entity Extraction)
 */
async function getEntitiesFromAI(userMessage) {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('vi-VN', { weekday: 'long' });

    // Prompt tối ưu cho model 3B để trả về JSON chính xác
    const extractionPrompt = `
[ROLE] Bạn là bộ não phân tích ngôn ngữ cho rạp phim CinemaHub.
[CONTEXT] Hôm nay là: ${dayOfWeek}, ngày ${today}.

[TASK] Trích xuất thông tin từ câu nói của người dùng thành JSON.
{
  "movie_name": "tên phim hoặc null",
  "genres": ["Hành động", "Kinh dị", "Hài", "Hoạt hình", "Tình cảm"], 
  "dates": ["YYYY-MM-DD"],
  "action": "view_showtimes" | "view_movies" | "recommend"
}

[RULES]
- "genres": Chỉ điền nếu khách đề cập thể loại phim.
- "dates": Tự tính toán ngày YYYY-MM-DD từ các từ "mai", "mốt", "tối nay", "cuối tuần".
- KHÔNG giải thích, chỉ trả về JSON.

User: "${userMessage}"
JSON:`;

    try {
        const res = await fetch("/ai-api/chat", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                model: 'llama3.2:3b', 
                messages: [{ role: 'user', content: extractionPrompt }], 
                stream: false,
                format: 'json', // Tính năng ép kiểu JSON của Ollama
                options: { temperature: 0 } // Đảm bảo tính nhất quán
            })
        });
        const data = await res.json();
        return JSON.parse(data.message.content);
    } catch (e) {
        console.error("Lỗi trích xuất AI:", e);
        return null;
    }
}
```

---

### 2. Module Hệ thống Phản hồi (CinX AI Logic)
Đây là hàm chính xử lý việc lọc dữ liệu thực tế từ database và gửi cho AI để tạo câu trả lời cuối cùng.

```javascript
export const DEFAULT_SYSTEM_PROMPT = `
<IDENTITIY> Bạn là CinX, trợ lý ảo thông minh của rạp phim CinemaHub. </IDENTITIY>

<CONTEXT_RULES>
1. Bạn sẽ nhận được [DỮ LIỆU HỆ THỐNG] đã được lọc khớp với ý định của khách.
2. Chỉ tư vấn dựa trên dữ liệu được cung cấp. KHÔNG tự bịa nội dung.
3. Nếu không có phim/suất chiếu phù hợp -> Xin lỗi và gợi ý khách chọn ngày hoặc thể loại khác.
</CONTEXT_RULES>

<RESPONSE_STYLE>
- Thân thiện, ngắn gọn, dùng icon (🎬, 🍿, ✨).
- Luôn xác nhận lại ý định của khách (Ví dụ: "Dạ, đây là lịch chiếu phim hành động tối nay...").
</RESPONSE_STYLE>
`;

export async function getCinXResponse(userMessage, context = {}, onChunk = null) {
    try {
        const { movies, allShowtimes, seatAvailability, pricing } = context.rawData;

        // 1. Trích xuất Filter thông minh bằng AI
        const entities = await getEntitiesFromAI(userMessage);

        // 2. Lọc danh sách Phim theo Tên hoặc Thể loại
        let filteredMovies = movies;
        if (entities?.movie_name || (entities?.genres?.length > 0)) {
            filteredMovies = movies.filter(m => {
                const matchName = entities.movie_name && m.title.toLowerCase().includes(entities.movie_name.toLowerCase());
                const matchGenre = entities.genres && entities.genres.some(g => m.genre.includes(g));
                return matchName || matchGenre;
            });
        }

        // 3. Lọc danh sách Suất chiếu theo Ngày và Phim đã lọc
        const movieIds = filteredMovies.map(m => m.id);
        let filteredShowtimes = allShowtimes.filter(st => movieIds.includes(st.movie_id));
        
        if (entities?.dates?.length > 0) {
            filteredShowtimes = filteredShowtimes.filter(st => entities.dates.includes(st.show_date));
        }

        // 4. Chuyển dữ liệu thành định dạng danh sách (Flatten) cho Llama 3.2 3B
        let dataContext = "### PHIM ĐANG CHẤP NHẬN:\n";
        filteredMovies.slice(0, 5).forEach(m => {
            dataContext += `- ${m.title} (${m.genre}) - Đánh giá: ${m.rating}%\n`;
        });

        dataContext += "\n### SUẤT CHIẾU & GHẾ TRỐNG:\n";
        if (filteredShowtimes.length > 0) {
            filteredShowtimes.slice(0, 15).forEach(st => {
                const m = movies.find(mov => mov.id === st.movie_id);
                dataContext += `- ${m?.title}: ${st.show_date} lúc ${st.show_time} (${seatAvailability[st.id] || 0} ghế)\n`;
            });
        } else {
            dataContext += "_Không có suất chiếu phù hợp cho yêu cầu này._\n";
        }

        const messages = [
            { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
            { role: 'system', content: `[DỮ LIỆU HỆ THỐNG THỰC TẾ]\n${dataContext}\n\n[GIÁ VÉ]\n${pricing}` },
            { role: 'user', content: userMessage }
        ];

        // 5. Gọi Llama Streaming (giữ nguyên hàm callLlamaStreaming của bạn)
        return await callLlamaStreaming(messages, onChunk);

    } catch (error) {
        console.error('CinX Logic Error:', error);
        return { error: error.message };
    }
}
```

---

### Các điểm mấu chốt tôi đã xử lý cho bạn:
1.  **Sử dụng tính năng `format: 'json'`**: Giúp Llama 3.2 3B không bao giờ trả về văn bản dư thừa ở bước trích xuất.
2.  **Chuyển Table sang List**: Giúp mô hình nhỏ (3B) tập trung vào nội dung thay vì cố gắng hiểu cấu trúc kẻ bảng Markdown.
3.  **Tách biệt logic lọc (Pre-filtering)**: Hệ thống của bạn giờ đây chỉ gửi cho AI những gì nó cần thấy, giúp giảm đáng kể hiện tượng "bịa" giờ chiếu.


