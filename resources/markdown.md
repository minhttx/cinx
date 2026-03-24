Để biến các đoạn review phim và tư vấn từ CinX trở nên chuyên nghiệp (có in đậm, danh sách, bảng biểu), bạn cần thực hiện 2 bước: Cài đặt thư viện xử lý Markdown và cập nhật Component hiển thị tin nhắn.

Vì bạn đang dùng React cho dự án CinX, thư viện tiêu chuẩn và nhẹ nhất hiện nay là react-markdown.

1. Cài đặt thư viện
Mở terminal trong thư mục frontend của bạn và chạy:

Bash
# Nếu dùng npm
npm install react-markdown remark-gfm

# Nếu dùng podman/docker (chạy trực tiếp trong container app)
podman exec -it cinx-web npm install react-markdown remark-gfm
(Ghi chú: remark-gfm giúp hỗ trợ thêm Table, Checklist và URL tự động chuyển thành link).

2. Tạo Component MessageBubble.jsx
Thay vì hiển thị text thuần túy trong thẻ <div> hoặc <span>, hãy dùng component này để render nội dung từ Llama 3.2 hoặc Gemini:

JavaScript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ role, content }) => {
  const isAI = role === 'assistant' || role === 'system';

  return (
    <div className={`message-container ${isAI ? 'ai-msg' : 'user-msg'}`}>
      <div className="bubble-content">
        {isAI ? (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Tùy chỉnh cách hiển thị các thẻ HTML
              h3: ({node, ...props}) => <h3 style={{color: '#ebdbb2', margin: '10px 0'}} {...props} />,
              strong: ({node, ...props}) => <strong style={{color: '#fe8019'}} {...props} />,
              table: ({node, ...props}) => (
                <div style={{overflowX: 'auto'}}>
                  <table style={{border: '1px solid #665c54', borderCollapse: 'collapse'}} {...props} />
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

3. Kết hợp với Streaming (ai.js)
Bây giờ, khi bạn dùng hàm callLlamaStreaming mà chúng ta vừa viết, nội dung sẽ được render "sống" theo thời gian thực.

Ví dụ kết quả CinX phản hồi:

CinX: 🎬 Chào bạn! Dưới đây là các suất chiếu Trending tối nay:

Đào, Phở và Piano - 19:00 (🔥 Còn 5 ghế)

Mai - 19:30 (💎 Ghế VIP còn trống)

Nhấn [Đặt vé] để mình giữ chỗ cho bạn nhé! 🍿
