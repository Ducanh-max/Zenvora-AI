"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginPageContent() {
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
    <Link href="/" className="aunora-auth-brand"><span className="aunora-mark auth-brand-image"><img src="/brand/aunora-logo.webp.png" alt="Logo AUNORA" /></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link>
    <div className="auth-layout"><section className="authcard"><div className="eyebrow">CHÀO MỪNG TRỞ LẠI</div><h1>Tiếp tục hành trình<br/><em>học tiếng Anh.</em></h1><p>Đăng nhập để tiếp tục bài học của bạn.</p>
      <form onSubmit={submit}><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label htmlFor="login-password">Mật khẩu</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu"/>
        {error&&<div className="formerror" role="alert">{error}</div>}
        <button className="btn authsubmit" disabled={busy}>{busy?"Đang đăng nhập...":"Đăng nhập"}</button>
      </form><div className="authswitch"><Link href="/forgot-password">Quên mật khẩu?</Link></div><div className="authswitch">Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link></div><p className="demo-note">Tài khoản được xác thực an toàn qua Supabase.</p>
    </section><aside className="auth-mascot-panel"><div className="auth-mascot-glow"/><img src="/brand/aivanta-mascot.webp.png" alt="Aivanta - gia sư AI của AUNORA"/><div className="auth-mascot-message"><span>✦ AUNORA AI TUTOR</span><strong>Xin chào, mình là Aivanta!</strong><p>Cùng học tiếng Anh mỗi ngày nhé! 💙</p></div></aside></div>
  </main>;
}


export default function LoginPage() {
  return (
    <Suspense fallback={<main className="authpage"><section className="authcard"><p>Đang tải trang đăng nhập...</p></section></main>}>
      <LoginPageContent />
    </Suspense>
  );
}

