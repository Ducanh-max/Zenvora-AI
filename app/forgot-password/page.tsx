"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { RECOVERY_MESSAGE, recoveryError, verifyRecoveryCode } from "@/lib/password-recovery";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [wait, setWait] = useState(0);
  const inFlight = useRef(false);
  useEffect(() => { if (!wait) return; const timer = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(timer); }, [wait]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (inFlight.current || wait > 0) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
      if (error) throw new Error(recoveryError(error, "Chưa gửi được email khôi phục. Vui lòng thử lại sau."));
      setSent(true); setWait(60); setNotice(RECOVERY_MESSAGE);
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa gửi được email."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      await verifyRecoveryCode(createClient(), email, code);
      window.location.assign("/reset-password");
    } catch (error) { setError(error instanceof Error ? error.message : "Chưa xác nhận được mã."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <main className="authpage"><section className="authcard">
    <Link href="/login">← Về đăng nhập</Link><h1>Quên mật khẩu?</h1>
    <p>Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p>
    {!sent ? <form onSubmit={send}><label htmlFor="recovery-email">Email đăng ký</label><input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy}/><button className="btn authsubmit" disabled={busy || wait > 0}>{busy ? "Đang gửi…" : wait ? `Gửi lại sau ${wait} giây` : "Gửi email xác nhận"}</button></form> : <>
      <p>Kiểm tra hộp thư của <strong>{email}</strong>. Mở liên kết khôi phục trong email; nếu email có mã xác nhận, bạn cũng có thể nhập mã bên dưới.</p>
      <form onSubmit={verify}><label htmlFor="recovery-code">Mã xác nhận trong email</label><input id="recovery-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} disabled={busy}/><button className="btn authsubmit" disabled={busy}>{busy ? "Đang xác nhận…" : "Xác nhận mã"}</button></form>
      <div className="authswitch"><button type="button" disabled={busy || wait > 0} onClick={() => void send()}>{wait ? `Gửi lại sau ${wait} giây` : "Gửi lại email"}</button> <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); setNotice(""); setError(""); }}>Đổi email</button></div>
    </>}
    {notice && <p role="status">{notice}</p>}{error && <p className="formerror" role="alert">{error}</p>}
  </section></main>;
}

