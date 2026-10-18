"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const { data: { user } } = await supabase.auth.getUser();
      const destination = safeNext || (user?.app_metadata?.role === "admin" ? "/admin" : "/learn");
      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="authpage">
    <Link href="/" className="aunora-auth-brand"><span className="aunora-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 8 19 13 24 9 29 13 41 8 38 29 31 39 24 34 17 39 10 29Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="m16 21 5 2m11-2-5 2m-3 2v5m-6 1 6-3 6 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link>
    <section className="authcard"><div className="eyebrow">CHÀO MỪNG TRỞ LẠI</div><h1>Tiếp tục hành trình<br/><em>học tiếng Anh.</em></h1><p>Đăng nhập để tiếp tục bài học của bạn.</p>
      <form onSubmit={submit}><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label htmlFor="login-password">Mật khẩu</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu"/>
        {error&&<div className="formerror" role="alert">{error}</div>}
        <button className="btn authsubmit" disabled={busy}>{busy?"Đang đăng nhập...":"Đăng nhập"}</button>
      </form><div className="authswitch">Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link></div><p className="demo-note">Tài khoản được xác thực an toàn qua Supabase.</p>
    </section>
  </main>;
}
