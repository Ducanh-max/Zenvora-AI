import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { recoveryError } from "@/lib/password-recovery";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const reply = (data: object, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
  try {
    // Require same-origin browser requests before using any privileged client.
    if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Nguồn yêu cầu không hợp lệ." }, 403);
    const session = await createClient();
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) return reply({ error: "Vui lòng đăng nhập." }, 401);
    if (user.app_metadata?.role !== "admin") return reply({ error: "Bạn không có quyền quản trị." }, 403);
    const raw = await request.text();
    if (raw.length > 200) return reply({ error: "Nội dung không hợp lệ." }, 400);
    let id: unknown;
    try { id = JSON.parse(raw)?.userId; } catch { return reply({ error: "Dữ liệu không hợp lệ." }, 400); }
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return reply({ error: "Mã người dùng không hợp lệ." }, 400);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || !secret) return reply({ error: "Chưa cấu hình hỗ trợ khôi phục tài khoản." }, 503);
    const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
    const admin = createSupabaseClient(url, secret, options);
    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error || !data.user?.email) return reply({ error: "Tài khoản không có email khôi phục." }, 404);
    // Use the normal recovery sender so Auth enforces OTP expiry and email rate limits.
    // Never return a recovery link, OTP, password, or session to the administrator.
    const sender = createSupabaseClient(url, key, options);
    const result = await sender.auth.resetPasswordForEmail(data.user.email, { redirectTo: `${new URL(request.url).origin}/reset-password` });
    if (result.error) return reply({ error: recoveryError(result.error, "Chưa gửi được email. Kiểm tra cấu hình dịch vụ gửi thư và thử lại sau.") }, 429);
    return reply({ message: "Đã tiếp nhận yêu cầu gửi email khôi phục tới chủ tài khoản. Admin không nhận mã hay mật khẩu." });
  } catch { return reply({ error: "Không thể gửi yêu cầu khôi phục. Vui lòng thử lại sau." }, 500); }
}
