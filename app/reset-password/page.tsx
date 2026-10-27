"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateNewPassword } from "@/lib/password-recovery";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    const client = createClient();
        // Admin-initiated emails use Auth's implicit recovery redirect. Consume the
    // fragment locally, remove it immediately, and validate the session with Auth.
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get("access_token"), refreshToken = fragment.get("refresh_token");
    const isRecovery = fragment.get("type") === "recovery";
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    void (async () => {
      if (isRecovery && accessToken && refreshToken) {
        const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) { if (active) setChecked(true); return; }
      }
      const { data, error } = await client.auth.getUser();
      if (active) { setReady(Boolean(data.user && !error)); setChecked(true); }
    })().catch(() => { if (active) setChecked(true); });
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => { if (active && event === "PASSWORD_RECOVERY") { setReady(true); setChecked(true); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (inFlight.current) return;
    const validation = validateNewPassword(password, confirmation); if (validation) { setError(validation); return; }
    inFlight.current = true; setBusy(true); setError("");
    try {
      const client = createClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw new Error(error.code === "same_password" ? "Hãy chọn mật khẩu khác mật khẩu cũ." : "Chưa đổi được mật khẩu. Phiên xác nhận có thể đã hết hạn; hãy yêu cầu email mới.");
      setPassword(""); setConfirmation(""); setDone(true);
      // Revoke refresh sessions on other devices after a successful recovery.
      await client.auth.signOut({ scope: "global" });
    } catch (error) { setError(error instanceof Error ? error.message : "Không thể đổi mật khẩu."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <main className="authpage"><section className="authcard"><h1>Đặt lại mật khẩu</h1>
    {done ? <><p role="status">Đã đổi mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.</p><Link className="btn authsubmit" href="/login">Về đăng nhập</Link></> : !checked ? <p>Đang kiểm tra xác nhận…</p> : !ready ? <><p role="alert">Bạn cần xác nhận email trước. Liên kết có thể đã hết hạn hoặc được mở trên trình duyệt khác.</p><Link href="/forgot-password">Yêu cầu email khôi phục mới</Link></> : <><p>Chọn mật khẩu mới từ 8 ký tự trở lên.</p><form onSubmit={submit}><label htmlFor="new-password">Mật khẩu mới</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy}/><label htmlFor="confirm-password">Nhập lại mật khẩu mới</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy}/>{error && <p role="alert" className="formerror">{error}</p>}<button className="btn authsubmit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu mật khẩu mới"}</button></form></>}
  </section></main>;
}

