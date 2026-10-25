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

- **Live presence:** automatic anonymous online sessions replace the Analytics consent UI. The frontend no longer initializes Google Analytics or sends page-view events. Existing Analytics reports remain available as historical data.
- **Remote Config:** `web_announcement` (string, default empty) and
  `web_announcement_enabled` (boolean, default false) control the optional site
  notice. Text is rendered as plain text, limited to 300 characters. No secrets
  belong in Remote Config. The app uses cached defaults offline and a 12-hour
  minimum fetch interval. New visitors get the latest published settings; an
  existing browser can take up to 12 hours to fetch changes.
- **Performance Monitoring:** production-only monitoring continues to run and
  respects browser privacy opt-outs. This is operational performance telemetry,
  independent of the automatic online-session counter.

All integrations target the existing Spark project `aunora-81dcc`. Billing is
not enabled. Supabase and Vercel remain responsible for existing authentication,
learning data and hosting. No extra database or authentication system is added.
Firebase quotas still apply; the website retains its defaults if Remote Config
cannot be fetched. Do not upgrade to Blaze just to use these integrations.




## Automatic online/offline sessions

The root `OnlinePresenceProvider` tracks production website connections through
Supabase Realtime Presence on `aunora:site-presence:v1`, independently of login.
The admin dashboard `/admin` contains a live count and anonymous session list;
the existing server-side admin authorization remains in place.

Only a temporary sessionStorage UUID and connection timestamp are published.
No name, email, account ID, page path, IP address or learning content is added
to the presence payload. This is a count of connected sessions, not a count of
unique humans. Tabs sharing a session key are counted once. It is not a history
of visits or a record of users who previously went offline.

Normal page closure leaves the channel. Abrupt network loss uses the Realtime
server timeout, so offline detection is eventual, not instantaneous. The client
reconnects on restored connectivity and after interrupted subscriptions. A
background tab stays online while its WebSocket remains connected. The display
shows an unavailable state instead of stale or fake zero counts when it cannot
reach Realtime. Development and preview domains do not join the live channel.

Presence uses the existing Supabase public client configuration; no new database,
RLS policy, secret, table, authentication system or paid plan is required. The
public channel contains no personal user identifiers; its totals are advisory
and client-reported, never a basis for authorization or billing. Existing plan
connection and message quotas apply.

Verify lifecycle behavior with: node --test scripts/test-site-presence.cjs

