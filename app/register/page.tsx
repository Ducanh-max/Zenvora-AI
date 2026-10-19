"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { display_name: name.trim(), full_name: name.trim() },
        },
      });
      if (error) throw error;

      if (data.session) {
        router.replace("/learn");
        router.refresh();
      } else {
        setNotice("Tạo tài khoản thành công! Hãy mở email để xác nhận tài khoản, sau đó quay lại đăng nhập AUNORA.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="authpage">
    <Link href="/" className="aunora-auth-brand"><span className="aunora-mark auth-brand-image"><img src="/brand/aunora-logo.webp.png" alt="Logo AUNORA" /></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link>
    <div className="auth-layout"><section className="authcard"><div className="eyebrow">BẮT ĐẦU MIỄN PHÍ</div><h1>Tạo tài khoản<br/><em>AUNORA.</em></h1><p>Mỗi ngày một bước nhỏ, tiếng Anh tiến bộ hơn.</p>
      <form onSubmit={submit}><label htmlFor="register-name">Họ và tên</label><input id="register-name" autoComplete="name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Tên của bạn"/>
        <label htmlFor="register-email">Email</label><input id="register-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
        <label htmlFor="register-password">Mật khẩu</label><input id="register-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Ít nhất 8 ký tự"/>
        {error&&<div className="formerror" role="alert">{error}</div>}{notice&&<div className="auth-notice" role="status">{notice}</div>}
        <button className="btn authsubmit" disabled={busy}>{busy?"Đang tạo tài khoản...":"Tạo tài khoản"}</button>
      </form><div className="authswitch">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></div><p className="demo-note">Tài khoản được lưu trực tuyến và xác thực qua Supabase.</p>
    </section><aside className="auth-mascot-panel"><div className="auth-mascot-glow"/><img src="/brand/aivanta-mascot.webp.png" alt="Aivanta - gia sư AI của AUNORA"/><div className="auth-mascot-message"><span>✦ AUNORA AI TUTOR</span><strong>Xin chào, mình là Aivanta!</strong><p>Cùng học tiếng Anh mỗi ngày nhé! 💙</p></div></aside></div>
  </main>;
}
