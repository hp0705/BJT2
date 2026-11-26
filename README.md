# BJT J2 — Web App Luyện thi Tiếng Nhật Thương mại

Ứng dụng web tối giản (PWA, HTML/CSS/JS thuần, không backend, không CDN ngoài) tối ưu cho iPhone Safari và mọi thiết bị.

## 1. Chuẩn bị & Tạo dữ liệu + Âm thanh MP3 (chỉ cần chạy trên máy tính)

Yêu cầu: Python 3.10+ và `edge-tts`:

```bash
pip install edge-tts
python tools/parse_md.py
python tools/generate_audio.py
```

- `tools/parse_md.py`: chuyển các file `04-*.md` .. `07-*.md` thành JSON trong `data/`.
- `tools/generate_audio.py`: tạo file `.mp3` tiếng Nhật giọng Neural miễn phí (`ja-JP-NanamiNeural`, `ja-JP-KeitaNeural`) vào `audio/`, tự động bỏ qua file đã có.
- Nếu phát hiện chữ/số đọc chưa chuẩn, thêm vào `tools/tts_overrides.json` rồi chạy lại `python tools/generate_audio.py`.

## 2. Chạy thử cục bộ (và mở trên iPhone qua Wi-Fi)

```bash
python -m http.server 8080
```

- Trên máy tính: mở `http://localhost:8080`
- Trên iPhone (cùng Wi-Fi): mở `http://<IP-máy-tính>:8080`
- Trên iPhone Safari: bấm **Chia sẻ → Thêm vào Màn hình chính** để dùng như app toàn màn hình và giữ dữ liệu lâu dài.

## 3. Triển khai miễn phí (GitHub Pages hoặc Cloudflare Pages)

- **GitHub Pages:** Đẩy toàn bộ thư mục lên GitHub repo → `Settings → Pages → Deploy from branch (main / root)`.
- **Cloudflare Pages:** Kết nối repo GitHub, build command để trống, output directory là `/`.

## 4. Cập nhật nội dung mới (PART 05–10)

Thêm file `08-*.md` … vào thư mục gốc rồi chạy lại:

```bash
python tools/parse_md.py
python tools/generate_audio.py
```
