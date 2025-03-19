# i18n Google Sheet Tool

Tool đồng bộ hóa file ngôn ngữ (i18n) giữa Google Sheets và JSON files.

[🇬🇧 English](README.md)

## Tính năng

- Đồng bộ hai chiều giữa Google Sheets và JSON files
- Hỗ trợ nhiều ngôn ngữ
- Tự động tạo sheet mới nếu chưa tồn tại
- Xác thực OAuth2 với Google Sheets API
- Dễ dàng tích hợp vào quy trình làm việc hiện có
- Có thể tùy chỉnh port OAuth callback để tránh xung đột

## Yêu cầu

- Node.js >= 14
- Một Google Cloud Project với Google Sheets API được kích hoạt
- OAuth2 credentials từ Google Cloud Console

## Cài đặt

```bash
# Cài đặt toàn cục
npm install -g git+https://github.com/phamlap2808/i18n-google-sheet-tool.git

# Hoặc cài đặt trong project
npm install --save-dev git+https://github.com/phamlap2808/i18n-google-sheet-tool.git
```

## Cấu hình

1. Tạo file `.env` trong thư mục gốc của project:

```env
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
LOCALES_DIR=./locales
OAUTH_PORT=8591  # Tùy chọn, mặc định là 8591
```

2. Lấy Google OAuth2 Credentials:
   - Truy cập [Google Cloud Console](https://console.cloud.google.com)
   - Tạo project mới hoặc chọn project có sẵn
   - Kích hoạt Google Sheets API
   - Tạo OAuth2 credentials:
     - Chọn "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "OAuth client ID"
     - Chọn "Web application"
     - Thêm "http://localhost:8591/oauth2callback" vào Authorized redirect URIs (hoặc port tùy chỉnh của bạn)
     - Copy Client ID và Client Secret vào file `.env`

## Sử dụng

### Xác thực lần đầu

```bash
# Chạy server OAuth2
ts-node src/server.ts

# Trong terminal khác, chạy lệnh xác thực
i18n-sync --auth
```

### Đồng bộ từ Google Sheets về JSON

```bash
i18n-sync --direction to-json
```

### Đồng bộ từ JSON lên Google Sheets

```bash
i18n-sync --direction to-sheet
```

### Tùy chọn khác

```bash
# Chỉ định thư mục output
i18n-sync --direction to-json --output-dir ./path/to/locales

# Chỉ định Google Sheet ID
i18n-sync --direction to-json --sheet-id your_sheet_id

# Sử dụng file config
i18n-sync --direction to-json --config ./config.json
```

## Cấu trúc Google Sheet

- Mỗi sheet đại diện cho một nhóm dịch thuật
- Dòng đầu tiên là header với các cột:
  - `key`: Khóa dịch thuật
  - Các cột khác là mã ngôn ngữ (vd: en, vi, de, ...)

Ví dụ:
| key | en | vi |
|-----|----|----|
| hello | Hello | Xin chào |
| goodbye | Goodbye | Tạm biệt |

## Cấu trúc JSON

```json
{
  "hello": "Xin chào",
  "goodbye": "Tạm biệt"
}
```

Files JSON sẽ được tạo trong thư mục `locales` (hoặc thư mục được chỉ định) với tên file là mã ngôn ngữ (vd: `en.json`, `vi.json`).

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## Giấy phép

MIT 