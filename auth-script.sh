#!/bin/bash

# Chạy OAuth2 server trong background
ts-node src/server.ts &
SERVER_PID=$!

# Đợi server khởi động (khoảng 2 giây)
sleep 2

# Chạy lệnh xác thực sử dụng npx
npx i18n-sync --auth

# Sau khi xác thực xong, tắt server
kill $SERVER_PID 