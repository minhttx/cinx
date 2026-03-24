# BÁO CÁO ĐỒ ÁN TỐT NGHIỆP: HỆ THỐNG ĐẶT VÉ XEM PHIM THÔNG MINH CINX (AI-POWERED)

![Home](home.png)

![Movies](movies.png)

![Booking](booking.png)

![News](news.png)

![Chatbot](chatbot.png)

![Admin](admin.png)

## 1. TỔNG QUAN CÔNG NGHỆ (TECH STACK)

Dự án được xây dựng dựa trên kiến trúc hiện đại, tối ưu hóa cho trải nghiệm người dùng và khả năng mở rộng.

### 1.1. Frontend
*   **React.js (v18):** Thư viện chính xây dựng giao diện người dùng.
*   **Redux:** Quản lý trạng thái ứng dụng (state management), đặc biệt là quy trình đặt vé và sơ đồ ghế.
*   **React Router DOM (v6):** Điều hướng đa trang và quản lý tham số URL.
*   **Material Design 3 (M3):** Hệ thống ngôn ngữ thiết kế (Design System) hiện đại từ Google, áp dụng qua Vanilla CSS.
*   **React Markdown & Remark GFM:** Xử lý hiển thị nội dung định dạng Markdown từ AI.
*   **Lucide Icons & Material Symbols:** Hệ thống biểu tượng trực quan cho giao diện.

### 1.2. Backend & Infrastructure
*   **Supabase (BaaS):** 
    *   **PostgreSQL:** Cơ sở dữ liệu quan hệ lưu trữ Phim, Suất chiếu, Ghế, Giao dịch.
    *   **Supabase Auth:** Quản lý định danh người dùng.
    *   **Supabase Storage:** Lưu trữ hình ảnh poster phim và carousel.
    *   **Database RPC (Remote Procedure Call):** Tối ưu hóa các truy vấn phức tạp (tính toán ghế trống, xóa cascade).
*   **Nginx:** Đóng vai trò Reverse Proxy, cân bằng tải và bảo mật các cổng kết nối.
*   **Podman/Docker:** Đóng gói ứng dụng vào container để dễ dàng triển khai.

### 1.3. Trí tuệ nhân tạo (AI Engine)
CinX xây dựng một hạ tầng AI lai (Hybrid AI Architecture), kết hợp giữa sức mạnh tính toán cục bộ và các dịch vụ đám mây chuyên biệt để tối ưu hóa chi phí, tốc độ và độ bảo mật.

*   **Ollama - Local LLM Runtime:** 
    - Hệ thống sử dụng **Ollama** chạy trong một container biệt lập trong hạ tầng Podman. Việc triển khai Local LLM giúp rạp phim làm chủ hoàn toàn dữ liệu, không phụ thuộc vào Internet cho các tác vụ tư vấn cơ bản và tiết kiệm 100% chi phí API so với các giải pháp thương mại.
    - **Model chính: Llama 3.2 (3B):** Đây là mô hình ngôn ngữ nhỏ (Small Language Model) tối ưu nhất hiện nay. Với tham số 3B, nó đủ nhẹ để chạy mượt mà trên hạ tầng nội bộ nhưng vẫn sở hữu khả năng suy luận mạnh mẽ (Reasoning) để thực hiện các tác vụ NLU phức tạp và viết Markdown chuẩn xác.
*   **Kiến trúc Multi-Provider:** 
    - Hệ thống được thiết kế với tính linh hoạt cao thông qua biến `OLLAMA_MODELS`. Ngoài mô hình chạy cục bộ, CinX còn tích hợp sẵn khả năng gọi đến **Gemini-3-flash** qua Proxy Cloud cho các tác vụ cần độ thông minh cực cao hoặc khi hạ tầng cục bộ quá tải. 
    - Một cơ chế **Provider Switching** được xây dựng trong `ai.js`, cho phép hệ thống tự động chuyển đổi giữa các mô hình mà không cần thay đổi logic ứng dụng.
*   **Jina AI - Web Intelligence:** 
    - CinX tích hợp **Jina AI Reader API** để giải quyết bài toán "kiến thức ngoài hệ thống". Jina AI đóng vai trò như một bộ chuyển đổi, biến mọi URL tin tức phức tạp thành định dạng Markdown tinh gọn. 
    - Điều này cho phép LLM "đọc" được các bài báo review phim mới nhất trên mạng và tóm tắt lại cho Admin, tạo ra một quy trình cập nhật nội dung tự động hóa hoàn toàn.
*   **Nginx Proxy & Streaming Optimization:** 
    - Mọi yêu cầu AI được định tuyến qua **Nginx Proxy** với cấu hình `proxy_buffering off`. Điều này cực kỳ quan trọng để hỗ trợ kỹ thuật **Server-Sent Events (SSE)**, giúp dữ liệu từ AI Engine có thể "chảy" về giao diện người dùng theo thời gian thực (Streaming) ngay khi từng Token được sinh ra.
*   **Security & Isolation:** 
    - AI Engine được cô lập hoàn toàn trong mạng nội bộ của Podman (`cinx-network`). Chỉ có Nginx Proxy mới có quyền truy cập vào cổng 11434 của Ollama, đảm bảo ngăn chặn các cuộc tấn công từ chối dịch vụ (DoS) hoặc truy cập trái phép vào tài nguyên AI.

---

## 2. CÁC TÍNH NĂNG CHÍNH CỦA HỆ THỐNG

### 2.1. Dành cho người dùng (Customer Features)
*   **Khám phá phim:** Xem danh sách phim đang chiếu/sắp chiếu với bộ lọc thông minh.
*   **Hệ thống đề xuất (Smart Chips):**
    *   **Xu hướng:** Top 3 phim có lượt đặt vé cao nhất thực tế.
    *   **Đỉnh cao:** Lọc phim có Rating > 80%.
    *   **Dành cho bạn:** Đề xuất phim dựa trên sở thích cá nhân (Gu phim) trích xuất từ lịch sử đặt vé.
*   **Quy trình đặt vé siêu tốc:**
    *   Chọn suất chiếu theo ngày/phòng.
    *   Sơ đồ ghế thời gian thực (Ghế Thường, VIP, Couple).
    *   Thanh toán tích hợp qua cổng **VNPAY**.
*   **Quản lý cá nhân:** Xem lại vé đã đặt, lịch sử giao dịch và cập nhật thông tin thành viên.

### 2.2. Dành cho quản trị viên (Admin Panel)
*   **Dashboard Analytics:** Biểu đồ doanh thu, thống kê lượt đặt vé theo giờ và theo phim.
*   **Quản lý Suất chiếu tự động:** Thuật toán tự động sắp xếp lịch chiếu cả tuần dựa trên loại phòng (IMAX, 4DX, 2D) và độ "Hot" của phim.
*   **Kiểm soát nội dung:** Quản lý phim, tin tức, khuyến mãi và phê duyệt bình luận khách hàng.
*   **Hệ thống Check-in:** Quét mã vé để xác nhận vào rạp.

---

## 3. ĐIỂM NHẤN: TRÍ TUỆ NHÂN TẠO (AI INTEGRATION)

Đây là giá trị cốt lõi của đồ án, biến CinX từ một web đặt vé truyền thống thành một trợ lý ảo thực thụ.

### 3.1. Trợ lý ảo CinX (Chatbot)
Hệ thống AI của CinX không chỉ là một chatbot thông thường mà là một **Unified AI Orchestrator** được thiết kế để thay thế hoàn toàn các thao tác tìm kiếm và lọc dữ liệu thủ công.

*   **Cơ chế Just-In-Time RAG (Retrieval-Augmented Generation):** 
        Khác với kiến trúc RAG truyền thống dựa trên các tài liệu tĩnh và cơ sở dữ liệu vector, CinX triển khai cơ chế **Just-In-Time (JIT)**. Trong ngành rạp phim, dữ liệu (ghế trống, suất chiếu) thay đổi theo từng giây, việc sử dụng vector embeddings sẽ làm dữ liệu bị lỗi thời ngay lập tức. JIT RAG giải quyết vấn đề này bằng quy trình:
        1.  **Dữ liệu tươi (Live Data Fetching):** Ngay khi người dùng gửi tin nhắn, hàm `gatherAIContext` kích hoạt một quy trình thu thập dữ liệu song song (`Promise.all`) từ 5 API endpoints khác nhau. Điều này đảm bảo AI luôn làm việc với trạng thái thực tế nhất của rạp phim tại milli-giây đó.
        2.  **Tối ưu hóa tài nguyên qua PostgreSQL RPC:** Thay vì tải hàng chục nghìn bản ghi ghế về Frontend gây nghẽn băng thông, hệ thống sử dụng các hàm RPC (`get_detailed_seat_stats`) để thực hiện tính toán tổng hợp (aggregation) trực tiếp phía Server. Kết quả trả về chỉ là các con số thống kê nhỏ gọn (VIP: 5, Couple: 2, Center: 1), giúp AI nhận phản hồi nhanh và chính xác vượt qua giới hạn 1000 dòng của các hệ thống BaaS thông thường.
        3.  **Lọc dữ liệu đa tầng (Context Pruning):** Sau khi trích xuất thực thể (NLU), hệ thống không "bơm" toàn bộ dữ liệu vào Prompt (tránh lãng phí Token và gây nhiễu AI). Thay vào đó, nó thực hiện "cắt tỉa" ngữ cảnh: Chỉ những phim, những ngày và những suất chiếu khớp với yêu cầu của người dùng mới được đưa vào ngữ cảnh. Nếu dữ liệu quá ít, hệ thống sẽ tự động mở rộng sang các ngày lân cận (Soft Filtering) để AI luôn có phương án gợi ý.
        4.  **Làm giàu ngữ cảnh (Context Enrichment):** Hệ thống không chỉ gửi dữ liệu thô. Nó "bơm" thêm các thông tin thông minh như: Hệ số giá vé cuối tuần đã được tính toán sẵn, danh sách diễn viên, mô tả phim và đặc biệt là **3 bình luận gần nhất** của khách hàng khác. Điều này giúp AI có khả năng tư vấn "như người thật", biết dùng bằng chứng xã hội (Social Proof) để thuyết phục khách hàng.
        5.  **Cá nhân hóa sâu (User Profiling):** AI được cung cấp lịch sử đặt vé của người dùng để phân tích "Gu" phim (thể loại yêu thích). Nhờ đó, CinX có thể đưa ra các câu trả lời như: *"Dựa trên sở thích phim Hành động của bạn, mình thấy suất chiếu 19:00 hôm nay còn ghế VIP trung tâm cực đẹp nè!"*
*   **Bộ não xử lý (Multi-stage NLU & Orchestration):**
        CinX không gửi trực tiếp câu hỏi của người dùng tới LLM chính để tránh tình trạng AI "nói hươu nói vượn" (Hallucination). Thay vào đó, hệ thống vận hành một quy trình **Orchestration** 2 giai đoạn:
        1.  **Giai đoạn 1: Trích xuất thực thể (Fuzzy NLU):** 
            Hệ thống sử dụng một Agent chuyên biệt (thường là Llama 3.2 với Temperature = 0) để thực hiện nhiệm vụ **Entity Extraction**. Agent này có nhiệm vụ bóc tách các ý định (Intent) của người dùng thành cấu trúc JSON chuẩn hóa. Đặc biệt, hệ thống sở hữu logic **Date Normalization** mạnh mẽ:
            - Các từ ngữ mơ hồ như "mai", "mốt", "thứ 7 tới", "cuối tuần này" được hàm `calculateDatesFromText` tự động quy đổi thành danh sách các ngày chính xác định dạng `YYYY-MM-DD`.
            - Các khung giờ như "tối nay", "sáng sớm" được quy đổi thành các dải số (ví dụ: `start: 18, end: 23`).
            - **Robust JSON Parsing:** Để đối phó với việc AI đôi khi trả về mã Markdown dư thừa, hệ thống sử dụng các biểu thức chính quy (Regex) và logic "bracket matching" để trích xuất lõi JSON, đảm bảo quy trình không bị ngắt quãng bởi lỗi cú pháp.
        2.  **Giai đoạn 2: Điều phối ngữ cảnh (Context Orchestration):** 
            Sau khi có dữ liệu NLU, bộ điều phối (Orchestrator) thực hiện "nhúng" (Injected) các tầng dữ liệu vào `SYSTEM_PROMPT` theo cấu trúc:
            - **[DỮ LIỆU HỆ THỐNG]:** Danh sách phim và suất chiếu đã được lọc qua bộ lọc NLU (chỉ giữ lại những gì khách quan tâm).
            - **[GIÁ VÉ LINH HOẠT]:** Tự động tính toán giá vé dựa trên việc phát hiện thực thể "cuối tuần" (weekendMultiplier).
            - **[HỒ SƠ KHÁCH HÀNG]:** "Bơm" thông tin về tên và gu phim của khách để AI có tông giọng xưng hô phù hợp.
            - **[CHIẾN THUẬT BÁN HÀNG]:** Các chỉ thị ngầm (Hidden Instructions) yêu cầu AI phải hối thúc khi thấy ghế sắp hết hoặc gợi ý link khi thấy suất chiếu đẹp.
        3.  **Prompt Engineering chuyên sâu:** 
            Chúng ta sử dụng kỹ thuật **Few-shot Prompting** và **Chain-of-Thought (CoT)** ẩn để hướng dẫn AI trích xuất thực thể. AI được cung cấp các ví dụ mẫu về cách chuyển đổi ngôn ngữ đời thường sang dữ liệu máy tính, giúp độ chính xác của NLU đạt trên 95% ngay cả với các mô hình ngôn ngữ nhỏ chạy local.
*   **Cơ chế Phản hồi & Hiển thị (Interactive Streaming UI):**
        Giao diện chatbot của CinX được thiết kế để mang lại cảm giác phản hồi tức thì và tương tác hai chiều sâu sắc:
        1.  **Xử lý Streaming (Fetch Stream Reader):** 
            Hệ thống không sử dụng kiểu phản hồi Request-Response truyền thống (phải đợi AI viết xong toàn bộ mới hiển thị). Thay vào đó, chúng ta triển khai `ReadableStream` thông qua giao thức Fetch. Kết quả từ Ollama được bóc tách theo từng cụm dữ liệu (chunks) và cập nhật trực tiếp vào State của React. Điều này tạo hiệu ứng chữ chạy thời gian thực, giúp giảm "độ trễ nhận thức" (Perceived Latency) và làm cho chatbot cảm giác "sống động" hơn.
        2.  **Hệ thống Hyperlink Thông minh (Actionable Links):** 
            Đây là điểm đột phá giúp rút ngắn quy trình trải nghiệm khách hàng (Customer Journey). Thông qua cấu hình `ReactMarkdown` tùy chỉnh và logic `urlTransform`, chúng ta đã "mở khóa" các giao thức URI không tiêu chuẩn:
            - **Giao thức `movie:ID`:** Khi AI nhắc đến tên phim, nó tự động bọc trong link `movie:UUID`. Giao diện Frontend lắng nghe và biến chúng thành các hyperlink vàng đặc trưng. Khi click, hệ thống gửi một `CustomEvent ('openMovieInfo')`, đóng chatbot và mở ngay Slide Drawer chi tiết phim mà không làm tải lại trang.
            - **Giao thức `showtime:ID:MOVIE_ID`:** Tương tự, các giờ chiếu được biến thành link hành động. Khi click, hệ thống không chỉ chuyển trang mà còn thực hiện "Auto-selection": Tự động chọn phim, tải danh sách suất chiếu, và nhảy thẳng vào bước **Chọn ghế** của suất chiếu đó. Quy trình này giúp người dùng đặt được vé chỉ sau 2 lần click từ cửa sổ chat.
        3.  **Markdown & GFM Rendering:** 
            Sử dụng `react-markdown` kết hợp với `remark-gfm` để hỗ trợ hiển thị các cấu trúc dữ liệu phức tạp như Bảng (Tables) và Danh sách (Lists). AI được chỉ dẫn luôn trình bày lịch chiếu dưới dạng bảng Markdown để khách hàng dễ dàng so sánh giữa các khung giờ và loại phòng.
        4.  **Thiết kế phân tầng (Z-Index Layering):** 
            Để đảm bảo chatbot luôn là ưu tiên tương tác số 1, cửa sổ chat được cấu hình `z-index: 3000` kết hợp với một lớp `nav-global-overlay` (`z-index: 2999`). Lớp phủ này sử dụng `backdrop-filter: blur(4px)` để làm mờ hậu cảnh, giúp người dùng tập trung hoàn toàn vào nội dung tư vấn của AI, đồng thời ngăn chặn các thao tác click nhầm vào các thành phần UI phía dưới.
        5.  **Chỉ dẫn hành động (CTA Engineering):** 
            AI được lập trình thông qua System Prompt để luôn kết thúc câu trả lời bằng một lời kêu gọi hành động (Call to Action) kèm theo hyperlink, ví dụ: *"Bạn có muốn đặt vé suất [19:00](showtime:...) ngay không?"*. Chiến thuật này làm tăng tỷ lệ chuyển đổi đặt vé thông qua chatbot một cách đáng kể.
*   **Xử lý lỗi & Dự phòng (Robustness):** 
    *   **Lỗi Parsing JSON:** Sử dụng Regex để bóc tách JSON ngay cả khi AI trả về định dạng sai (Markdown-wrapped).
    *   **Seat Fallback:** Tự động cung cấp số lượng ghế mặc định nếu database chưa cập nhật, tránh việc AI báo "Hết vé" sai sự thật.
    *   **Soft Filtering:** Nếu không tìm thấy suất chiếu khớp 100%, hệ thống sẽ gửi gợi ý các ngày gần nhất để AI tư vấn phương án thay thế thay vì báo "không tìm thấy".
    *   **Z-Index Management:** Đảm bảo cửa sổ chat luôn nằm trên cùng (`z-index: 3000`) để không bị che bởi các layer khác trong luồng đặt vé.

### 3.2. AI trong Quản trị (Admin Intelligence Tools)
CinX tích hợp AI sâu vào quy trình vận hành để biến Admin Panel thành một trung tâm điều khiển thông minh, giúp giảm tải 90% công việc sáng tạo nội dung thủ công.

*   **Hệ thống AI Writing (Sáng tạo nội dung tự động):** 
    Admin có thể tạo ra các bài viết tin tức hoặc chiến dịch khuyến mãi chất lượng cao chỉ trong vài giây thông qua 2 cơ chế:
    1.  **Web-to-Content Integration (via Jina AI):** Khi Admin dán một URL bài báo (ví dụ từ VnExpress hay Rotten Tomatoes), hệ thống sử dụng **Jina AI** để "cào" (Scrape) nội dung thô và lọc bỏ quảng cáo. Sau đó, nội dung này được gửi tới LLM với một Prompt chuyên biệt để: Tóm tắt lại, dịch sang tiếng Việt (nếu cần), và định dạng lại theo phong cách của rạp CinX (Markdown, kèm icon).
    2.  **Creative Text Generation:** Admin chỉ cần nhập một ý tưởng ngắn (ví dụ: "Viết bài giới thiệu phim Mai"), AI sẽ tự động đề xuất:
        - **Tiêu đề (Title):** Thu hút, chuẩn SEO.
        - **Mô tả ngắn (Description):** Mang tính "giật gân" (FOMO) để kích thích người dùng bấm vào xem.
        - **Nội dung chính:** Được cấu trúc chuyên nghiệp bằng Markdown với các thẻ H1, H2, Bold linh hoạt.
*   **Quản lý Prompt Hệ thống (Dynamic Agent Configuration):** 
    Đây là tính năng cho phép Admin thay đổi "linh hồn" của chatbot mà không cần lập trình viên can thiệp:
    - **Live Prompt Editor:** Giao diện cho phép Admin chỉnh sửa trực tiếp `SYSTEM_PROMPT` trong cơ sở dữ liệu Supabase. 
    - **Immediate Effect:** Ngay khi lưu, chatbot CinX sẽ thay đổi tính cách, tông giọng (ví dụ: từ "nghiêm túc" sang "vui vẻ, xì-tin") và các quy tắc ưu tiên bán hàng ngay lập tức.
*   **Hệ thống Phê duyệt & Kiểm soát (Moderation):** 
    AI hỗ trợ Admin trong việc đánh giá mức độ tích cực/tiêu cực của các bình luận khách hàng (Sentiment Analysis), giúp Admin nhanh chóng phê duyệt các bình luận tốt để đưa vào Context của RAG, tạo hiệu ứng đám đông cho phim.
*   **Tối ưu hóa Quy trình (Workflow Efficiency):** 
    Thay vì phải mở nhiều tab để tìm ảnh, soạn bài, định dạng code... Admin chỉ cần thao tác trong một Slide Drawer duy nhất có tích hợp trợ lý AI. Kết quả từ AI trả về dưới dạng cấu trúc dữ liệu (JSON) giúp hệ thống tự động điền (Auto-fill) các trường thông tin trong database, đảm bảo tính nhất quán dữ liệu.

---

## 4. PHÂN TÍCH KỸ THUẬT CHUYÊN SÂU

### 4.1. Thuật toán Sắp xếp Lịch chiếu Tuần (Weekly Scheduler)
Hệ thống sử dụng một thuật toán lập lịch thông minh giúp Admin tiết kiệm thời gian quản lý:
1.  **Phân bổ dựa trên công nghệ phòng (Resource Mapping):** Tự động gán phim định dạng IMAX/4DX vào các phòng máy tương ứng. Phim thường được đưa vào nhóm phòng 2D/3D.
2.  **Chiếm dụng giờ vàng (The Hijack Logic):** Thuật toán xác định khung giờ vàng (19:00) hàng ngày. Nếu rạp có phim được đánh dấu "Hot", phim này sẽ tự động thay thế suất chiếu của các phim khác tại giờ vàng trên toàn bộ các phòng thường để tối ưu hóa doanh thu.
3.  **Hệ số giá động:** Giá vé được tính toán tự động dựa trên: `(Giá gốc * Hệ số phòng * Hệ số cuối tuần)`.

### 4.2. Quy trình Thanh toán VNPAY (Payment Integration)
Tích hợp mô hình thanh toán an toàn qua cổng VNPAY Sandbox:
1.  **Khởi tạo đơn hàng:** Hệ thống tạo bản ghi `booking` trạng thái `pending` và tính toán `secure hash` (HMACSHA512) để gửi yêu cầu sang VNPAY.
2.  **Xử lý phản hồi (IPN & Return):** 
    *   **Return URL:** Nhận kết quả từ VNPAY để hiển thị thông báo ngay lập tức cho người dùng.
    *   **IPN (Instant Payment Notification):** Cập nhật trạng thái giao dịch trực tiếp từ máy chủ VNPAY vào database của hệ thống, đảm bảo dữ liệu đơn hàng luôn chính xác ngay cả khi người dùng đóng trình duyệt đột ngột.
3.  **Tự động giữ chỗ:** Ghế được giữ trạng thái `booked` trong 15 phút (thông qua Countdown Timer). Nếu quá thời gian thanh toán, hệ thống tự động giải phóng ghế để người khác có thể đặt.

---

## 5. KIẾN TRÚC DỮ LIỆU VÀ TỐI ƯU HÓA
*   **Vượt giới hạn 1000 dòng:** Sử dụng PostgreSQL RPC (`get_detailed_seat_stats`) để tính toán ghế trống cho hàng trăm suất chiếu cùng lúc, đảm bảo dữ liệu AI tư vấn luôn chính xác 100% mà không bị cắt cụt dữ liệu.
*   **Xử lý Streaming:** Phản hồi của AI được gửi về dưới dạng stream (từng chữ), tạo cảm giác tương tác tức thì như ChatGPT.
*   **Bảo mật:** Quản lý `z-index` phân tầng và lớp mờ (overlay) để đảm bảo chatbot luôn nằm trên cùng nhưng không gây gián đoạn trải nghiệm điều hướng.

---
**Ngày hoàn thành báo cáo:** 20/03/2026
**Người thực hiện:** [Minh]
