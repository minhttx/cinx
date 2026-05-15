# PHÂN TÍCH USER STORY (CÂU CHUYỆN NGƯỜI DÙNG)

## 1. Tác nhân: Khách hàng (Customer)
Tập trung vào trải nghiệm đặt vé nhanh chóng, cá nhân hóa và tiện lợi.

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) |
|----|------------|------------------------------------------|
| **US-01** | Là một khách hàng, tôi muốn **chat với trợ lý AI** về sở thích phim của mình, để tôi có thể tìm được suất chiếu phù hợp mà không cần lọc thủ công. | - AI hiểu được thể loại và thời gian.<br>- Trả về link đặt vé trực tiếp cho suất chiếu đó. |
| **US-02** | Là một khách hàng, tôi muốn **chọn vị trí ghế cụ thể** trên sơ đồ phòng chiếu, để đảm bảo tôi có tầm nhìn tốt nhất khi xem phim. | - Sơ đồ hiển thị rõ ghế trống/đã đặt.<br>- Phân biệt được ghế Thường, VIP và Đôi. |
| **US-03** | Là một khách hàng, tôi muốn **thanh toán qua VNPAY**, để tôi có thể hoàn tất giao dịch một cách an toàn và nhanh chóng bằng ứng dụng ngân hàng. | - Chuyển hướng sang cổng thanh toán thành công.<br>- Trạng thái đơn hàng cập nhật ngay sau khi trả tiền. |
| **US-04** | Là một khách hàng, tôi muốn **có vé điện tử kèm mã QR** trong mục "Vé của tôi", để tôi có thể soát vé tại rạp mà không cần in giấy. | - Mã QR duy nhất cho mỗi đơn hàng.<br>- Hiển thị đầy đủ thông tin phim, giờ chiếu và số ghế. |

## 2. Tác nhân: Quản trị viên (Admin)
Tập trung vào khả năng tự động hóa, quản lý dữ liệu và phân tích kinh doanh.

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) |
|----|------------|------------------------------------------|
| **US-05** | Là một quản trị viên, tôi muốn **hệ thống tự động tạo lịch chiếu tuần**, để tôi tiết kiệm thời gian vận hành và tối ưu công suất phòng chiếu. | - Tự phân bổ phim Hot vào khung giờ vàng.<br>- Tự động tính giá theo loại phòng và ngày cuối tuần. |
| **US-06** | Là một quản trị viên, tôi muốn **AI phân tích cảm xúc bình luận**, để tôi có thể nhanh chóng duyệt hoặc ẩn các phản hồi tiêu cực/vi phạm. | - Gán nhãn Sentiment (Tích cực/Tiêu cực) tự động.<br>- Hiển thị lý do AI đưa ra đánh giá đó. |
| **US-07** | Là một quản trị viên, tôi muốn **xem biểu đồ Heatmap mật độ đặt vé**, để tôi nhận diện được khung giờ "vàng" và ngày vắng khách nhằm điều chỉnh khuyến mãi. | - Biểu đồ 7 ngày x 5 khung giờ.<br>- Màu sắc thể hiện rõ độ đậm nhạt của lượng đơn hàng. |
| **US-08** | Là một quản trị viên, tôi muốn **dùng AI hỗ trợ viết tin tức**, để tôi có thể tạo ra các nội dung marketing hấp dẫn chỉ từ những từ khóa đơn giản. | - Tạo ra tiêu đề, tóm tắt và nội dung chuẩn SEO.<br>- Cho phép chỉnh sửa lại trước khi xuất bản. |

## 3. Tác nhân: Nhân viên rạp (Staff/Mod)
Tập trung vào quy trình soát vé nhanh và chính xác tại cửa phòng chiếu.

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) |
|----|------------|------------------------------------------|
| **US-09** | Là một nhân viên rạp, tôi muốn **quét mã QR trên điện thoại khách**, để tôi có thể xác thực vé vào cổng một cách chuyên nghiệp. | - Tốc độ nhận diện mã QR dưới 2 giây.<br>- Báo lỗi nếu vé giả hoặc đã được sử dụng. |
| **US-10** | Là một nhân viên rạp, tôi muốn **hệ thống cảnh báo nếu khách quét vé quá sớm**, để đảm bảo trật tự hàng đợi trước phòng chiếu. | - Hiển thị thông báo nếu quét trước giờ chiếu > 30 phút.<br>- Hiển thị nút "Quay lại" để tiếp tục quét người tiếp theo. |
