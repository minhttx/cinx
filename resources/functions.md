# CÁC HÀM CHỨC NĂNG QUAN TRỌNG TRONG HỆ THỐNG CINX

Hệ thống CinX được xây dựng với triết lý "AI-First", nơi trí tuệ nhân tạo không chỉ là một tính năng bổ sung mà là bộ não điều phối toàn bộ trải nghiệm người dùng và quy trình quản trị. Dưới đây là các hàm chức năng cốt lõi.

---

## 1. Nhóm chức năng Trí tuệ nhân tạo (AI Orchestration)

Đây là phân hệ quan trọng nhất, kết nối ngôn ngữ tự nhiên của người dùng với dữ liệu thực tế của hệ thống.

### 1.1. Hàm `getCinXResponse` - Bộ điều phối phản hồi thông minh
Hàm này đóng vai trò là "Nhà trưởng", thực hiện quy trình 3 bước: Trích xuất ý định (NLU) -> Truy vấn dữ liệu thực tế -> Tạo phản hồi cá nhân hóa kèm Action Links.

```javascript
// Trích từ main/src/services/ai.js
export async function getCinXResponse(userMessage, context) {
    try {
        // Bước 1: Trích xuất thực thể (NLU)
        const nluData = await extractBookingIntent(userMessage);
        
        // Bước 2: Lọc dữ liệu thực tế dựa trên ý định
        const matchedShowtimes = filterShowtimes(context.allShowtimes, nluData);
        
        // Bước 3: Tạo phản hồi tự nhiên kèm liên kết đặt vé
        const prompt = `Bạn là CinX AI... Dữ liệu thực tế: ${JSON.stringify(matchedShowtimes)}...`;
        const response = await callOllama(prompt);
        
        return response; // Trả về câu trả lời có định dạng [Giờ](showtime:id)
    } catch (error) {
        return "Tôi hiện đang bận một chút, bạn có thể thử lại sau nhé!";
    }
}
```

### 1.2. Hàm `analyzeCommentSentiment` - Kiểm duyệt cảm xúc tự động
Sử dụng AI để phân tích sắc thái của bình luận, giúp quản trị viên lọc nhanh các phản hồi tiêu cực hoặc spam.

```javascript
// Trích từ main/src/services/ai.js
export async function analyzeCommentSentiment(commentText) {
    const prompt = `Phân tích cảm xúc bình luận sau: "${commentText}". 
    Trả về JSON: { "score": 0-1, "label": "Positive/Negative/Neutral", "reason": "..." }`;
    
    const result = await callOllama(prompt, true); // true để ép kiểu JSON
    return JSON.parse(result);
}
```

---

## 2. Nhóm chức năng Tự động hóa vận hành (System Automation)

### 2.1. Hàm `generateWeeklySchedule` - Lập lịch chiếu thông minh
Tự động hóa hoàn toàn việc xếp lịch cho toàn bộ rạp phim dựa trên loại phòng (IMAX/4DX) và độ "Hot" của phim.

```javascript
// Trích từ main/src/services/api.js
async generateWeeklySchedule() {
    // Tự động phân bổ phim Hot vào khung giờ vàng (19:00)
    // Phim IMAX vào phòng IMAX, Phim 4DX vào phòng 4DX
    roomAssignments.forEach(({ room, movie }) => {
        times.forEach(timeStr => {
            if (timeStr === '19:00:00' && room.type === '2D/3D' && hotMovie) {
                assignedMovie = hotMovie; // Ưu tiên phim Hot
            }
            newShowtimes.push({ ... });
        });
    });
    // Ghi hàng loạt (Bulk Insert) và kích hoạt RPC tạo 90 ghế/suất
}
```

### 2.2. Hàm `getDetailedSeatStats` - Kiểm tra trạng thái ghế thực tế
Hàm này đã được tối ưu để đếm trực tiếp từ Database, loại bỏ hoàn toàn dữ liệu giả, đảm bảo tính trung thực cho AI tư vấn.

```javascript
// Trích từ main/src/services/api.js
async getDetailedSeatStats(sids) {
    const { data } = await supabase
        .from('seats')
        .select('showtime_id, seat_type, status')
        .in('showtime_id', sids)
        .eq('status', 'available'); // Chỉ đếm ghế còn trống

    // Tổng hợp ma trận: stats[showtime_id] = { total, vip, couple }
    return processCounts(data);
}
```

---

## 3. Nhóm chức năng Phân tích dữ liệu (Smart Analytics)

### 3.1. Hàm `getBookingAnalyticsData` - Ma trận mật độ đặt vé
Nâng cấp từ việc đếm đơn thuần sang tạo ma trận Thứ x Giờ trong 30 ngày để vẽ Heatmap.

```javascript
// Trích từ main/src/services/api.js
async getBookingAnalyticsData() {
    const { data } = await supabase.from('bookings')
        .select('showtime_info, created_at')
        .gte('created_at', thirtyDaysAgo)
        .eq('status', 'confirmed');

    // Chuyển đổi dữ liệu sang ma trận Thứ (2-CN) và Giờ chuẩn
    const heatmap = initializeHeatmap();
    data.forEach(order => {
        const dayKey = getDayOfWeek(order.created_at);
        const hourKey = normalizeToStandardHour(order.time);
        heatmap[dayKey][hourKey]++;
    });
    return heatmap;
}
```

### 3.2. Hàm `getTrendingMovies` - Thuật toán xác định phim xu hướng
Tự động tính toán điểm số cho các bộ phim dựa trên lượt đặt vé thực tế trong 7 ngày gần nhất, giúp AI đưa ra gợi ý "Hot" chính xác.

```javascript
// Trích từ main/src/services/api.js
async getTrendingMovies() {
    const { data: bookings } = await supabase.from(TABLES.BOOKINGS)
      .select('showtime_info')
      .eq('status', 'confirmed')
      .gte('created_at', sevenDaysAgo);

    const counts = {};
    bookings.forEach(x => {
      const info = JSON.parse(x.showtime_info);
      if (info?.movie_title) counts[info.movie_title] = (counts[info.movie_title] || 0) + 1;
    });
    
    // Trả về Top 5 phim có điểm số cao nhất
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
}
```

---

## 4. Nhóm chức năng Bảo mật và Thanh toán (Security & Payment)

### 4.1. Hàm `handleConfirmVnpay` - Chuyển hướng thanh toán an toàn
Đảm bảo quy trình đặt vé không bị ngắt quãng bởi các thông báo hệ thống và bảo vệ trạng thái giữ ghế.

```javascript
// Trích từ main/src/pages/BookingPage.jsx
const handleConfirmVnpay = async () => {
    // Tạm tắt bảo vệ chuyển trang để trình duyệt không hiện "Leave site?"
    dispatch({ type: 'SET_BOOKING_PROGRESS', inProgress: false });
    
    const url = await createVnpayUrl({ orderId, amount, ... });
    window.location.href = url; // Điều hướng sang VNPAY
};
```

### 4.2. Hàm `verifyVnpaySignature` - Xác thực giao dịch (Anti-Tampering)
Kiểm tra tính toàn vẹn của dữ liệu nhận được từ cổng thanh toán bằng thuật toán HMAC-SHA512, đảm bảo số tiền và mã đơn hàng không bị thay đổi bởi hacker.

```javascript
// Trích từ main/src/utils/vnpay.js
export const verifyVnpaySignature = (vnp_Params) => {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp các tham số và tạo chuỗi hash đối chứng
    const signData = sortObject(vnp_Params);
    const checkSum = hmacSHA512(signData, VNP_HASH_SECRET);

    return secureHash === checkSum; // Chỉ chấp nhận nếu mã băm khớp hoàn toàn
};
```

---
**Kết luận**: Sự phối hợp giữa các hàm xử lý AI (`getCinXResponse`) và các hàm dữ liệu tối ưu (`getBookingAnalyticsData`) tạo nên một hệ thống CinX thông minh, minh bạch và có khả năng tự vận hành cao.
