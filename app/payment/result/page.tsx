"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, XCircle } from "lucide-react";

type Order = { order_code: number; plan_id: string; amount: number; status: string; paid_at: string | null };

const planNames: Record<string, string> = {
  plus: "Aunora Explorer",
  pro: "Aunora Achiever",
  elite: "Aunora Mastery",
};

export default function PaymentResultPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("Đang kiểm tra trạng thái thanh toán...");
  const [loading, setLoading] = useState(true);
  const [orderCode, setOrderCode] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("orderCode") || "";
    setOrderCode(code);
    if (!code) {
      setMessage("Không tìm thấy mã đơn hàng.");
      setLoading(false);
      return;
    }

    let active = true;
    let attempts = 0;
    const check = async () => {
      try {
        const response = await fetch(`/api/payments/status?orderCode=${encodeURIComponent(code)}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Không thể kiểm tra đơn hàng.");
        if (!active) return;
        setOrder(result.order);
        if (result.order.status === "paid") {
          setMessage("Thanh toán thành công! Gói học đã được kích hoạt.");
          setLoading(false);
          return;
        }
        if (["failed", "expired", "cancelled"].includes(result.order.status)) {
          setMessage("Đơn hàng chưa được thanh toán. Bạn có thể quay lại chọn gói.");
          setLoading(false);
          return;
        }
        attempts += 1;
        setMessage(attempts < 20
          ? "Đang chờ PayOS xác nhận giao dịch. Trang sẽ tự cập nhật..."
          : "Đơn hàng vẫn đang chờ xác nhận. Nếu bạn đã chuyển khoản, hãy đợi thêm rồi tải lại trang.");
        if (attempts < 20 && active) window.setTimeout(check, 3000);
        else setLoading(false);
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Có lỗi khi kiểm tra đơn hàng.");
        setLoading(false);
      }
    };
    void check();
    return () => { active = false; };
  }, []);

  const paid = order?.status === "paid";
  return (
    <main className="marketing-page payment-result-page">
      <section className="payment-result-card">
        <div className={`payment-result-icon ${paid ? "is-paid" : ""}`}>
          {loading ? <LoaderCircle className="spin" /> : paid ? <CheckCircle2 /> : order ? <Clock3 /> : <XCircle />}
        </div>
        <div className="eyebrow">AUNORA · PAYMENT</div>
        <h1>{paid ? "Thanh toán hoàn tất" : loading ? "Đang xác nhận" : "Trạng thái đơn hàng"}</h1>
        <p>{message}</p>
        {order && (
          <div className="payment-order-summary">
            <span>Mã đơn hàng <b>#{order.order_code}</b></span>
            <span>Gói học <b>{planNames[order.plan_id] || order.plan_id}</b></span>
            <span>Số tiền <b>{order.amount.toLocaleString("vi-VN")}đ</b></span>
            <span>Trạng thái <b>{paid ? "Đã thanh toán" : "Đang chờ"}</b></span>
          </div>
        )}
        {orderCode && !paid && <button className="payment-refresh" onClick={() => window.location.reload()}>Kiểm tra lại</button>}
        <div className="payment-result-actions">
          <Link className="btn" href={paid ? "/learn" : "/courses"}>{paid ? "Vào học ngay" : "Quay lại các gói học"}</Link>
          <Link className="plain" href="/">Về trang chủ</Link>
        </div>
        <small>Quyền lợi chỉ được kích hoạt sau khi máy chủ xác minh webhook từ PayOS.</small>
      </section>
    </main>
  );
}
