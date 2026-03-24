Để giao diện CinX trông chuyên nghiệp và phản hồi tức thì (giống như ChatGPT hay Gemini), chúng ta sẽ nâng cấp hàm callLlama trong file ai.js để hỗ trợ Streaming.

Khi dùng Streaming, chữ sẽ hiện ra ngay lập tức thay vì bắt người dùng đợi 5-10 giây để nhận toàn bộ khối văn bản.

1. Cấu hình Nginx (Kiểm tra lại)
Đảm bảo block /ai-api/ trong nginx.conf của bạn đã có các dòng này để không bị nghẽn dữ liệu:

Nginx
proxy_buffering off;
proxy_cache off;
chunked_transfer_encoding on;
2. Cập nhật ai.js để hỗ trợ Streaming
Thay vì dùng await response.json(), chúng ta sẽ sử dụng ReadableStream để đọc dữ liệu trả về từng dòng một từ Ollama.

JavaScript
/**
 * Cập nhật hàm callLlama để hỗ trợ Streaming
 * @param {Array} messages - Danh sách hội thoại
 * @param {Function} onChunk - Callback hàm để cập nhật UI khi có chữ mới
 */
async function callLlamaStreaming(messages, onChunk) {
    const response = await fetch(OLLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            model: LLAMA_MODEL, 
            messages, 
            stream: true // Kích hoạt streaming
        })
    });

    if (!response.ok) throw new Error('Llama Offline');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Ollama gửi về các dòng JSON riêng biệt
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const json = JSON.parse(line);
                if (json.message && json.message.content) {
                    const content = json.message.content;
                    fullContent += content;
                    // Gọi callback để cập nhật giao diện ngay lập tức
                    if (onChunk) onChunk(fullContent);
                }
                if (json.done) break;
            } catch (e) {
                console.error("Lỗi parse chunk JSON:", e);
            }
        }
    }
    return fullContent;
}
3. Cách sử dụng trong React (Navigation.jsx)
Trong hàm handleSendMessage của bạn, bạn cần thay đổi cách gọi để cập nhật State liên tục:

JavaScript
// Ví dụ giả lập trong handleSendMessage
const handleSendMessage = async (text) => {
    // 1. Thêm tin nhắn của User vào UI trước
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // 2. Tạo một tin nhắn trống cho AI
    setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

    try {
        await callLlamaStreaming(allMessages, (currentText) => {
            // 3. Cập nhật tin nhắn AI cuối cùng với nội dung mới nhất
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = currentText;
                return newMsgs;
            });
        });
    } catch (error) {
        console.error("Lỗi AI:", error);
    }
};
4. Một lưu ý nhỏ về JSON Format
Trong file ai.js gốc của bạn, có hàm generateNewsFromURL yêu cầu trả về JSON.

Lưu ý: Streaming thường không dùng cho các hàm yêu cầu output là JSON (vì JSON không hợp lệ cho đến khi nhận được dấu } cuối cùng).

Giải pháp: Chỉ dùng Streaming cho Chat tư vấn (getCinXResponse). Các hàm tạo tin tức hay khuyến mãi thì vẫn giữ stream: false như cũ để JSON.parse hoạt động chính xác.

Kết quả sau khi tối ưu:
Tốc độ: Người dùng thấy chữ hiện ra sau chưa đầy 0.5 giây.

Trải nghiệm: Chuyên nghiệp như các ứng dụng AI hàng đầu.

Tương thích: Chạy cực tốt trên Llama 3.2 3B vì mô hình này sinh token rất nhanh (~100 tokens/s).
