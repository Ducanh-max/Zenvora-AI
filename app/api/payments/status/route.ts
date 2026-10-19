import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

    const orderCode = Number(new URL(request.url).searchParams.get("orderCode"));
    if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
      return NextResponse.json({ error: "Mã đơn hàng không hợp lệ." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Máy chủ chưa được cấu hình." }, { status: 503 });
    }

    const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: order, error } = await admin
      .from("aunora_payment_orders")
      .select("order_code,plan_id,amount,status,created_at,paid_at")
      .eq("order_code", orderCode)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("AUNORA payment status:", error);
    return NextResponse.json({ error: "Không thể kiểm tra trạng thái thanh toán." }, { status: 500 });
  }
}
