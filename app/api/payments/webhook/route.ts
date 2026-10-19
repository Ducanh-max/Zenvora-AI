import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { verifyPayOSWebhook } from "@/lib/payos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!checksumKey || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Payment webhook is not configured." }, { status: 503 });
    }

    const payload = await request.json();
    const data = payload?.data;
    if (!data || typeof data !== "object" || !verifyPayOSWebhook(data, payload.signature, checksumKey)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    // Ignore PayOS channel-verification callbacks and unsuccessful transactions.
    if (payload.success !== true || String(data.code) !== "00") {
      return NextResponse.json({ received: true });
    }

    const orderCode = Number(data.orderCode);
    const amount = Number(data.amount);
    if (!Number.isSafeInteger(orderCode) || !Number.isSafeInteger(amount)) {
      return NextResponse.json({ error: "Invalid payment data." }, { status: 400 });
    }

    const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: confirmed, error } = await admin.rpc("confirm_aunora_payment", {
      p_order_code: orderCode,
      p_amount: amount,
      p_reference: typeof data.reference === "string" ? data.reference : null,
    });

    if (error) throw error;
    if (confirmed !== true) {
      return NextResponse.json({ error: "Order could not be confirmed." }, { status: 404 });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("AUNORA PayOS webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
