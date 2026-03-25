# QUY TRÌNH PHÁT TRIỂN (SCRUM IMPLEMENTATION)

## 1 Lý do chọn SCRUM
Dự án CinX có requirements phức tạp (AI integration, real-time features) và 
cần iterative delivery để early validation với stakeholders (giảng viên hướng dẫn).

---

## 2 Sprint Cadence
- **Sprint duration:** 2 tuần (phù hợp đồ án 16 tuần)
- **Team size:** 1 developer (solo project) → adapt SCRUM cho cá nhân
- **Ceremonies:** Daily standup (self-reflection), Sprint planning, 
  Sprint review (demo với GVHD), Retrospective

---

## 3 Adaptations cho solo project
| SCRUM Ceremony | Solo Implementation |
|----------------|---------------------|
| Daily Standup | 15-min morning reflection log |
| Pair Programming | Code review checklist tự đánh giá |
| Sprint Review | Demo recording + feedback GVHD |
| Retrospective | Personal learning journal |


----

## 4 Product Backlog
| ID     | User Story                                                                              | Priority | Story Points | Sprint | Status |
| ------ | --------------------------------------------------------------------------------------- | -------- | ------------ | ------ | ------ |
| US-001 | Là khách hàng, tôi muốn xem danh sách phim đang chiếu để chọn phim phù hợp              | High     | 3            | 1      | Done   |
| US-002 | Là khách hàng, tôi muốn xem chi tiết phim (mô tả, trailer, rating) để quyết định đặt vé | High     | 5            | 1      | Done   |
| US-003 | Là khách hàng, tôi muốn chọn suất chiếu theo ngày/phòng để đặt vé đúng lịch             | High     | 8            | 2      | Done   |
| US-004 | Là khách hàng, tôi muốn xem sơ đồ ghế thời gian thực để chọn ghế đẹp                    | High     | 13           | 2      | Done   |
| US-005 | Là khách hàng, tôi muốn thanh toán qua VNPAY để hoàn tất đặt vé                         | High     | 8            | 3      | Done   |
| US-006 | Là khách hàng, tôi muốn chat với AI để được tư vấn phim, suất chiếu và đặt vé trực tiếp qua link | Critical | 21           | 3-4    | Done   |
| US-007 | Là khách hàng, tôi muốn nhận gợi ý phim dựa trên sở thích và xem đánh giá của người khác qua AI | Medium   | 8            | 4      | Done   |
| US-008 | Là admin, tôi muốn dashboard thống kê doanh thu để quản lý rạp                          | Medium   | 8            | 2      | Done   |
| US-009 | Là admin, tôi muốn AI tự động viết tin tức từ URL hoặc ý tưởng để tiết kiệm thời gian vận hành  | Medium   | 13           | 4      | Done   |
| US-010 | Là nhân viên rạp, tôi muốn quét QR check-in vé để kiểm soát vào cửa                     | High     | 8            | 3      | Done   |
| US-011 | Là người dùng, tôi muốn chatbot luôn hiển thị trên cùng để dễ dàng tương tác mọi lúc            | Low      | 3            | 4      | Done   |
### Technical Stories
| ID     | Story                                     | Points | Sprint |
| ------ | ----------------------------------------- | ------ | ------ |
| TS-001 | Setup CI/CD pipeline với Podman/Docker    | 5      | 1      |
| TS-002 | Triển khai Ollama Local LLM + Nginx Proxy | 13     | 3      |
| TS-003 | Tích hợp Supabase Auth + RLS policies     | 5      | 1      |
| TS-004 | Xây dựng PostgreSQL RPC cho Seat Stats    | 8      | 2      |
| TS-005 | Tích hợp Jina AI Reader cho Admin Tools   | 5      | 4      |


---

## 5 SPRINT PLANNING & EXECUTION

### Sprint 1: Foundation (Tuần 1-2)
    Goal: Khởi tạo project, authentication, và movie browsing cơ bản
| Task                                   | Assignee  | Estimated | Actual |
| -------------------------------------- | --------- | --------- | ------ |
| Setup React + Vite + Material Design 3 | Developer | 8h        | 6h     |
| Tích hợp Supabase Auth                 | Developer | 6h        | 8h     |
| Movie list + detail pages              | Developer | 16h       | 14h    |
| Database schema (movies, showtimes)    | Developer | 8h        | 6h     |
    Sprint Review: Demo xem phim, đăng nhập, xem chi tiết phim
    Retrospective: Material Design 3 khá phức tạp, cần document kỹ hơn

### Sprint 2: Core Booking (Tuần 3-4)
    Goal: Hoàn thiện luồng đặt vé cơ bản
| Task                                     | Estimated | Actual | Notes                               |
| ---------------------------------------- | --------- | ------ | ----------------------------------- |
| Seat map real-time component             | 20h       | 24h    | WebSocket sync phức tạp hơn dự kiến |
| PostgreSQL RPC `get_detailed_seat_stats` | 8h        | 6h     | Dùng PL/pgSQL                       |
| Admin dashboard analytics                | 12h       | 10h    | Chart.js integration                |
| Weekly scheduler algorithm               | 8h        | 12h    | Logic "hot movie hijack" cần refine |
    Impediment: WebSocket connection unstable → Resolution: Chuyển sang polling 5s + optimistic UI

### Sprint 3: Payment & Check-in (Tuần 5-6)
    Goal: Thanh toán VNPAY và hệ thống check-in
| Task                                        | Estimated | Actual |
| ------------------------------------------- | --------- | ------ |
| VNPAY Sandbox integration                   | 12h       | 10h    |
| Booking state machine (pending → confirmed) | 8h        | 8h     |
| PWA QR Scanner                              | 16h       | 18h    |
| Auto-release seat after 15min               | 6h        | 4h     |


### Sprint 4: AI Integration & Polish (Tuần 7-8)
    Goal: Chatbot thông minh, Interactive UI và Công cụ Admin
| Task                               | Estimated | Actual | Complexity |
| ---------------------------------- | --------- | ------ | ---------- |
| Ollama container & Llama 3.2 setup | 8h        | 6h     | Medium     |
| JIT RAG with RPC Optimization      | 24h       | 28h    | **High**   |
| NLU Pipeline with Regex Fixes      | 16h       | 18h    | **High**   |
| Interactive Hyperlinks (Actionable)| 12h       | 10h    | Medium     |
| Jina AI & News Generation          | 12h       | 12h    | Medium     |
| UI Refinement (Z-index, Modals)    | 8h        | 6h     | Low        |
    Key Challenge: Vượt giới hạn 1000 dòng của Supabase để AI báo ghế trống chính xác 100%.

---
## 6 BURNDOWN CHART (Minh họa Sprint 4 - AI Integration)
Story Points Remaining
   |
40 |                            *
   |                        *
35 |                    *
   |                *
30 |            *
   |        *
25 |    *
   |*
20 |
   |_____________________________
    Day 1   3   5   7   9  10
Velocity: 21 points/sprint (trung bình)
Total Project: 8 sprints × 2 tuần = 16 tuần

---
## 7 DAILY STANDUP LOG (Mẫu 5 ngày Sprint 4)
| Ngày  | Yesterday                                       | Today                                  | Blockers                               |
| ----- | ----------------------------------------------- | -------------------------------------- | -------------------------------------- |
| Day 1 | -                                               | Setup Ollama container, test Llama 3.2 | Chưa có                                |
| Day 2 | Ollama chạy local thành công                    | Viết `gatherAIContext` với Promise.all | Lỗi báo hết vé ảo do 1000 rows limit   |
| Day 3 | Fix: Dùng `get_detailed_seat_stats` RPC         | Bắt đầu NLU pipeline stage 1           | AI trả về JSON kèm ``` làm parse lỗi   |
| Day 4 | Hoàn thành Regex JSON parsing                  | Thêm Hyperlink cho Phim & Suất chiếu   | Chatbot bị che bởi sơ đồ ghế (Z-index) |
| Day 5 | Fix: Nâng Z-index Chatbot lên 3000              | Tích hợp Jina AI & Bình luận khách     | SSE buffering issue → cần config Nginx |

---
## 8 DEFINITION OF DONE (DoD)
✅ Code được review và merge vào main branch  
✅ Unit test pass (coverage > 70% cho business logic)  
✅ Integration test với Supabase pass  
✅ UI responsive trên mobile & desktop  
✅ Feature demo được trong Sprint Review  
✅ Documentation cập nhật (README/API docs)  
✅ Không có console error/critical bug

---
## 9 RISK REGISTER (Quản lý rủi ro)
| Risk                                       | Probability | Impact   | Mitigation                           | Status     |
| ------------------------------------------ | ----------- | -------- | ------------------------------------ | ---------- |
| Ollama local LLM chậm với concurrent users | Medium      | High     | Fallback to Gemini API               | Resolved   |
| Data limit (1000 rows) làm AI báo sai      | High        | High     | Chuyển sang dùng Database RPC        | Resolved   |
| AI Hallucination (bịa nội dung phim)       | Medium      | Medium   | JIT Context Injection + Social Proof | Resolved   |
| Browser compatibility QR scanner           | Medium      | Medium   | html5-qrcode + fallback manual input | Resolved   |

---
## 10 PRODUCT INCREMENT DELIVERABLES
| Sprint | Increment                       | Evidence                                |
| ------ | ------------------------------- | --------------------------------------- |
| 1      | Movie browsing app              | Screenshot home, detail pages           |
| 2      | Working seat selection          | Video demo chọn ghế real-time           |
| 3      | Complete booking flow           | VNPAY test transaction receipt          |
| 4      | **AI-powered cinema assistant** | Chatbot demo video, AI response samples |

