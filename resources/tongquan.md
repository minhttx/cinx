# CINX - AI CINEMA TICKET BOOKING SYSTEM
## Tổng hợp thông tin dự án

---

## 1. TỔNG QUAN DỰ ÁN

**CinX** là hệ thống đặt vé xem phim thông minh tích hợp trí tuệ nhân tạo, được xây dựng như một sản phẩm tốt nghiệp Đại học Công nghệ (DTU). Dự án kết hợp một nền tảng web hiện đại với hỗ trợ AI thông minh để tạo trải nghiệm rạp phim độc đáo.

### Mục tiêu chính:
- Đặt vé xem phim trực tuyến với chọn ghế thời gian thực
- Quản lý rạp chiếu phim và suất chiếu
- Trợ lý ảo AI tích hợp để tư vấn phim và suất chiếu
- Quản trị admin toàn diện cho ban quản lý rạp
- Phân tích doanh thu và thống kê hiệu suất

---

## 2. GIẢI PHÁP CÔNG NGHỆ

### 2.1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  HomePage   │  │ BookingPage │  │AdminDashboard│            │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  /  → 3000  │  │ai-api/ →    │  │static files │              │
│  │  (App)      │  │ollama:11434 │  │ (React)     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                         ▼
┌─────────────────────────────┐         ┌──────────────────────────┐
│     Ollama (Llama 3.2)      │         │      Supabase Backend    │
│  - Local LLM Runtime        │         │  - PostgreSQL Database   │
│  - AI Chat API              │         │  - Auth System           │
│  - Streaming Support        │         │  - Storage (Images)      │
│  - Gemini 3 Flash Proxy     │         │  - Database RPC          │
└─────────────────────────────┘         └──────────────────────────┘
```

### 2.2. Cấu trúc thư mục

```
CinX/main/
├── src/
│   ├── components/           # UI Components (15+ files)
│   │   ├── admin/           # Admin dashboard modules (9 modules)
│   │   ├── Header.jsx       # Top navigation
│   │   ├── Navigation.jsx   # Left-side navigation
│   │   ├── MovieCard.jsx    # Movie display card
│   │   └── ...
│   ├── pages/               # Application Pages (12 pages)
│   │   ├── HomePage.jsx
│   │   ├── BookingPage.jsx  # Seat selection & booking
│   │   ├── AdminDashboard.jsx
│   │   └── ...
│   ├── services/            # API Services
│   │   ├── api.js           # Supabase API wrappers (459 lines)
│   │   ├── ai.js            # Unified AI Orchestrator (969 lines)
│   │   ├── supabaseClient.js
│   │   ├── tmdb.js
│   │   └── vnpay.js
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ContentContext.jsx
│   ├── redux/               # State Management
│   │   ├── configStore.js
│   │   └── reducers/datVeReducer.js
│   ├── layouts/             # Layout Components
│   │   └── MainLayout.jsx
│   ├── utils/               # Utilities
│   │   ├── formatUtils.js
│   │   └── vnpay.js
│   ├── styles/              # CSS Styles
│   │   ├── variables.css    # M3 design tokens
│   │   └── [component].css
│   ├── App.js               # Main component with routing
│   └── index.js             # Entry point
├── public/                  # Static assets
├── docker-compose.yml       # Multi-container setup
├── dockerfile               # Node 18 Alpine image
└── nginx.conf               # Reverse proxy config
```

---

## 3. CƠ SỞ LÝ THUYẾT & KIẾN TRÚC

### 3.1. Ngôn ngữ và Framework

#### Frontend:
- **React 18.2.0** - UI framework
- **Redux 4.2.1** + **react-redux 8.0.5** - State management
- **React Router DOM 6.30.1** - Routing
- **React Markdown 10.1.0** + **remark-gfm 4.0.1** - Markdown rendering
- **Swiper 11.2.10** - Carousel functionality
- **Material Design 3** - Design system (custom CSS variables)
- **Service Worker** - PWA support

#### Backend:
- **Supabase (BaaS)** - Backend as a Service
  - PostgreSQL - Relational database
  - Supabase Auth - Authentication
  - Supabase Storage - Image storage
  - Database RPC - Server-side functions

#### AI/ML Stack:
- **Ollama** - Local LLM runtime
  - Llama 3.2 (3B) - Primary model
  - Gemini 3 Flash - Cloud fallback
- **Jina AI** - Web scraping
- **TMDB API** - Movie database

#### DevOps:
- **Node.js 18** - Runtime
- **Docker/Podman** - Containerization
- **Nginx** - Reverse proxy & streaming

#### Payment:
- **VNPAY** - Payment gateway (Web Crypto API HMAC-SHA512)

### 3.2. Ngôn ngữ Thiết kế Website

**Material Design 3 (M3)** được áp dụng thông qua CSS variables:

```css
/* src/styles/variables.css */
:root {
  --md-sys-color-primary: #E4BD66;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #14100D;
  --md-sys-color-on-primary-container: #FBE9D7;
  --md-sys-color-background: #14100D;
  --md-sys-color-surface: #1F1B18;
  --md-sys-color-on-surface: #E9E1D8;
}
```

**Bảng màu đặc trưng:**
- **Gold**: #E4BD66 (Primary color)
- **Dark Brown**: #14100D (Background)
- **Light Brown**: #3E3226 (Surface)

### 3.3. Thiết kế Hướng đối tượng

#### 3.3.1. Các đối tượng chính:

**Movie** - Thông tin phim với các thuộc tính: id, title, genre, rating, duration, posterUrl, status, isImax, is4dx, isHot

**Showtime** - Suất chiếu với các thuộc tính: id, movie, room, showDate, showTime, price, availableSeats, bookedSeats

**Seat** - Ghế với các thuộc tính: id, seatNumber, type (Regular/VIP/Couple), status (Available/Booked/Hold), price

**Booking** - Đơn đặt vé với các thuộc tính: id, user, showtime, seats, totalAmount, status, customerInfo

**User** - Người dùng với các thuộc tính: id, name, email, role (user/admin/mod), status

#### 3.3.2. Các mẫu thiết kế:

**Strategy Pattern** - Price Calculation:
```javascript
const priceStrategies = {
  weekday: (base) => base,
  weekend: (base) => base * 1.1,
  peakTime: (base) => base * 1.2,
}
```

**Observer Pattern** - Auth State:
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  // notify subscribers
})
```

**Repository Pattern** - Data Access:
- Abstract data access layer qua services/api.js
- Các API namespace: movieAPI, bookingAPI, showtimeAPI, userAPI

**Service Layer Pattern** - Business logic tách biệt khỏi UI

---

## 4. CƠ SỞ DỮ LIỆU

### 4.1. Database: PostgreSQL qua Supabase

**Cơ sở dữ liệu bao gồm 16+ bảng:**

#### Bảng Core:
1. **movies** - Thông tin phim (id, title, genre, description, rating, duration, release_date, poster_url, status, is_imax, is_4dx, is_hot)
2. **rooms** - Thông tin phòng chiếu (id, name, type, total_seats, multiplier, status)
3. **showtimes** - Suất chiếu (id, movie_id, room_id, show_date, show_time, price)
4. **seats** - Ghế (id, showtime_id, seat_number, seat_type, status)
5. **bookings** - Đơn đặt vé (id, user_id, showtime_id, total_amount, customer_info, seats, status)
6. **booking_seats** - Chi tiết ghế trong đơn đặt vé

#### Bảng Người dùng:
7. **users** - Người dùng hệ thống (id, name, email, phone, role, status)

#### Bảng Nội dung:
8. **news** - Tin tức
9. **promotions** - Khuyến mãi
10. **carousel_items** - Hero slider

#### Bảng Phản hồi:
11. **comments** - Bình luận với AI sentiment analysis

#### Bảng Quản trị:
12. **prices** - Cấu hình giá (regular, vip, couple, weekend_multiplier)
13. **system_logs** - Nhật ký hệ thống
14. **revenue_history** - Lịch sử doanh thu
15. **settings** - Cấu hình hệ thống (active_ai_provider, ai_system_prompt)
16. **ai_chat_history** - Lịch sử chat AI

### 4.2. Stored Procedures (RPC):

```sql
-- Tạo ghế cho một suất chiếu
CREATE OR REPLACE FUNCTION generate_seats_for_showtime(p_showtime_id UUID)

-- Thống kê ghế theo trạng thái
CREATE OR REPLACE FUNCTION get_detailed_seat_stats(p_showtime_ids UUID[])

-- Xóa phim và cascade
CREATE OR REPLACE FUNCTION delete_movie_cascade(movie_uuid UUID)

-- Clear showtimes của một phim
CREATE OR REPLACE FUNCTION clear_movie_showtimes_cascade(target_movie_id UUID)
```

---

## 5. CÔNG CỤ & CẤU HÌNH

### 5.1. Docker Setup

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    container_name: cinx-web
    volumes: [.:/app]
    networks: [cinx-network]
    
  ollama:
    image: ollama/ollama:latest
    container_name: cinx-ai
    volumes: [ollama_data:/root/.ollama]
    networks: [cinx-network]
    
  nginx:
    image: nginx:alpine
    container_name: cinx-proxy
    ports: ["8080:80"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]
    networks: [cinx-network]

networks:
  cinx-network:
    driver: bridge
```

### 5.2. Cấu hình Nginx:

**Reverse proxy và streaming support:**
- Location / → proxy_pass http://app:3000 (WebSocket hỗ trợ)
- Location /ai-api/ → proxy_pass http://ollama:11434/api/
- Extended timeouts: 900s read, 90s connect/send
- Streaming: proxy_buffering off, chunked_transfer_encoding on

### 5.3. Node.js Dependencies:

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-redux": "^8.0.5",
  "react-router-dom": "^6.30.1",
  "redux": "^4.2.1",
  "@supabase/supabase-js": "^2.56.0",
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1",
  "swiper": "^11.2.10",
  "react-scripts": "5.0.1"
}
```

---

## 6. CÁC TÍNH NĂNG NỔI BẬT

### 6.1. Hệ thống Đặt vé thông minh

**Chọn ghế thời gian thực:**
- Giao diện bàn cờ với 90 ghế (10 hàng x 9 cột)
- 3 loại ghế: Regular, VIP, Couple
- heatmap trực quan: ghế trống (xanh), ghế đã đặt (đỏ), ghế đang giữ (vàng)
- Lọc ghế theo loại: VIP, Couple, Trung tâm

**Tính toán giá thông minh:**
- Giá cơ bản: Thường (70k), VIP (90k), Couple (120k)
- Hệ số cuối tuần: x1.1 (Thứ 7, Chủ nhật)
- Hệ số phòng: IMAX (x1.2), 4DX (x1.3), Regular (x1.0)
- Giá giờ cao điểm: x1.2

**Cơ chế giữ chỗ:**
- Giữ ghế trong 15 phút trước khi thanh toán
- Tự động giải phóng nếu không thanh toán
- Trạng thái: Available → Hold → Booked

### 6.2. Trợ lý ảo AI CinX

**Kiến trúc AI:**
```
1. User Query → NLU Extraction
2. Entity Recognition (movie, date, time, genre)
3. Context Gathering (movies, showtimes, pricing)
4. Just-In-Time RAG (live data, no embeddings)
5. Orchestrated Response Generation
6. Interactive Streaming SSE
```

**Các khả năng AI:**
- Truy vấn ngôn ngữ tự nhiên: "Phim hành động đang chiếu Tonight"
- Tư vấn phim: Dựa trên rating >70%, bình luận khách
- Tư vấn suất chiếu: Phù hợp với gu phim user
- Giá cuối tuần: Tự động áp dụng hệ số x1.1
- Tạo nội dung: AI viết tin tức, review phim
- Phân tích cảm xúc: Auto-label bình luận
- Streaming responses: Server-Sent Events

**Just-In-Time RAG:**
```javascript
// Lấy data thời gian thực thay vì embeddings
const movies = await movieAPI.getCurrentMovies();
const showtimes = await showtimeAPI.getShowtimes();
const pricing = await configurationAPI.getPricingConfig();

// Build dynamic context cho AI
dataContext = `
[PHIM ĐANG CHIẾU]
- [Deadpool 3](movie:123) - Hành động - Đánh giá: 85%
[SUẤT CHIẾU]
- [Deadpool 3](movie:123): [19:00](showtime:456:123) (Trống: 90)
[GIÁ VÉ]
- Thường: 70,000đ, VIP: 90,000đ, Đôi: 120,000đ
- Cuối tuần (T7-CN) x1.1: Thường 77,000đ, VIP 99,000đ
`;
```

### 6.3. Admin Dashboard

**9 Module quản lý:**
1. Tổng quan - Thống kê doanh thu
2. Quản lý phim - Thêm/sửa/xóa phim
3. Quản lý suất chiếu - Tạo lịch chiếu hàng tuần
4. Quản lý phòng chiếu - Cấu hình IMAX, 4DX
5. Quản lý nhân viên - User management
6. Quản lý tin tức - Post articles
7. Quản lý khuyến mãi - Tạo mã giảm giá
8. Thống kê - Biểu đồ doanh thu
9. Quản lý bình luận - Moderation

**Thuật toán tạo lịch chiếu:**
```
1. Phân loại phim theo loại: IMAX, 4DX, Regular
2. Phân loại phòng theo loại: IMAX, 4DX, Regular
3. Gán phòng cho phim phù hợp
4. "Hijack Logic": Phim HOT chiếm suất 19:00
5. Tạo suất chiếu hàng ngày (9h, 13h, 16h, 19h, 21:30h)
6. Tự động tạo ghế cho tất cả suất chiếu
```

### 6.4. Payment Integration (VNPAY)

**Quy trình thanh toán:**
1. Create booking → status='pending'
2. Generate VNPAY URL với HMAC-SHA512
3. Redirect user đến VNPAY
4. User thanh toán trên VNPAY
5. Redirect về /booking/callback
6. Verify signature
7. Update booking: pending → confirmed
8. Update seats: hold → booked
9. Record revenue → revenue_history
10. Show booking-success page

### 6.5. Check-in Scanner

**Chức năng quét vé:**
- Camera access (Frontend)
- QR Code scanning
- Quét mã booking
- Hiển thị thông tin: Tên phim, Suất chiếu, Danh sách ghế, Trạng thái
- Ghi logs vào system_logs với type='checkin'

---

## 7. QUY TRÌNH HOẠT ĐỘNG

### 7.1. Quy trình Đặt vé (User Flow)

```
1. Trang chủ → Chọn phim → Chi tiết phim
2. Chọn suất chiếu → Trang đặt vé
3. Chọn ghế (Regular/VIP/Couple) → Tổng tiền
4. Nhập thông tin khách hàng
5. Chọn phương thức thanh toán (VNPAY)
6. Redirect đến VNPAY
7. Thanh toán thành công
8. Redirect về /booking/callback
9. Update booking: pending → confirmed
10. Ghi logs: system_logs (booking confirmed)
11. Update seats: hold → booked
12. Record revenue → revenue_history
13. Redirect về /booking-success với ticket
14. User có thể xem vé tại /my-tickets
```

### 7.2. Quy trình AI Chat (Orchestration)

```
1. User nhập câu hỏi: "Phim hành động hôm nay chiếu ở đâu?"
2. getCinXResponse() được gọi
3. Extract entities:
   - movie_name: null
   - genres: ["Hành động"]
   - dates: ["2026-04-25"] (hôm nay)
4. Filter movies: movies.filter(m => m.genre.includes("Hành động"))
5. Filter showtimes: showtimes.filter(st => entities.dates.includes(st.show_date))
6. Build context: Top 5 phim theo rating, Showtimes với ghế trống, Price info
7. Send_messages to Ollama: System prompt + Data context + Chat history
8. Ollama streaming response: AI tạo phản hồi với hyperlinks [Tên phim](movie:ID)
9. Render response với React Markdown
10. Save to ai_chat_history
```

### 7.3. Quy trình Admin Tạo lịch

```
1. Admin chọn phim đang chiếu → Generate weekly schedule
2. Fetch resources: movies WHERE status='showing', rooms WHERE status='active'
3. Intelligent room mapping:
   - IMAX rooms → IMAX movies
   - 4DX rooms → 4DX movies
   - Regular rooms → Regular movies (fallback to any)
4. Batch showtime creation:
   - 7 days × 5 times/day = 35 showtimes
   - Times: 09:00, 13:00, 16:00, 19:00, 21:30
   - Weekend multiplier applied (x1.1)
   - Prime time (19:00) hijacks HOT movies
5. Execute: Clear old showtimes, Insert new showtimes
6. Async seat generation: generate_seats_for_showtime() RPC
7. Return success with count
```

### 7.4. Quy trình Thanh toán

```
1. Create booking → status='pending'
2. Generate VNPAY URL với HMAC-SHA512 signature
3. Redirect to VNPAY
4. User completing payment on VNPAY
5. VNPAY redirect về returnUrl với vnp_ResponseCode=00
6. Verify signature
7. If valid:
   - Update booking SET status='confirmed'
   - Update seats SET status='booked'
   - INSERT INTO revenue_history
   - Log admin action
8. Show booking-success page with ticket
```

---

## 8. AN NINH & BẢO MẬT

### 8.1. Supabase Row-Level Security

```sql
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IS NULL AND customer_email = current_setting(...));

CREATE POLICY "Admins can manage everything"
ON movies FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
```

### 8.2. Authentication

**Supabase Auth:**
- Email/password login
- JWT tokens
- Session management
- Profile linking via auth.users.id = users.id

**Protected Routes:**
```javascript
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userProfile } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" />;
  }
  return children;
};
```

### 8.3. AI Provider Fallback

**Hybrid AI Architecture:**
- Primary: Ollama (Llama 3.2 3B) - Local, private, cost-effective
- Fallback: Gemini 3 Flash - Cloud, backup for complex tasks

Configuration stored in system_settings:
- key: 'active_ai_provider', value: 'llama'
- key: 'ai_system_prompt', value: '...'

---

## 9. HIỆU NĂNG & TỐI ƯU HÓA

### 9.1. Database Optimization

**PostgreSQL RPC:**
```sql
-- Bypass 1000-row limit
CREATE OR REPLACE FUNCTION get_detailed_seat_stats(p_showtime_ids UUID[])
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT ... FROM seats WHERE ...
END;
$$ LANGUAGE plpgsql;
```

**Indexing:**
```sql
CREATE INDEX idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX idx_showtimes_show_date ON showtimes(show_date);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_comments_movie_id ON comments(movie_id);
CREATE INDEX idx_seats_showtime_id ON seats(showtime_id);
```

**Batch Operations:**
```javascript
// Get all showtimes in bulk instead of N queries
await showtimeAPI.getMovieShowtimesInBulk(movieIds);
// 1 query instead of N queries
```

### 9.2. Frontend Optimization

**React.memo:**
```javascript
const MovieCard = React.memo(({ movie }) => {
  // Re-render only when movie data changes
});
```

**Lazy loading:**
```javascript
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
// Code splitting for admin panel
```

**Debouncing:**
```javascript
const debouncedQuery = useDebounce(query, 300);
// Avoid API calls on every keystroke
```

### 9.3. Streaming Optimization

**Nginx streaming config:**
```nginx
location /ai-api/ {
    proxy_buffering off;     # Disable buffering
    proxy_cache off;          # No caching
    chunked_transfer_encoding on;  # Chunked transfer
    proxy_read_timeout 900s;  # 15 minutes
}
```

**Server-Sent Events:**
```javascript
const reader = res.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse and render incrementally
}
```

---

## 10. KẾT LUẬN

**CinX** là một hệ thống đặt vé xem phim toàn diện với các đặc điểm nổi bật:

### Ưu điểm:
- ✅ AI Integration mạnh mẽ - Just-In-Time RAG, streaming responses, interactive chat
- ✅ Full-stack React - State management, routing, modern UI
- ✅ BaaS Architecture - Supabase = Backend + Auth + Storage + DB
- ✅ Local LLM - Ollama = Privacy + Cost-effective
- ✅ Smart Booking - Real-time seats, multi-tier pricing, weekender multiplier
- ✅ Admin Dashboard - 9 modules, analytics, content management
- ✅ Payment Integration - VNPAY + Web Crypto API (no external deps)
- ✅ Containerized - Docker/Podman, Nginx reverse proxy
- ✅ Responsive - Mobile-friendly design with PWA support

### Kiến trúc:
- **MVC Pattern** với Service Layer
- **State Management** qua Redux
- **Context API** cho Auth và Content
- **Repository Pattern** cho Data Access
- **Strategy Pattern** cho Pricing
- **Observer Pattern** cho Auth State
- **Streaming** cho AI Responses

### Công nghệ chính:
- **Frontend**: React 18 + Redux + Material Design 3
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Ollama (Llama 3.2) + Gemini 3 Flash fallback
- **Infrastructure**: Docker, Nginx, Podman
- **Payment**: VNPAY (Web Crypto API)

**CinX** là một dự án thực tế, production-ready với kiến trúc hiện đại, tối ưu hiệu năng, và tích hợp AI tiên tiến.
