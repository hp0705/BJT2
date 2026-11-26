# 01 — BJT J2 APP & CURRICULUM SPECIFICATION (Bản hợp nhất)

> Phiên bản: **2.2** (thêm luồng học "Học từ → Quiz → Ôn → Thực chiến", trạng thái nội dung P01–P04, đặc tả Web App iPhone + pipeline âm thanh, Phụ lục A: prompt cho Gemini — xem mục 0). v2.1: sửa thang điểm, thêm cấu trúc đề thật, bổ sung nội dung  
> Mục tiêu: Đạt **BJT J2 (420–529 điểm)** trên thang 800, đủ năng lực xử lý công việc thực tế bằng tiếng Nhật. Để có biên an toàn, nên nhắm **≥ 450** trong các đề Mock.  
> Định hướng App: Tối giản cho người lớn tự học — tập trung tuyệt đối vào **nội dung học đầy đủ, sát đề thi** và **âm thanh tiếng Nhật chuẩn, tốc độ thật**.

---

## 0. Thay đổi so với v2.1 (bản v2.2) và v2.0

### 0.1 Thay đổi v2.2

| # | Thay đổi | Lý do |
| --- | --- | --- |
| 1 | Mỗi lesson `L01–L03` có thêm **mục 0 "HỌC TỪ VỰNG TRƯỚC KHI LÀM BÀI"**: Bước 1 Học từ · Bước 2 Quiz từ vựng (đạt ≥ 80%) · Bước 3 Ôn từ sai (Hộp 1 Leitner) | Người học chưa thuộc từ thì không làm được bài thi; thêm bước nhớ từ trước bài thực chiến |
| 2 | Nội dung PART 01–04 đã nâng lên **v2.1 (lesson)**; file lesson đổi tên theo quy ước mới (mục 3.2) | Đồng bộ file ↔ PART |
| 3 | Mã lỗi từ 16 → **17**: thêm `INDIRECT_INTENT` (đọc nhầm 本音/ý gián tiếp) | PART 04 cần theo dõi riêng; trước đây gộp vào `SPEAKER_INTENT` |
| 4 | Thêm **mục 7: Đặc tả Web App** (iPhone 15 Safari, PWA, MP3 tạo sẵn, bố cục 10 màn hình, lưu trữ) và **Phụ lục A: prompt hoàn chỉnh cho Gemini** | Chuyển từ giáo trình sang app dùng được |
| 5 | Sửa ID lệch với file `02` ở P01 (5 từ tạm `NEW-P01-01..05`) và P03 (`NM-14`, `NM-16`, `TR-A04`, `TR-A05`) | Chống lệch dữ liệu khi parser nối với `02` |
| 6 | Thêm quy ước đánh số file: `file = PART + 3` (04 = P01 … 07 = P04 · **08 = P05** …) | Chuẩn bị các PART còn lại |

### 0.2 Thay đổi v2.1 so với v2.0

| # | Thay đổi | Lý do |
| --- | --- | --- |
| 1 | **J2 = 420–529** (v2.0 ghi sai 400–599) | Thang chính thức: J1+ 600–800 · J1 530–599 · J2 420–529 · J3 320–419 · J4 200–319 · J5 0–199 |
| 2 | Thêm **cấu trúc đề CBT 80 câu** và 7 dạng câu | v2.0 thiếu 描写, 表現力, 状況把握, 文法語彙 (≈ 60% số câu của đề thật) |
| 3 | Thêm file `05` (153 từ + 16 thẻ đồng âm + 32 mẫu ngữ pháp + 20 động từ kính ngữ + 14 lỗi + bảng đọc số/giờ) | Lấp khoảng trống từ vựng thời gian/thuế/chứng từ/katakana, ngữ pháp văn bản, kính ngữ mở rộng |
| 4 | Thêm file `06` (25 câu mới: 表現力, 文法語彙, 描写, Nghe 3 người, Đọc thông báo) | Bắt đầu lấp phần luyện tập |
| 5 | Sửa lỗi nhỏ trong `03`, `04` (xem `05` mục E) | Đề mơ hồ / mâu thuẫn |
| 6 | Mã lỗi từ 14 → **16** (v2.2 lên 17; thêm `IMAGE_DETAIL`, `EXPRESSION_FIT`) | Hai dạng câu mới |
| 7 | Chỉ số sẵn sàng thi đổi theo 3 phần của đề thật | Cho sát cấu trúc |
| 8 | Yêu cầu ≥ 3 giọng đọc, thêm trường JSON `imageFile` / `imageSpec` | Hội thoại 3 người, dạng 描写 |

> **Nguồn dữ liệu cấu trúc đề:** thông báo CBT hóa của 日本漢字能力検定協会 (từ 2017) — `https://www.kanken.or.jp/bjt/topics/data/bjtinfo_cbtr.pdf`. Đề có thể điều chỉnh theo thời gian; **hãy đối chiếu lại với trang chính thức và bài thử CBT** (`https://www.kanken.or.jp/bjt/cbt_demo/`) trước khi chốt khuôn.

---

## 1. Hồ sơ người học & Nguyên tắc thiết kế

- **Đầu vào:** Trên JLPT N3 (đã có nền tảng Kanji và ngữ pháp cơ bản, không học lại từ đầu).
- **Thời lượng học:** 30–45 phút/ngày, 5–6 ngày/tuần. Hoàn thành toàn bộ giáo trình trong **10–12 tuần** (10 PART).
- **Phân tách nguồn dữ liệu:**
  - `SOURCE`: Giữ nguyên 100% từ tài liệu gốc (`264 từ + 24 cụm + 51 mẫu ngữ pháp + bảng kính ngữ + mẫu câu`).
  - `ADDED`: Bổ sung đã có trong v2.0 (`46 từ bẫy điều kiện & collocations`, `8 từ đệm`, `bài tập kính ngữ 3 ngôi 内/外`, bài mẫu Nghe / Nghe–Đọc / Đọc).
  - `ADDED2` **(mới, v2.1)**: `153 từ` (thời gian, số liệu–thuế, chứng từ, động từ công việc, chế độ làm việc/IT, katakana, ứng xử) + `16 thẻ đồng âm` + `32 mẫu ngữ pháp G6` + `20 động từ kính ngữ` + `14 lỗi kính ngữ` + bảng đọc số/giờ.
- **Học từ trước, làm bài sau (v2.2):** mỗi lesson luôn theo luồng `Học từ → Quiz từ vựng (≥80%) → Ôn từ sai → Bài thực chiến`. Bài thực chiến (Nghe–Đọc, Đọc, 表現力, 文法語彙) khóa cho tới khi đạt quiz (có thể mở khóa thủ công trong Cài đặt).
- **Quy tắc chống học vẹt:** Không hiển thị đáp án hay transcript trước khi người học chọn câu trả lời. Sau khi nộp bài mới mở giải thích chi tiết (bằng chứng trong bài + lý do các lựa chọn khác sai).

---

## 2. Cấu trúc đề thật & Kiểm kê mục tiêu nội dung

### 2.1 Cấu trúc đề BJT CBT (80 câu, ~105 phút)

| Phần | Thời gian | Dạng câu | Số câu |
| --- | --- | --- | --- |
| **第1部 聴解** | ~45 phút | 描写問題 (tranh, nghe nhận định) · 表現力問題 (chọn cách nói) · 聴解問題 (hội thoại/độc thoại) | 5 · 10 · 10 = **25** |
| **第2部 聴読解** | ~30 phút | 状況把握問題 · 描写問題 (biểu đồ/bảng) · 聴読解問題 (nghe + tài liệu) | 5 · 10 · 10 = **25** |
| **第3部 読解** | ~30 phút | 文法語彙問題 · 表現力問題 · 短文読解問題 | 10 · 10 · 10 = **30** |

> **Lưu ý quan trọng:** Phần 3 chỉ có **~30 phút cho 30 câu** (~1 phút/câu) → Mock Test **phải bấm giờ cứng**, không cho phép tạm dừng.

### 2.2 Kiểm kê kiến thức

| Hạng mục | Đã có | Bổ sung | Tổng mục tiêu trong App |
| --- | --- | --- | --- |
| **Từ vựng & Collocation** | 264 (`SOURCE`) + 46 (`ADDED`) | +153 (`ADDED2`) + 16 thẻ đồng âm | **463 mục + 16 thẻ** |
| **Cụm cố định & Ý gián tiếp** | 15 cụm + 9 câu gián tiếp + 8 từ đệm | — | **32 cụm** |
| **Kính ngữ (`敬語`)** | 18 động từ, công thức, 11 lỗi sai | +20 động từ, bảng 5 nhóm, +14 lỗi, 5 tình huống ngôi thứ 3 | **38 động từ, 25 lỗi bẫy** |
| **Ngữ pháp công sở (N2)** | 51 mẫu + 5 cặp dễ nhầm | +32 mẫu (G6) + 6 cặp dễ nhầm | **83 mẫu, 11 cặp** |
| **Đọc số / ngày / giờ khi nghe** | 0 | Bảng đọc + thẻ Nghe → Chọn | **1 bộ thẻ** |

### 2.3 Kiểm kê câu luyện tập theo dạng đề thật

| Dạng câu | Số câu / đề thật | Mục tiêu tối thiểu (≈3 đề luyện) | Mục tiêu đầy đủ (≈5 đề luyện) | Hiện có (file 04 + 06) |
| --- | --- | --- | --- | --- |
| 描写 (Phần 1) | 5 | 15 | 25 | 2 (file 06) |
| 表現力 — Nghe | 10 | 30 | 50 | 3 (file 06) |
| 聴解 | 10 | 30 | 50 | 6 (file 04 + 06) |
| 状況把握 | 5 | 15 | 25 | **0** (chưa rõ khuôn) |
| 描写 (Phần 2, biểu đồ) | 10 | 30 | 50 | 2 (file 06) |
| 聴読解 | 10 | 30 | 50 | 2 (file 04) |
| 文法語彙 | 10 | 30 | 50 | 10 (file 06) |
| 表現力 — Đọc | 10 | 30 | 50 | 5 (file 04 + 06) |
| 短文読解 | 10 | 30 | 50 | 2 (file 04 + 06) |
| **Cộng luyện tập** | **80** | **240** | **400** | **32** (~13% mức tối thiểu) |
| **Mock Test** | 80 | 3 đề = 240 | 3 đề = 240 | 0 |

> v2.0 ghi mục tiêu chỉ 95–120 câu cho cả phần Nghe/Nghe–Đọc/Đọc: **thấp hơn một nửa** so với lượng cần để luyện đủ các dạng. v2.1 đặt mức tối thiểu 240 câu luyện + 240 câu Mock.

---

## 3. Lộ trình 10 PART (Tối ưu cho trình độ trên N3)

Mỗi PART gồm **3 bài học thực chiến (`L01–L03`)** + **1 bài kiểm tra PART (`L04` — 20 câu, đạt ≥ 70% để qua)**.
Mỗi bài `L01–L03` nên có **đủ 4 loại**: *1 Nghe/Nghe–Đọc · 1 表現力 · 1–2 文法語彙 · 1 Đọc*, và *1 描写* xen kẽ mỗi 2 bài.

| PART | Chủ đề trọng tâm | Kiến thức cốt lõi | Kỹ năng thực hành chính |
| --- | --- | --- | --- |
| **P01** | Tổ chức, chức danh & Kính ngữ `内/外` | `CO-01..20`, `PS-01..18`, `CL-01..07`, `WK-16`, `ET-*` + Kính ngữ 1.1–1.4 + `C1–C4` (file 05) | Phân biệt công ty mình/đối tác; nghe giới thiệu, chốt việc; `G6-01` |
| **P02** | Điện thoại, tiếp khách & Từ đệm | `OF-01..13`, `FX-01..15`, `CS-01..08`, `KT-02`, `ET-01..13`, Mẫu điện thoại 3.1 | Nghe nhận lời nhắn; **ghi số điện thoại, tên, giờ**; `G6-04, 27, 28` |
| **P03** | Đơn hàng, báo giá & Logistics | `TR-01..17`, `LG-01..13`, `NM-08..20`, `DC-01..03, 08`, `KT-03, 13, 14, 23`, `G1-*`, `G2-*`, `G6-16, 20` | **聴読解:** Nghe đổi đơn hàng + đối chiếu báo giá/lịch giao; **thuế込/抜** |
| **P04** | Đàm phán, hợp đồng & Ý gián tiếp | `NG-01..15`, `CT-01..13`, `IN-01..09`, `AC-01..08, 17, 18`, `HM-03, 05, 07, 10`, `G4-*`, `G6-02, 03, 08, 15, 19, 25, 31` | Bắt `本音`: đồng ý / chờ duyệt / trì hoãn / từ chối khéo |
| **P05** | Email, thông báo & Bẫy điều kiện | `G5-*`, Mẫu email 3.2–3.3, `TR-A01..16`, `TM-*`, `NM-01, 24, 25`, `DC-09..20`, `G6-09, 13, 17, 18, 26` | **読解:** Email/thông báo nhiều ngoại lệ; `まで` vs `までに`; **以上/超える** |
| **P06** | Tài chính, số liệu & Biểu đồ | `FN-01..23`, `EC-01..17`, `DT-01..12`, `NM-02..07, 17..22`, `TM-03..08`, `G3-*`, `G6-06, 07, 11, 21` | **描写 biểu đồ + 聴読解:** nghe báo cáo, nhìn bảng/biểu đồ, **ポイント vs %** |
| **P07** | Nhân sự, họp hành & Tiến độ | `HR-01..21`, `MT-01..22`, `PH-01..18`, `WK-01..08, 15, 17`, `AC-05, 06, 15, 16`, Mẫu họp 3.4 | Nghe họp 2–3 người, chốt **Next Action**; `HM-04` |
| **P08** | Bán hàng, sản xuất & Xử lý khiếu nại | `SL-01..20`, `PD-01..15`, `AC-10..14, 19..22`, `WK-09..12`, `KT-04, 05, 12, 17..19, 24`, Lỗi kính ngữ `KE-*` | Xử lý tình huống khó: xin lỗi khách, giải thích hàng lỗi; `G6-05, 10, 23, 24, 32` |
| **P09** | Tổng ôn Nghe & Nghe–Đọc | Trộn toàn bộ P01–P08; **bắt buộc có hội thoại 3 người** | Nghe tốc độ chuẩn BJT, nhiều yếu tố gây nhiễu, **bẫy đổi ý giữa chừng** |
| **P10** | Tổng ôn Đọc & 3 Đề Mock Test | 3 đề mô phỏng **80 câu, 105 phút** + Sổ lỗi cá nhân | Làm đề bấm giờ cứng (45 / 30 / 30 phút), phân tích lỗi theo 17 mã lỗi |

### 3.1 Luồng học và cấu trúc chuẩn của mỗi lesson (v2.2)

```text
Học từ (bảng từ + ví dụ + mẹo/bẫy BJT + cặp dễ nhầm + thẻ HM)
  → Quiz từ vựng (≥1 câu/từ, đáp án + giải thích hiện NGAY sau mỗi câu, đạt ≥ 80%)
  → Ôn từ sai (từ liên quan đến câu sai tự vào Hộp 1 Leitner)
  → Bài thực chiến: Điểm cần nhớ · Nghe–Đọc · Đọc · 表現力 · 文法語彙
  → (L04) Bài kiểm tra PART 20 câu, đạt ≥ 70%
```

- **Cấu trúc bảng từ:** `| ID | Từ | Cách đọc | Nghĩa tiếng Việt | Ví dụ công sở (JP → VN) | Mẹo nhớ / Bẫy BJT |`, chia theo nhóm A/B/C; từ ID thuộc file `02`.
- **Cấu trúc quiz:** `| ID | Câu | Lựa chọn | Đáp án | Giải thích (ghi ID từ trong backtick) | Tags |`, ID dạng `P04-L01-V01`; ngưỡng đạt = 80% làm tròn lên (ví dụ 19 câu → 16).
- **Thẻ `HM-*`** (đồng âm / gần nghĩa) được học và hỏi ngay trong lesson chứa chúng.

### 3.2 Trạng thái nội dung & quy ước tên file

| File | PART | Trạng thái | Quiz từ vựng / lesson |
| --- | --- | --- | --- |
| `04-LESSONS-P01-CONTENT-v2.1.md` | P01 | ✅ Đã có mục 0 | L01 22 · L02 18 · L03 15 câu |
| `05-LESSONS-P02-CONTENT-v2.1.md` | P02 | ✅ Đã có mục 0 | 16 · 16 · 18 |
| `06-LESSONS-P03-ORDERS-LOGISTICS-v2.1.md` | P03 | ✅ Đã có mục 0 | 21 · 22 · 21 |
| `07-LESSONS-P04-NEGOTIATION-CONTRACT-v2.1.md` | P04 | ✅ Viết mới (L01–L04) | 19 · 19 · 18 + kiểm tra 20 câu |
| `08-LESSONS-P05-…md` | P05 | ⏳ Kế tiếp | — |
| `09`…`13` | P06–P10 | ⏳ Chưa làm | — |

> **Quy ước:** `số file = số PART + 3` (PART 01 → file 04). Prompt Gemini **không** chiếm số file: nằm trong Phụ lục A của file này.
> **Vấn đề đã biết (chưa sửa, ngoài phạm vi từ vựng):** `P02-L04-T10` trùng `P02-L03-G05`; `P02-L04-T07` có đáp án mơ hồ; `P02-L04-T17` sai chính tả "折り返させましょうか"; năm từ tạm `NEW-P01-01..05` (実施する, 定例, 経費精算, 押さえる, 空き) **chưa có trong file `02`** — cần thêm để parser nối đúng ID.

---

## 4. Tiêu chuẩn Âm thanh tiếng Nhật (Trọng tâm của App)

Không dùng giọng Web Speech API mặc định của trình duyệt làm giọng chính vì ngắt nghỉ thiếu tự nhiên và **mỗi máy một giọng khác nhau** (chỉ giữ làm phương án dự phòng khi thiếu file MP3). App sử dụng **Audio `.mp3` tạo sẵn** từ engine TTS tiếng Nhật chất lượng cao:

- **Engine & Giọng đọc đề xuất:**
  - Microsoft Edge TTS (miễn phí, chất lượng neural tự nhiên): `ja-JP-NanamiNeural` (Nữ), `ja-JP-KeitaNeural` (Nam), thêm giọng Nam/Nữ khác (ví dụ `ja-JP-DaichiNeural`, `ja-JP-AoiNeural`, `ja-JP-ShioriNeural`) cho hội thoại **3 người**; **kiểm tra danh sách giọng hiện có** bằng `edge-tts --list-voices` vì danh sách có thể đổi.
  - Hoặc Google Cloud TTS Neural2 (`ja-JP-Neural2-B/C/D`) / VOICEVOX.
- **Người dẫn đề (narrator):** Dùng một giọng riêng, tách biệt với nhân vật hội thoại, để đọc câu dẫn tình huống của dạng 表現力 và các phương án nói.
- **Tốc độ chuẩn BJT:**
  - **Chế độ Thi / Kiểm tra:** Cố định **1.0x**. *(Số "300–350 mora/phút" ở bản trước gần với tốc độ đọc tin, chậm hơn hội thoại công sở tự nhiên; hãy đối chiếu bằng đề mẫu chính thức rồi cân nhắc rate +0–10%.)*
  - **Chế độ Học / Ôn:** Cho phép chỉnh **0.85x / 1.0x / 1.15x**, có nút tua lùi 5 giây và lặp lại câu.
- **Phân vai hội thoại:** Mọi đoạn hội thoại 2–3 người bắt buộc tách giọng riêng cho từng người để luyện kỹ năng nhận diện vai trò (`SPEAKER_ROLE`).
- **Số, ngày, giờ, số điện thoại:** viết bằng kana trong script TTS (ví dụ `ゼロさんの、ごーにーきゅーいち…`) để đọc đúng.
- **Quy tắc hiển thị Transcript:** Luôn ẩn script tiếng Nhật và bản dịch tiếng Việt khi làm bài; chỉ mở sau khi người học chọn đáp án.
- **Tùy chọn nâng cao (chế độ Thi):** hiệu ứng nhiễu nền nhẹ / đường dây điện thoại (lọc băng thông) cho bài điện thoại, để quen với điều kiện thực.

---

## 5. Hệ thống Ôn tập & Đánh giá tiến độ

### 5.1 Ôn từ vựng theo hộp (Leitner 5 hộp)

| Hộp | Khoảng cách ôn tiếp theo | Trạng thái | Dạng thẻ xoay vòng |
| --- | --- | --- | --- |
| 1 | 1 ngày | Mới học / vừa sai | Nhật → Việt / Nghe → Nghĩa |
| 2 | 3 ngày | Bắt đầu nhớ | Nhật → Cách đọc / Việt → Nhật |
| 3 | 7 ngày | Khá chắc | Điền từ vào câu có ngữ cảnh |
| 4 | 14 ngày | Chắc (tính là đã thuộc) | Nghe câu → Chọn nghĩa / Điền từ |
| 5 | 30 ngày | Thuộc sâu | Tình huống ngắn → Chọn cách nói phù hợp |

- **Quy tắc chuyển hộp:** Trả lời đúng → lên 1 hộp (tối đa hộp 5). Trả lời sai → về hộp 1 và tăng `lapses` + 1. Sai 2 lần liên tiếp → đưa vào **Danh sách từ khó** (hiện mỗi ngày cho đến khi đúng 2 lần liền).
- **Phiên ôn hằng ngày (20–30 phút):** Tối đa 25 từ đến hạn + tối đa 8 từ khó + 5 câu trộn ngữ pháp/tình huống + 1 bài mới (khi số từ tồn đọng < 40).
- **Thẻ đặc biệt (mới):** `HM-*` (đồng âm: chọn từ đúng cho câu) và **thẻ đọc số/giờ** (nghe → chọn số; mục D file 05) luôn nằm trong phiên ôn từ hộp 2 trở lên.

### 5.2 Sổ lỗi cá nhân (**17** mã lỗi)

Mỗi câu sai được lưu kèm 1–2 mã lỗi để Dashboard thống kê điểm yếu thực tế:

- **Nhóm kiến thức:** `VOCAB_UNKNOWN` (không biết từ), `READING_UNKNOWN` (sai cách đọc), `COLLOCATION` (sai kết hợp từ), `GRAMMAR` (sai cấu trúc), `KEIGO_REGISTER` (sai kính ngữ/độ trang trọng).
- **Nhóm kỹ năng BJT:** `SPEAKER_INTENT` (hiểu sai ý thật/hàm ý), `SPEAKER_ROLE` (nhầm người làm/người nhận), `NEGATION_CONDITION` (bỏ sót phủ định/điều kiện/ngoại lệ), `NUMBER_TIME` (nhầm số liệu/ngày giờ), `DOCUMENT_MATCH` (đối chiếu sai giữa Audio và Tài liệu), `DETAIL_MISS` (bỏ sót chi tiết), `INFERENCE` (suy luận thiếu căn cứ), `TIME_PRESSURE` (thiếu thời gian), `GUESS` (chọn do đoán).
- **Mới (v2.2):** `INDIRECT_INTENT` (đọc nhầm 本音: nhầm `検討` / `善処` / `少々難しい` với đồng ý hoặc ngược lại; xếp dưới nhóm kỹ năng BJT, thống kê riêng).
- **Mới (v2.1):** `IMAGE_DETAIL` (nhầm chi tiết tranh/biểu đồ ở dạng 描写), `EXPRESSION_FIT` (chọn cách nói không hợp tình huống/độ trang trọng ở dạng 表現力).

### 5.3 Chỉ số sẵn sàng thi (tham khảo nội bộ)

Gắn với 3 phần của đề thật (25 · 25 · 30 câu):

```text
sẵn_sàng = 0.30 × chính_xác_第1部_聴解   (gồm 描写, 表現力 nghe, 聴解)
         + 0.30 × chính_xác_第2部_聴読解 (gồm 状況把握, 描写 biểu đồ, 聴読解)
         + 0.40 × chính_xác_第3部_読解   (gồm 文法語彙, 表現力 đọc, 短文読解)
```

- Theo dõi riêng **độ chính xác kính ngữ/tình huống** (`KEIGO_REGISTER`, `EXPRESSION_FIT`) như chỉ số phụ; nếu < 70%, ưu tiên ôn trước khi làm Mock.
- Dưới 55%: Nên ôn lại phần nền và từ khó.
- 55% – 70%: Tiếp tục luyện, tập trung vào 3 mã lỗi lặp lại nhiều nhất.
- Từ 70% trở lên: Đủ điều kiện làm 3 đề Mock Test ở PART 10. *(Lưu ý: Đây là chỉ số theo dõi nội bộ, không phải điểm chuẩn hóa BJT chính thức; BJT dùng thang quy đổi riêng 0–800.)*

---

## 6. Cấu trúc Dữ liệu & Yêu cầu UX cho App

### 6.1 Cấu trúc thư mục gợi ý
```text
bjt-j2-app/
├── docs/
│   ├── 01-BJT-J2-APP-SPEC.md
│   ├── 02-VOCAB-PHRASES-MASTER.md      (từ vựng + cụm cố định + từ đệm + đồng âm)
│   ├── 03-GRAMMAR-KEIGO-TEMPLATES.md   (kính ngữ + ngữ pháp N2/BJT + đọc số/giờ)
│   ├── 04-LESSONS-P01-CONTENT-v2.1.md  (PART 01: Tổ chức, Chức danh & Kính ngữ)
│   ├── 05-LESSONS-P02-CONTENT-v2.1.md  (PART 02: Điện thoại, Tiếp khách & Lời nhắn)
│   ├── 06-LESSONS-P03-ORDERS-LOGISTICS-v2.1.md (PART 03: Đơn hàng, Báo giá & Logistics)
│   ├── 07-LESSONS-P04-NEGOTIATION-CONTRACT-v2.1.md (PART 04: Đàm phán, Hợp đồng & Ý gián tiếp)
│   └── 08-… (PART 05, kế tiếp; số file = PART + 3)
├── data/
│   ├── vocab.json            (02 + 05 mục A)
│   ├── homophones.json       (05 mục A8)
│   ├── phrases.json
│   ├── grammar_keigo.json    (03 + 05 mục B, C)
│   ├── number_reading.json   (05 mục D)
│   └── lessons/p01.json ... p10.json
├── images/
│   └── P01-L03-D01.svg ...
└── audio/
    └── P01-L01-A01.mp3 ...
```

### 6.2 Khuôn JSON chuẩn cho 1 câu hỏi
```json
{
  "id": "P01-L02-LR01-E01",
  "questionType": "listening_reading",
  "section": 2,
  "skill": "listening_reading",
  "errorTags": ["DOCUMENT_MATCH", "NUMBER_TIME"],
  "audioFile": "audio/P01-L02-LR01.mp3",
  "voices": ["NanamiNeural", "KeitaNeural"],
  "imageFile": null,
  "imageSpec": null,
  "scriptJa": "...",
  "scriptVi": "...",
  "documentMarkdown": "| ... |",
  "promptJa": "2人はどの会議室を何時に予約しますか。",
  "options": ["A...", "B...", "C...", "D..."],
  "optionsAudio": null,
  "answerIndex": 1,
  "explanationVi": "Giải thích chi tiết bằng chứng và lý do loại các đáp án khác."
}
```

Giá trị `questionType`: `depiction` (描写), `expression_listening`, `expression_reading` (表現力), `listening` (聴解), `situation` (状況把握), `listening_reading` (聴読解), `grammar_vocab` (文法語彙), `short_reading` (短文読解). Với `expression_listening`, các phương án được đọc bằng `optionsAudio`; với `depiction`, dùng `imageFile` + `optionsAudio`.

### 6.3 Yêu cầu UX tối giản cho người lớn
- Mobile-first, chữ Nhật rõ nét (font Noto Sans JP / Hiragino), có nút bật/tắt Furigana ở chế độ học (tắt ở chế độ thi).
- Một màn hình = một câu hỏi / một thẻ từ, nút bấm cao tối thiểu 44px.
- Chế độ Thi: đồng hồ đếm ngược theo phần (45 / 30 / 30 phút), không tạm dừng, không quay lại câu Nghe đã phát.
- Lưu tiến độ cục bộ (`localStorage` / `IndexedDB`) kèm nút Export/Import JSON dự phòng.
- **Mỗi lesson hiển thị đúng luồng ở mục 3.1**; quiz từ vựng cho phản hồi ngay sau mỗi câu (khác chế độ Thi: không phản hồi giữa chừng).

> **Ghi chú tương thích JSON:** khuôn ở 6.2 là khuôn câu hỏi chuẩn dài hạn. Parser của Web App (mục 7, Phụ lục A) tạo JSON theo **lesson** (từ vựng, quiz, bài nghe, đọc…) và có thể ánh xạ sang 6.2 sau; hai khuôn không mâu thuẫn.

---

## 7. Đặc tả Web App (tóm tắt quyết định; chi tiết đầy đủ ở Phụ lục A)

| Hạng mục | Quyết định |
| --- | --- |
| Thiết bị mục tiêu | **iPhone 15, Safari** (393×852 pt, iOS 17+); chạy được trên Android, iPad, máy tính |
| Công nghệ | HTML/CSS/JS thuần (ES modules), SPA hash routing, **PWA** (manifest + service worker), không backend, không CDN ngoài, 100% miễn phí |
| Âm thanh | **MP3 tạo sẵn bằng `edge-tts`** (Nanami / Keita / giọng thứ ba nếu có; narrator riêng), phát bằng một thẻ `<audio>` từ thao tác chạm; Web Speech API chỉ là dự phòng |
| Tốc độ phát | Học/Ôn: 0.85× / 1.0× / 1.15× (theo mục 4); Thi: cố định 1.0× |
| Dữ liệu | Script `parse_md.py` biến file `04…` thành JSON theo lesson; `generate_audio.py` tạo MP3 theo ID (từ, ví dụ, từng dòng thoại) |
| Điều hướng | Thanh tab dưới 4 mục: **Học · Ôn · Tiến độ · Cài đặt** |
| Ôn tập | Leitner 5 hộp (mục 5.1); từ sai trong quiz tự vào Hộp 1 |
| Lưu trữ | `localStorage` (bọc try/catch) + **Export/Import JSON**; nhắc sao lưu mỗi 7 ngày (Safari có thể xóa dữ liệu web sau ~7 ngày không dùng nếu chưa "Thêm vào MH chính") |
| Khóa mở | Thực chiến khóa tới khi quiz ≥80%; L04 mở sau L01–L03; mở khóa thủ công trong Cài đặt |
| Phát hành | GitHub Pages hoặc Cloudflare Pages (miễn phí); thêm vào Màn hình chính để dùng như app |

**Giai đoạn 1 (MVP):** Học từ (thẻ + danh sách) · Quiz · Ôn Leitner · Nghe–Đọc có script ẩn/hiện · Đọc · 表現力 · 文法語彙 · L04 · Tiến độ + Sổ lỗi · Cài đặt/Sao lưu.
**Giai đoạn 2:** Mock Test bấm giờ cứng (P10), 描写 có hình, đồng hồ theo phần 45/30/30, nhiễu đường dây điện thoại, shadowing, thông báo nhắc học.

---

## Phụ lục A. Prompt hoàn chỉnh để Gemini xây Web App

> **Cách dùng:** (1) Mở Gemini (bản có code / AI Studio). (2) Đính kèm các file `01…07-*.md` (và `08+` khi đã có). (3) Dán nguyên phần **A.1**. (4) Nếu Gemini dừng giữa chừng, gõ `tiếp`.

### A.1 PROMPT (dán nguyên văn vào Gemini)

Bạn là senior front-end engineer, chuyên **mobile web (iOS Safari)** và **ứng dụng học ngôn ngữ**. Hãy xây dựng cho tôi một **web app học tiếng Nhật thương mại BJT J2**, dùng cho **một người học (tôi)**, chạy tốt nhất trên **iPhone 15 (Safari, viewport 393×852 pt, iOS 17+)**, đồng thời mở được trên **mọi thiết bị/trình duyệt** (Android Chrome, iPad, Mac/Windows Chrome-Edge-Firefox-Safari).

Tôi đính kèm các file markdown của khóa học (`01` spec, `02` từ vựng master, `03` ngữ pháp/kính ngữ, `04`–`07` nội dung PART 01–04, và các file `08+` khi đã có). **Nội dung học lấy từ các file này, không tự bịa thêm.** Trả lời bằng tiếng Việt; code và comment bằng tiếng Anh; giao diện app dùng tiếng Việt + tiếng Nhật.

### 1. Mục tiêu & nguyên tắc

1. **Học thuộc từ vựng trước, làm bài thi sau.** Luồng mỗi lesson: `Học từ → Quiz từ vựng (≥80%) → Ôn từ sai → Bài thực chiến (Nghe–Đọc, Đọc, 表現力, 文法語彙) → Bài kiểm tra L04`.
2. **Đơn giản, hiệu quả, dùng được bằng một tay** (ngón cái). Ít màn hình, ít nút, chữ to.
3. **100% miễn phí, không backend, không đăng nhập, không API trả phí, không CDN ngoài.** Mọi thứ là file tĩnh, chạy offline sau lần tải đầu (PWA).
4. **Âm thanh tiếng Nhật chuẩn nhất có thể mà miễn phí** (xem mục 4), phát được trên mọi thiết bị.
5. Dữ liệu tiến độ lưu trên máy (localStorage), có **xuất/nhập JSON** để sao lưu.

### 2. Công nghệ (bắt buộc)

- **HTML + CSS + JavaScript thuần (ES modules)**. Không React/Vue/build tool. Không thư viện ngoài (nếu thật cần, tự viết < 100 dòng).
- **Một trang (SPA) dùng hash routing** (`#/home`, `#/lesson/P04-L01`, `#/quiz/P04-L01`, …) để deploy lên hosting tĩnh không cần cấu hình.
- **PWA:** `manifest.webmanifest`, `service-worker.js` (cache-first cho app shell + JSON; **audio cache theo yêu cầu**), icon 180×180 (`apple-touch-icon`), `apple-mobile-web-app-capable`, `theme-color`, màn hình splash đơn giản.
- Tổng code app **≤ ~1.500 dòng**, chia file rõ ràng, có comment ngắn.
- Hỗ trợ **Light / Dark tự động** (`prefers-color-scheme`) + nút chọn thủ công trong Cài đặt.

### 3. Dữ liệu: biến markdown → JSON

Viết **script Python `tools/parse_md.py`** (chỉ dùng thư viện chuẩn) đọc các file `04`–`07` (+ `02` để lấy master từ vựng nếu cần) và sinh ra thư mục `data/`:

```
data/index.json               # danh sách PART → lesson (id, tiêu đề, số từ, số câu quiz, ngưỡng đạt)
data/lessons/P04-L01.json     # 1 file / lesson
data/review-pool.json         # tất cả từ + câu hỏi (để ôn tập chéo)
```

**Định dạng markdown cần parse (đã thống nhất, hãy parse khoan dung và in cảnh báo khi dòng không khớp):**

- Tiêu đề lesson: `## LESSON P04-L01 — Tên bài (...)`. Bài kiểm tra: `## LESSON P04-L04 — BÀI KIỂM TRA ...`.
- Mục `### 0. HỌC TỪ VỰNG TRƯỚC KHI LÀM BÀI` chứa:
  - `#### Bước 1 — Học từ (N từ)`: nhiều bảng theo nhóm (`**Nhóm A — ...**`). Cột: `| ID | Từ | Cách đọc | Nghĩa tiếng Việt | Ví dụ công sở (JP → VN) | Mẹo nhớ / Bẫy BJT |`. ID nằm trong dấu backtick, ví dụ `` `NG-01` ``. Cột ví dụ có dạng `câu Nhật。→ nghĩa Việt.` (tách bằng `→`). Tiêu đề cột 2 có thể là `Từ / Cụm`.
  - Dòng `**Thẻ phân biệt (`HM`)**` + các gạch đầu dòng `- `HM-10` **提案** (...) / **提示** (...)`; và mục `**Cặp dễ nhầm cần nhớ**`.
  - `#### Bước 2 — Quiz từ vựng (N câu · đạt ≥ X/N)`: bảng `| ID | Câu | Lựa chọn | Đáp án | Giải thích | Tags |`. Lựa chọn dạng `A. ...　B. ...　C. ...　D. ...` (ngăn cách bằng **dấu cách toàn góc U+3000**). Đáp án dạng `**B**`. Giải thích có ID từ trong backtick. Tags trong backtick (`VOCAB_UNKNOWN`, `COLLOCATION`, `EXPRESSION_FIT`, `KEIGO_REGISTER`, `NUMBER_TIME`, `DOCUMENT_MATCH`, `NEGATION_CONDITION`, `INDIRECT_INTENT`, `DETAIL_MISS`, `SPEAKER_INTENT`, `INFERENCE`, `GRAMMAR`, `READING_UNKNOWN`).
  - `#### Bước 3 — Ôn lại từ sai`.
- `### 1. Điểm cần nhớ nhanh`: gạch đầu dòng → hiển thị như thẻ ghi chú.
- Bài **Nghe–Đọc** (`### 2. ... (`P04-L01-LR01`)`): có `**Audio ID:**`, bảng tài liệu hiển thị (markdown table + blockquote), `**Script (JP ...)**` là các dòng blockquote `> **男（木村・東洋物産）：** câu thoại`, `**Dịch (VN ...)**` tương ứng, rồi các khối câu hỏi:
  ```
  - **Câu hỏi (`P04-L01-E01` · skill: ... · tags: `A`, `B`):**
    câu hỏi
    - A. ...
    - B. ...
  - **Đáp án:** **C**
  - **Giải thích:** ...
  ```
- Bài **Đọc** (`### 3. ...`): đoạn blockquote + khối câu hỏi cùng định dạng.
- **表現力** (`### 4.`): câu hỏi dạng gạch đầu dòng `- A. ...` + `**Đáp án:**` + `**Giải thích:**`.
- **文法語彙問題** (`### 5.`): bảng giống Quiz.
- **L04 (kiểm tra):** các bảng `T01…T20` (cột `| ID | Câu | Lựa chọn | Đáp án | Giải thích | Tags |` hoặc `| ID | Câu hỏi | ...`), 1–2 bài nghe `Script (JP)` theo `### Bài nghe A (`...-A01`) — T15, T16, T17`, và bảng chấm điểm `14–20 (≥ 70%) → Đạt`.

**Schema JSON gợi ý** (bạn có thể cải tiến nhưng phải nhất quán và ghi rõ):

```json
{
  "id": "P04-L01", "part": "P04", "title": "Đàm phán giá & điều kiện",
  "vocab": [{"id":"NG-01","group":"Nhóm A — Bàn bạc & đưa điều kiện","word":"交渉","reading":"こうしょう",
             "meaning":"Đàm phán","exJp":"価格について交渉します。","exVi":"Đàm phán về giá.","tip":"..."}],
  "cards": [{"id":"HM-10","html":"..."}],
  "vocabQuiz": {"passAt": 16, "total": 19,
    "items":[{"id":"P04-L01-V01","q":"「交渉」の意味は？","options":{"A":"...","B":"..."},
              "answer":"B","explain":"...","tags":["VOCAB_UNKNOWN"],"vocabIds":["NG-01"]}]},
  "notes": ["..."],
  "listening": [{"id":"P04-L01-LR01","doc":"<html bảng>","lines":[{"speaker":"男","name":"木村","text":"..."}],
                 "translation":["..."],"questions":[...]}],
  "reading": [...], "expression": [...], "grammar": [...]
}
```

Script phải **in báo cáo kiểm tra** sau khi chạy: số từ / số câu quiz / số bài nghe mỗi lesson, ID trùng, câu hỏi không có đáp án, từ nào không xuất hiện trong phần giải thích của quiz, và đáp án không nằm trong A–D.

### 4. Âm thanh tiếng Nhật: miễn phí, chuẩn, chạy mọi thiết bị

**Giải pháp bắt buộc: tạo sẵn file MP3 bằng giọng neural miễn phí rồi phát bằng thẻ `<audio>`** (không phụ thuộc giọng cài trong máy, nên iPhone/Android/PC nghe giống nhau).

1. Viết **`tools/generate_audio.py`** dùng thư viện **`edge-tts`** (Python, miễn phí, giọng Microsoft Neural):
   - Giọng nữ **`ja-JP-NanamiNeural`**, giọng nam **`ja-JP-KeitaNeural`**; nếu có thể thì thêm `ja-JP-DaichiNeural` (kiểm tra bằng `edge-tts --list-voices`, **nếu không có thì tự động fallback sang Keita**).
   - Đọc `data/lessons/*.json` và tạo:
     ```
     audio/words/{ID}.mp3                 # đọc "reading" (kana) hoặc "word" nếu là cụm; tốc độ -10%
     audio/examples/{ID}.mp3              # câu ví dụ tiếng Nhật; tốc độ 0%
     audio/quiz/{QUIZ_ID}.mp3             # chỉ câu hỏi nghe (nếu có), tùy chọn
     audio/listening/{LR_ID}/{nn}.mp3     # MỖI DÒNG thoại một file, đúng giọng theo người nói (男/女; nhiều nam thì Keita/Daichi)
     audio/manifest.json                  # danh sách file + kích thước + hash văn bản (để chỉ tạo lại file đổi nội dung)
     ```
   - **Bỏ qua file đã có** (chạy lại nhanh), có **retry + giới hạn song song (≤ 4)** + log tiến độ.
   - Chuẩn hóa văn bản trước khi đọc: bỏ `**`, bỏ phần trong ngoặc ghi chú như `（…）` chỉ dùng để hiển thị, **đổi số và ngày sang kana** khi bài yêu cầu (ví dụ `12月4日` → `じゅうにがつよっか`; `9万5千円` → `きゅうまんごせんえん`) bằng bảng quy tắc nhỏ + **file ghi đè thủ công `tools/tts_overrides.json`** (khóa = ID hoặc nguyên văn, giá trị = chuỗi kana sẽ đọc). Tạo sẵn vài ví dụ trong file này.
   - Xuất bitrate vừa phải (mono, ~48 kbps) để cả khóa học < ~40 MB.
   - In ra **danh sách "cần nghe kiểm tra bằng tai"** (chữ có nhiều cách đọc, số, ngày, tên riêng) để tôi soát nhanh.
2. **Trình phát trong app (`js/audio.js`):**
   - **Một** thẻ `Audio` dùng lại; luôn phát **từ thao tác chạm của người dùng** (luật autoplay của iOS); không autoplay khi vào trang.
   - Nút tốc độ **0.85× / 1.0× / 1.15×** (theo mục 4) (`playbackRate`, bật `preservesPitch`).
   - **Hàng đợi** để phát bài nghe nhiều dòng liền nhau (khoảng nghỉ 0.4 s), tô sáng dòng đang phát, nút ⏮ ⏯ ⏭ và "lặp lại dòng này".
   - **Fallback:** nếu thiếu file MP3 (404/lỗi) thì dùng **Web Speech API** (`speechSynthesis`, `lang = "ja-JP"`, ưu tiên voice Kyoko/Otoya/O-Ren/Google 日本語), kèm thông báo nhỏ "đang dùng giọng dự phòng".
   - Preload `metadata` thôi; có nút **"Tải sẵn offline cho PART này"** (hiện % tiến độ) để cache audio vào Cache Storage.
3. **Hướng dẫn chạy** `pip install edge-tts` → `python tools/parse_md.py` → `python tools/generate_audio.py` (ghi rõ lệnh và thời gian ước tính).

### 5. Giao diện: nguyên tắc

- **Mobile-first cho iPhone 15:** thiết kế ở 393 px; dùng `100dvh`, `env(safe-area-inset-*)` (Dynamic Island + thanh Home), không để nội dung bị che; **không cuộn ngang**.
- **Vùng chạm ≥ 44×44 pt**, nút chính **cao ≥ 56 px**, đặt ở **nửa dưới màn hình** (tầm ngón cái). Input/`select` cỡ chữ **≥ 16 px** (tránh Safari tự zoom). Tắt `-webkit-tap-highlight-color`, dùng `touch-action: manipulation`.
- **Chữ:** nền 17 px; **từ Nhật 34–40 px**, cách đọc 17–18 px màu phụ, nghĩa Việt 20 px. Font stack: `-apple-system, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", system-ui, sans-serif` (không tải font ngoài).
- **Phong cách:** tối giản, nhiều khoảng trắng, **1 màu nhấn** (đề xuất chàm `#4F46E5`; đúng = xanh lá, sai = đỏ cam, không chỉ dựa vào màu mà kèm biểu tượng ✓/✗), thẻ bo góc 16 px, bóng nhẹ. Hiệu ứng ngắn (≤ 200 ms), tôn trọng `prefers-reduced-motion`.
- **Điều hướng:** **thanh tab dưới cùng 4 mục** (cố định, có safe-area): `学習 Học` · `復習 Ôn` · `進捗 Tiến độ` · `設定 Cài đặt`. Mỗi màn có nút ← ở góc trên trái.
- **Ngôn ngữ giao diện:** nhãn tiếng Việt, kèm chữ Nhật ngắn khi hữu ích (ví dụ "Ôn tập 復習").
- **Trạng thái rỗng / lỗi** đều có thông điệp thân thiện và nút hành động.

### 6. Bố cục chi tiết từng màn hình (làm đúng như wireframe, có thể tinh chỉnh nhỏ)

**6.1 Học 学習 (Trang chủ)**
```
┌──────────────────────────────┐
│ BJT J2                  🔥 5 │  ← tiêu đề + chuỗi ngày học
│ Hôm nay: Ôn 12 từ  [Bắt đầu] │  ← thẻ gợi ý việc nên làm (từ Leitner)
│ ───────────────────────────  │
│ PART 01  Tổ chức & Kính ngữ  │
│ ▓▓▓▓▓░░░░░  L01 ✓ L02 ✓ L03 │  ← thanh tiến độ + chấm trạng thái
│ PART 02  Điện thoại & Tiếp…  │
│ PART 03  Đơn hàng & Logistics│
│ PART 04  Đàm phán & Hợp đồng │
│ (PART 05–10: 🔒 sắp có)      │
├──────────────────────────────┤
│ 学習   復習●   進捗   設定   │
└──────────────────────────────┘
```
Chạm một PART → danh sách L01–L04 (L04 = kiểm tra, mở sau khi hoàn thành L01–L03, có thể bỏ qua khóa trong Cài đặt).

**6.2 Menu lesson (ví dụ P04-L01)** — danh sách các bước, hiện trạng thái từng bước:
```
← P04-L01  Đàm phán giá & điều kiện
 ① Học từ (17 từ)              [ ✓ ]
 ② Quiz từ vựng (≥16/19)       [ 15/19 ]
 ③ Ôn từ sai (3 từ)            [ ▶ ]
 ─ Bài thực chiến ─ (khóa đến khi đạt quiz)
 ④ Điểm cần nhớ
 ⑤ Nghe–Đọc 聴読解
 ⑥ Đọc 短文読解
 ⑦ 表現力
 ⑧ 文法語彙
```
**6.3 Học từ (flashcard + danh sách)** — chuyển bằng 2 tab nhỏ trên cùng: `Thẻ` | `Danh sách`.
```
 ← Nhóm A · 3/6          [Thẻ|Danh sách]
 ┌──────────────────────────┐
 │                          │
 │        交渉              │  ← mặt trước: từ Nhật rất to
 │      (chạm để lật)       │
 │          🔊              │  ← nút nghe 56px
 └──────────────────────────┘
  Mặt sau: こうしょう · Đàm phán
           例: 価格について交渉します。 🔊
               Đàm phán về giá.
           💡 Mẹo / Bẫy BJT: ...
 [ ✗ Chưa nhớ ]   [ ✓ Đã nhớ ]   ← 2 nút lớn ở đáy; vuốt trái/phải cũng được
```
"Chưa nhớ" → đưa từ vào **Hộp 1** ngay; "Đã nhớ" → lưu đã xem. Cuối nhóm hiện thẻ ghi chú `Cặp dễ nhầm` và `Thẻ phân biệt HM`.
Tab `Danh sách`: bảng gọn (từ · đọc · nghĩa), chạm một hàng để nghe và mở rộng ví dụ.

**6.4 Quiz (từ vựng, ngữ pháp, 表現力, đọc, nghe)** — **một câu mỗi màn hình**:
```
 ← Quiz từ vựng        7 / 19
 ▓▓▓▓▓▓▓░░░░░░░░░░░░
 「納期」の意味は？          🔊(nếu có)
 ┌──────────────────────────┐
 │ A  Hạn giao hàng         │  ← 4 nút to, full-width, cách nhau 12px
 │ B  Hạn thanh toán        │
 │ C  Hạn hiệu lực          │
 │ D  Hạn họp               │
 └──────────────────────────┘
 Sau khi chọn: nút chọn đổi màu ✓/✗ + hiện đáp án đúng
 ┌ Giải thích ──────────────┐
 │ 納期 (TR-05) …           │  ← chạm ID từ để xem thẻ từ + nghe
 └──────────────────────────┘
 [        Tiếp  →         ]   ← nút lớn ở đáy
```
- **Phản hồi ngay sau mỗi câu** (hiệu quả ghi nhớ hơn), sau đó tự phát âm thanh từ đúng (nếu bật trong Cài đặt).
- Trộn thứ tự câu **và** thứ tự đáp án (nhưng **hiển thị lại đúng chữ A–D theo thứ tự mới và chấm theo nội dung**, không theo chữ cái gốc).
- Đối với câu có A–D bằng tiếng Nhật dài, cho phép cuộn trong thẻ, không cắt chữ.
- **Màn kết quả:** điểm `x/y`, `ĐẠT/CHƯA ĐẠT` theo ngưỡng của lesson, danh sách câu sai kèm giải thích; nút `Làm lại câu sai` và `Ôn từ sai (vào Hộp 1)`. Từ liên quan (ID trong cột Giải thích) của **mọi câu sai** tự động vào **Hộp 1**.

**6.5 Ôn tập 復習 (Leitner)**
- 5 hộp theo **mục 5.1 của spec** (Hộp1 = 1 ngày, Hộp2 = 3 ngày, Hộp3 = 7 ngày, Hộp4 = 14 ngày = đã thuộc, Hộp5 = 30 ngày). Đúng → lên 1 hộp; sai → về Hộp 1, `lapses`+1; sai 2 lần liền → vào Danh sách từ khó (hiện mỗi ngày tới khi đúng 2 lần liền).
- Phiên ôn: hiện từ (nhật hoặc nghĩa Việt, chọn ở Cài đặt) → người học tự đánh giá `Nhớ / Quên`, **hoặc** chế độ trắc nghiệm 4 đáp án sinh tự động từ từ cùng nhóm (distractor lấy từ các từ khác cùng lesson). Đúng → lên 1 hộp; sai → về Hộp 1.
- Màn đầu: số từ đến hạn hôm nay, phân bố theo 5 hộp (thanh ngang), nút `Bắt đầu ôn (N)`; badge chấm đỏ trên tab khi có từ đến hạn.

**6.6 Bài Nghe–Đọc 聴読解**
```
 ← P04-L01-LR01
 ┌ Tài liệu ────────────────┐  ← bảng/ảnh tài liệu (cuộn ngang trong thẻ nếu rộng)
 └──────────────────────────┘
  ▶  0:00 ─────●──── 1:12     ← trình phát bài nghe (queue các dòng)
  [0.85×] [1×] [1.15×]  [⟲ dòng]
  [ Hiện script ]  [ Hiện dịch ]   ← mặc định ẨN, chạm để hiện; dòng đang phát tô sáng
  Câu 1/3 …  (4 đáp án như màn Quiz, có giải thích sau khi chọn)
```
**6.7 Bài Đọc / 表現力 / 文法語彙:** dùng cùng giao diện Quiz; bài đọc hiển thị đoạn văn trên đầu (thu gọn được), câu hỏi bên dưới.

**6.8 Bài kiểm tra L04:** 20 câu liền mạch, **không hiện đáp án giữa chừng**, không đồng hồ bắt buộc (có tùy chọn 25 phút); cuối bài hiện điểm, ngưỡng ≥14/20, thống kê **mã lỗi** (tag) và nút `Thêm các câu sai vào Sổ lỗi`.

**6.9 Tiến độ 進捗**
- Thẻ tổng quan: số từ đã học / tổng, số từ ở Hộp 4–5, chuỗi ngày học, tổng thời gian.
- **Sổ lỗi:** biểu đồ cột ngang theo mã lỗi (`VOCAB_UNKNOWN`, `NUMBER_TIME`, `INDIRECT_INTENT`, …) + chạm một mã lỗi để luyện lại đúng loại câu đó.
- Lịch sử điểm quiz mỗi lesson (ngày, điểm, đạt/chưa).

**6.10 Cài đặt 設定**
Giao diện (Tự động/Sáng/Tối) · Cỡ chữ (A− A A+) · Tốc độ âm thanh mặc định · Tự phát âm sau khi trả lời (Bật/Tắt) · Hiện cách đọc trên thẻ (Bật/Tắt) · Mở khóa mọi lesson (Bật/Tắt) · **Xuất / Nhập dữ liệu (JSON)** · **Tải sẵn offline** · Xóa dữ liệu (có xác nhận 2 bước) · Phiên bản app + ngày dữ liệu.

### 7. Lưu trữ & độ bền dữ liệu

- `localStorage` key có phiên bản (`bjt.v1`), **mọi đọc/ghi bọc `try/catch`**; app vẫn chạy (tiến độ trong bộ nhớ) nếu storage bị chặn.
- Lưu: tiến độ từng bước, điểm quiz, thẻ Leitner (`{id, box, due, history}`), sổ lỗi (đếm theo tag + câu sai gần nhất), cài đặt, chuỗi ngày học.
- **Safari iOS có thể xóa dữ liệu web nếu không dùng ~7 ngày** khi chưa "Thêm vào Màn hình chính": hiển thị **hướng dẫn 1 lần** (Chia sẻ → Thêm vào MH chính) và **nhắc sao lưu JSON** mỗi 7 ngày.

### 8. Hiệu năng, ổn định, truy cập

- Mở lần đầu < 2 s trên 4G (JSON lesson tải lười từng cái). Không chặn render bằng script.
- Mọi trạng thái focus nhìn thấy; `aria-label` cho nút biểu tượng; độ tương phản đạt WCAG AA; hỗ trợ VoiceOver cơ bản.
- Không dùng API chỉ có ở Chrome; kiểm tra tính năng (`'serviceWorker' in navigator`, `speechSynthesis`) trước khi dùng.
- Lỗi mạng/thiếu file: không bao giờ để màn hình trắng, luôn có thông báo và đường quay lại.

### 9. Cấu trúc thư mục yêu cầu

```
bjt-j2/
├─ index.html
├─ manifest.webmanifest
├─ service-worker.js
├─ css/app.css
├─ js/ app.js  router.js  store.js  audio.js  srs.js  quiz.js  views/*.js
├─ icons/ icon-180.png  icon-192.png  icon-512.png
├─ data/            (do parse_md.py sinh ra)
├─ audio/           (do generate_audio.py sinh ra)
├─ content/         (đặt 04..07-*.md vào đây)
├─ tools/ parse_md.py  generate_audio.py  tts_overrides.json
└─ README.md        (hướng dẫn chạy, kiểm tra, deploy)
```

### 10. Triển khai miễn phí & kiểm thử

- **README.md** hướng dẫn: chạy thử cục bộ (`python3 -m http.server 8080`, mở trên iPhone qua Wi-Fi cùng mạng), deploy miễn phí lên **GitHub Pages** hoặc **Cloudflare Pages** (từng bước, không cần thẻ), cách **Thêm vào Màn hình chính** trên iPhone, cách cập nhật nội dung (sửa `.md` → chạy 2 script → push).
- Cuối câu trả lời, đưa **checklist tự kiểm tra** cho tôi gồm: phát âm thanh trên Safari iPhone (kể cả khi gạt công tắc im lặng), chạy offline (bật chế độ máy bay), xoay ngang, Dark mode, thêm vào MH chính, xuất/nhập JSON, số liệu parser khớp (ví dụ P04-L01: 17 từ, 19 câu quiz, ngưỡng 16).

### 11. Cách bạn (Gemini) phải làm việc

1. **Trước khi viết code:** nêu ngắn gọn (≤ 15 dòng) kế hoạch, schema JSON cuối cùng và danh sách file. Nếu có chỗ nào trong file markdown mâu thuẫn với mô tả ở trên, **hãy liệt kê và chọn cách xử lý hợp lý, đừng hỏi lại**.
2. **Xuất từng file đầy đủ, không rút gọn, không để `// ...` hay "phần còn lại tương tự"**. Thứ tự: `tools/parse_md.py` → `tools/generate_audio.py` + `tts_overrides.json` → `index.html` → `css/app.css` → `js/*` → `service-worker.js`, `manifest` → `README.md`.
3. Nếu độ dài vượt giới hạn, **dừng ở ranh giới giữa hai file** và viết "ĐÃ XONG: …; TIẾP THEO: …". Tôi sẽ gõ `tiếp`.
4. **Không bịa nội dung học, không bịa API/thư viện.** Chỉ dùng `edge-tts` cho TTS. Nếu không chắc một tên giọng/cờ lệnh, ghi chú cách tự kiểm tra.
5. Kết thúc bằng **checklist kiểm thử** (mục 10) và **3 rủi ro lớn nhất** (ví dụ: edge-tts bị chặn mạng, giọng Daichi không có, số/ngày đọc sai) kèm cách khắc phục.

### 12. Giai đoạn 2 (chỉ làm sau khi bản MVP chạy tốt, **không làm ngay**)
Ghi âm so sánh phát âm (shadowing), tìm kiếm từ, ôn theo mã lỗi nâng cao, nhắc học hằng ngày (thông báo web push), PART 05–10 khi có thêm file.

---

### A.2 Ghi chú cho người dùng (không dán vào Gemini)

- **Vì sao dùng MP3 tạo sẵn thay vì đọc trực tiếp trong trình duyệt:** `speechSynthesis` mỗi máy một giọng (iPhone khá, nhưng Android/PC rất khác nhau, có máy không có giọng Nhật). MP3 từ giọng neural (Nanami/Keita) nghe giống nhau trên mọi thiết bị, phát offline và không tốn chi phí khi chạy. Giọng Web Speech chỉ là dự phòng.
- **Chi phí:** `edge-tts` miễn phí nhưng là dịch vụ không chính thức của Microsoft; nên tạo audio **một lần trên máy bạn rồi đưa file MP3 lên hosting**, đừng gọi lúc chạy app.
- **Bạn cần chuẩn bị:** Python 3.10+ trên máy tính, tài khoản GitHub (miễn phí) để đưa web lên.
- **Nên soát bằng tai:** số, ngày, tên người (木村, 山田…) và các chữ Hán có nhiều cách đọc; sửa trong `tools/tts_overrides.json` rồi chạy lại script.
