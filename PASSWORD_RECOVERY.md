# Password recovery setup

The login page links to `/forgot-password`. Requests use Supabase Auth recovery (no new accounts), with a generic response for unknown emails. Users can enter the email OTP (`type: recovery`) or follow the recovery link. Password changes require a verified Auth session and matching new passwords of 8–128 characters. After success, global sign-out revokes refresh sessions; already-issued access tokens remain valid until their normal expiry.

Admin user rows can request a recovery email to the account's current email. The server validates the signed-in user's trusted `app_metadata.role`, same-origin POST, and UUID before using the existing server-only service key to look up the email. Codes, password hashes, recovery links and sessions never return to the admin. Supabase enforces email-send and OTP limits. No email sends occur just by loading the admin page.

## Required hosted configuration (not completed by committing source)

1. Configure custom SMTP in Supabase Authentication > Emails > SMTP Settings. The default sender only reaches project-team addresses and does not provide public-user delivery.
2. Set the recovery email body to `supabase/templates/recovery.html`, subject `Đặt lại mật khẩu AUNORA`. This includes the Auth-generated OTP; do not generate or store application OTPs.
3. Already configured on 2026-10-27 with owner approval: Site URL is `https://zenvora-ai-alpha.vercel.app` and these production redirects are allowed under Authentication > URL Configuration:
   - `https://zenvora-ai-alpha.vercel.app/auth/callback?next=/reset-password`
   - `https://zenvora-ai-alpha.vercel.app/reset-password`
   Retain existing redirects. Do not add wildcard domains.
4. Test delivery using a designated test account: valid OTP, wrong/expired/used OTP, resend, mismatched passwords, successful reset and login. Test admin-assisted recovery from another browser, and verify a regular account receives 403 from the admin endpoint.

As of 2026-10-27, the hosted dashboard requires custom SMTP (or a paid plan) to edit templates. The project owner confirmed no email service is configured. Do not claim public email delivery or live OTP recovery works until configuration and an end-to-end mailbox test are complete. No upgrade or paid service was authorized.

