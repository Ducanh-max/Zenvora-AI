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

## Firebase services on the web

- **Analytics:** property `560698885`, stream `16198172601`, measurement ID
  `G-C93HJX9EWQ`. The website asks for optional analytics consent before
  initializing Analytics. Advertising consent stays denied. Browser Do Not Track
  and Global Privacy Control opt out. The settings button allows later changes.
  Only page views for public/learning routes are sent, with query strings and
  referrers removed. Profile, payment and callback pages are excluded. Enhanced
  measurement is disabled in the stream; keep it disabled to avoid automatic
  URL/form collection outside this implementation.
- **Remote Config:** `web_announcement` (string, default empty) and
  `web_announcement_enabled` (boolean, default false) control the optional site
  notice. Text is rendered as plain text, limited to 300 characters. No secrets
  belong in Remote Config. The app uses cached defaults offline and a 12-hour
  minimum fetch interval. New visitors get the latest published settings; an
  existing browser can take up to 12 hours to fetch changes.
- **Performance Monitoring:** production-only monitoring continues to run and
  respects browser privacy opt-outs. This is operational performance telemetry,
  separate from optional Analytics consent.

All integrations target the existing Spark project `aunora-81dcc`. Billing is
not enabled. Supabase and Vercel remain responsible for existing authentication,
learning data and hosting. No extra database or authentication system is added.
Firebase quotas still apply; the website retains its defaults if Remote Config
cannot be fetched. Do not upgrade to Blaze just to use these integrations.

