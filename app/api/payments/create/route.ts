import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createPayOSSignature, PAID_PLANS, type PaidPlanId } from "@/lib/payos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập trước khi thanh toán." }, { status: 401 });
    }

    const body = await request.json();
    const planId = typeof body.planId === "string" ? body.planId as PaidPlanId : null;
    if (!planId || !Object.prototype.hasOwnProperty.call(PAID_PLANS, planId)) {
      return NextResponse.json({ error: "Gói học không hợp lệ." }, { status: 400 });
    }

    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

    if (!clientId || !apiKey || !checksumKey || !supabaseUrl || !serviceRoleKey || !siteUrl) {
      return NextResponse.json({
        error: "Cổng thanh toán chưa được cấu hình đầy đủ. Quản trị viên cần hoàn tất thiết lập PayOS và biến môi trường trên Vercel."
      }, { status: 503 });
    }

    const plan = PAID_PLANS[planId];
    const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: order, error: insertError } = await admin
      .from("aunora_payment_orders")
      .insert({ user_id: user.id, plan_id: planId, amount: plan.amount, status: "pending" })
      .select("order_code")
      .single();

    if (insertError || !order) {
      console.error("AUNORA payment order insert:", insertError?.message);
      return NextResponse.json({ error: "Không thể tạo đơn thanh toán. Vui lòng thử lại." }, { status: 500 });
    }

    const orderCode = Number(order.order_code);
    const baseUrl = siteUrl.replace(/\/$/, "");
    const cancelUrl = `${baseUrl}/payment/result?orderCode=${orderCode}&cancelled=1`;
    const returnUrl = `${baseUrl}/payment/result?orderCode=${orderCode}`;
    const signature = createPayOSSignature({
      amount: plan.amount,
      cancelUrl,
      description: plan.description,
      orderCode,
      returnUrl,
    }, checksumKey);

    const payosResponse = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        orderCode,
        amount: plan.amount,
        description: plan.description,
        items: [{ name: plan.name, quantity: 1, price: plan.amount }],
        cancelUrl,
        returnUrl,
        signature,
      }),
      cache: "no-store",
    });

    const result = await payosResponse.json();
    const payment = result?.data;
    if (!payosResponse.ok || result?.code !== "00" || !payment?.checkoutUrl) {
      await admin.from("aunora_payment_orders")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("order_code", orderCode);
      console.error("PayOS create payment failed:", result?.desc || payosResponse.status);
      return NextResponse.json({ error: "PayOS chưa tạo được liên kết thanh toán. Vui lòng thử lại sau." }, { status: 502 });
    }

    await admin.from("aunora_payment_orders")
      .update({
        payment_link_id: payment.paymentLinkId || null,
        checkout_url: payment.checkoutUrl,
        expires_at: payment.expiredAt ? new Date(payment.expiredAt * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("order_code", orderCode);

    return NextResponse.json({ checkoutUrl: payment.checkoutUrl, orderCode });
  } catch (error) {
    console.error("AUNORA create payment:", error);
    return NextResponse.json({ error: "Có lỗi khi tạo thanh toán. Vui lòng thử lại." }, { status: 500 });
  }
}
