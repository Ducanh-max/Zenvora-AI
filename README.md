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

## Firebase Performance Monitoring (Spark)

Production browser performance is measured with the Firebase web app registered
for `zenvora-ai-alpha.vercel.app` in project `aunora-81dcc`. The client initializes
lazily through Next.js client instrumentation; monitoring failures are isolated
from the learning app. Do Not Track and Global Privacy Control disable startup.
Local and preview hostnames do not send performance telemetry.

This adds Performance Monitoring only. Authentication, learning progress and
payments continue to use the existing Supabase integration. No billing plan
change, Firebase Authentication, Firestore, Storage, AI or Analytics is enabled.
Performance Monitoring is a no-cost Firebase product; its Web SDK is beta.
See https://firebase.google.com/docs/perf-mon/get-started-web .

After deployment, visit the production website and check Firebase Console →
Performance for this web app. Initial reports can take time to appear. If the
production domain changes, update the hostname allowlist in
`lib/firebase-monitoring.ts`. To remove monitoring, remove
`instrumentation-client.ts` and the Firebase dependency.
