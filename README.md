# Zenvora AI

Nền tảng học tiếng Anh tương tác được xây dựng mới bằng Next.js, React và Supabase.

## Supabase đang sử dụng
Theo yêu cầu, Zenvora hiện kết nối tới project **AUNORA**. Các bảng riêng của Zenvora có tiền tố `zenvora_` để không ghi đè các bảng hiện có. Hệ thống đăng nhập dùng chung Auth của project này.

## Chạy local
1. Cài Node.js 20.9 trở lên.
2. Chạy `npm install`.
3. Sao chép `.env.example` thành `.env.local`.
4. Chạy `npm run dev`.

Không commit `.env.local`, mật khẩu hoặc secret key. Chỉ publishable key được phép dùng ở trình duyệt; không đưa secret/service-role key vào biến `NEXT_PUBLIC_*`.
