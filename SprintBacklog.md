# SPRINT BACKLOG: SPRINT 5 (FINAL REFINEMENT & DEFENSE PREP)

**Thời gian:** 23/03/2026 - 05/04/2026 (2 tuần)
**Sprint Goal:** Hoàn thiện trải nghiệm người dùng, tối ưu hóa hiệu suất hệ thống AI và đóng gói hồ sơ đồ án.

---

## 1. DANH SÁCH USER STORIES TRONG SPRINT
| ID | User Story | Priority | Points | Status |
|----|------------|----------|--------|--------|
| US-012 | Là khách hàng, tôi muốn trải nghiệm mượt mà, không giật lag khi chatbot phản hồi | High | 5 | In Progress |
| US-013 | Là người dùng, tôi muốn xem hướng dẫn sử dụng nhanh để biết chatbot có thể làm gì | Medium | 3 | To Do |
| US-014 | Là sinh viên, tôi muốn hồ sơ đồ án (README/Docs) chuyên nghiệp để đạt điểm cao | Critical | 8 | In Progress |
| US-015 | Là quản trị viên, tôi muốn hệ thống vận hành ổn định ngay cả khi database lớn dần | High | 5 | To Do |

---

## 2. PHÂN CHIA CÔNG VIỆC CHI TIẾT (TASK BREAKDOWN)

### Tuần 1: Optimization & UX (23/03 - 29/03)
| Task ID | Mô tả công việc | Assignee | Est. | Status |
|---------|-----------------|----------|------|--------|
| T-501 | Tối ưu hóa Database: Đánh Index cho các cột hay filter (movie_id, status) | Minh | 4h | To Do |
| T-502 | Nâng cấp AI Chat: Lưu 5-10 tin nhắn gần nhất vào Memory để chat đa ngữ cảnh | Minh | 8h | In Progress |
| T-503 | Cải thiện UX: Thêm hiệu ứng Skeleton Loading cho danh sách phim gợi ý | Minh | 6h | To Do |
| T-504 | Bug Fix: Sửa lỗi hiển thị Overlay khi chuyển đổi giữa Desktop/Mobile | Minh | 4h | Done |

### Tuần 2: Final Polish & Documentation (30/03 - 05/04)
| Task ID | Mô tả công việc | Assignee | Est. | Status |
|---------|-----------------|----------|------|--------|
| T-505 | Viết tài liệu hướng dẫn sử dụng chatbot (Cheat sheet các câu lệnh mẫu) | Minh | 4h | To Do |
| T-506 | Chụp ảnh minh họa (Screenshots) và quay video demo (Screencast) | Minh | 8h | To Do |
| T-507 | Kiểm tra E2E: Test toàn bộ luồng từ Chat AI -> Đặt vé -> VNPAY -> Check-in | Minh | 8h | To Do |
| T-508 | Hoàn thiện README.md và slide thuyết trình bảo vệ | Minh | 12h | In Progress |

---

## 3. SCRUM BOARD (TRẠNG THÁI HIỆN TẠI)

| TO DO (Cần làm) | IN PROGRESS (Đang làm) | DONE (Đã xong) |
|-----------------|------------------------|----------------|
| T-501 (DB Index) | T-502 (AI Context Memory) | T-504 (Overlay Bug Fix) |
| T-503 (Skeleton) | T-508 (Final Docs) | |
| T-505 (User Guide)| | |
| T-506 (Demo Media)| | |
| T-507 (E2E Test) | | |

---

## 4. KẾ HOẠCH DAILY STANDUP (KEY FOCUS)
- **Monday:** Tập trung tối ưu RPC và Indexing để AI phản hồi nhanh hơn.
- **Wednesday:** Hoàn thiện logic Memory cho chatbot (tránh việc khách hỏi câu thứ 2 AI quên mất câu thứ 1).
- **Friday:** Review lại giao diện trên thiết bị di động thực tế.

---

## 5. ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE - SPRINT LEVEL)
- [ ] Mọi chức năng AI (RAG, NLU, Hyperlinks) hoạt động ổn định trên môi trường Podman.
- [ ] Thời gian phản hồi của chatbot (first token) không quá 1.5 giây.
- [ ] Quy trình thanh toán VNPAY hoạt động trơn tru với môi trường Sandbox.
- [ ] Tài liệu README.md phản ánh đúng 100% codebase thực tế.
- [ ] Không còn lỗi CSS/Layout trên cả 2 nền tảng Mobile & Desktop.

---
**Người lập kế hoạch:** Minh
**Ngày tạo:** 20/03/2026
