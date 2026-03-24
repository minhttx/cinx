---
tags:
  - coding
---
- Website đang chạy trong podman container -> AI cũng cần chạy trong podman container (nghiên cứu file docker-compose của website để biết network).
- AI chỉ phục vụ việc phân tích sở thích, thói quen của người dùng, gợi ý đề xuất phim, gợi ý đề xuất suất chiếu/ghế ngồi, hỗ trợ đặt vé... -> dùng ollama llama 3.2 3B chạy local/vps
- sở thích, thói quen người dùng cần thu thập: thể loại phim thường đặt, thời gian thường xem phim, xu hướng chỗ ngồi thường chọn, độ tuổi (để có thông tin độ tuổi cần bổ sung trường "năm sinh" vào cơ sở dữ liệu người dùng và người dùng cần khai báo khi đăng ký tài khoản).

