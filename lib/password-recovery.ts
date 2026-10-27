import type { SupabaseClient } from "@supabase/supabase-js";

export const RECOVERY_MESSAGE = "Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư. Hãy kiểm tra cả thư rác.";
export function recoveryError(error: { code?: string } | null, fallback: string) {
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") return "Bạn đã yêu cầu quá nhiều lần. Vui lòng chờ rồi thử lại.";
  if (error?.code === "email_address_not_authorized" || error?.code === "unexpected_failure") return "Dịch vụ gửi email chưa sẵn sàng. Vui lòng liên hệ quản trị viên.";
  return fallback;
}
export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8) return "Mật khẩu mới cần ít nhất 8 ký tự.";
  if (password.length > 128) return "Mật khẩu không được quá 128 ký tự.";
  if (password !== confirmation) return "Hai mật khẩu chưa khớp.";
  return "";
}
export async function verifyRecoveryCode(client: SupabaseClient, email: string, code: string) {
  if (!/^\d{6,8}$/.test(code)) throw new Error("Nhập đầy đủ mã xác nhận trong email.");
  const { data, error } = await client.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: "recovery" });
  if (error || !data.session) throw new Error(recoveryError(error, "Mã không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc yêu cầu mã mới."));
}
