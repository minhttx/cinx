# Kế hoạch triển khai Hệ thống AI Kép (CinX Dual-AI Bridge)

Hệ thống cho phép Admin linh hoạt chuyển đổi giữa mô hình AI chạy tại chỗ (Local - Llama 3.2) và mô hình AI đám mây (Cloud - Google Gemini) để tối ưu hóa hiệu suất và chi phí.

## 1. Cơ sở dữ liệu (Settings Storage)

Sử dụng bảng `prices` hiện có hoặc tạo bảng `system_settings` để lưu cấu hình:
- `key`: 'active_ai_provider'
- `value`: 'llama' | 'gemini'

## 2. Tầng Dịch vụ (services/ai.js)

Nâng cấp `ai.js` thành một bộ điều phối (Orchestrator):
- **Cấu hình Gemini:** Thiết lập endpoint và headers cho Google AI Studio API.
- **Hàm `getCinXResponse`:** 
    - Đầu tiên, truy vấn Database để biết Admin đang ưu tiên AI nào.
    - Chuyển hướng yêu cầu (Route request) đến đúng Provider tương ứng.
    - Thống nhất cấu trúc dữ liệu trả về để Frontend không cần thay đổi logic hiển thị.

## 3. Giao diện Quản trị (Admin UI)

Cập nhật thẻ **"Trí tuệ nhân tạo (CinX)"** trong module **Tổng quan**:
- Thay vì chỉ hiển thị trạng thái, bổ sung một **M3 Switch** hoặc **Segmented Button**.
- **Lựa chọn 1:** "Nội bộ (Llama)" - Ưu tiên bảo mật, không mất phí.
- **Lựa chọn 2:** "Đám mây (Gemini)" - Ưu tiên tốc độ, thông minh hơn.
- Khi nhấn chuyển đổi, hệ thống tự động cập nhật Database và ghi Log hành động.

## 4. Các bước thực hiện cụ thể

### Bước 1: Cấu hình API & Database
- Khai báo API Key cho Gemini.
- Thêm cấu hình 'active_ai_provider' vào Database.

### Bước 2: Nâng cấp "Bộ não" `ai.js`
- Viết hàm `callGeminiAPI` bổ sung cho hàm `callLlamaAPI` hiện tại.
- Triển khai logic switch-case dựa trên cài đặt hệ thống.

### Bước 3: Hoàn thiện UI Admin
- Thêm nút gạt chuyển đổi và thông báo xác nhận thành công.

---
*Chờ cung cấp API Key và chỉ thị triển khai...*

Gemini API Key: AIzaSyBAOPwm-bsczfnC5tNvYo_5c2w-1TO2uCg
