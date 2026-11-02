"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../auth-garden.module.css";
import AuthFlowerVideo from "../auth-flower-video";

function loginError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra và thử lại.";
  if (code === "email_not_confirmed") return "Bạn cần xác nhận email trước khi đăng nhập. Hãy kiểm tra hộp thư và thư rác.";
  if (code.includes("rate_limit") || message.includes("too many requests")) return "Bạn đã thử quá nhiều lần. Vui lòng đợi một chút rồi thử lại.";
  if (message.includes("fetch") || message.includes("network")) return "Chưa thể kết nối. Vui lòng kiểm tra mạng và thử lại.";
  if (message.includes("cấu hình")) return "Đăng nhập tạm thời chưa sẵn sàng. Vui lòng thử lại sau.";
  return "Không thể đăng nhập lúc này. Vui lòng thử lại hoặc khôi phục mật khẩu.";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(next) ? next : null;
      const { data: { user } } = await supabase.auth.getUser();
      router.replace(safeNext || (user?.app_metadata?.role === "admin" ? "/admin" : "/learn"));
      router.refresh();
    } catch (error) {
      setError(loginError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="AUNORA — trang chủ"><span className={styles.mark} aria-hidden="true">a<span>✦</span></span><span>AUNORA<span className={styles.brandDot}>.</span></span></Link>
        <Link href="/" className={styles.back}>← Về trang chủ</Link>
      </header>
      <div className={styles.layout}>
        <section className={styles.card} aria-labelledby="login-title">
          <span className={styles.eyebrow}>MỖI NGÀY, MỘT CHÚT TỰ TIN</span>
          <h1 id="login-title">Chào mừng<br/><em>bạn trở lại.</em></h1>
          <p className={styles.intro}>Khu vườn của bạn vẫn đang lớn lên.<br/>Đăng nhập để tiếp tục hành trình tiếng Anh.</p>
          <form onSubmit={submit} aria-busy={busy}>
            <fieldset className={styles.fields} disabled={busy}>
              <div className={styles.field}><label htmlFor="login-email">Email</label><input id="login-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => setEmail(event.target.value)} placeholder="ban@example.com"/></div>
              <div className={styles.field}><div className={styles.labelRow}><label htmlFor="login-password">Mật khẩu</label><Link href="/forgot-password">Quên mật khẩu?</Link></div><div className={styles.password}><input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu của bạn"/><button type="button" className={styles.reveal} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Ẩn" : "Hiện"}</button></div></div>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <button className={styles.submit} type="submit" disabled={busy}>{busy ? <><span className={styles.spinner} aria-hidden="true"/>Đang đăng nhập…</> : <>Tiếp tục hành trình <span aria-hidden="true">↗</span></>}</button>
            </fieldset>
          </form>
          <p className={styles.switch}>Bạn mới đến AUNORA? <Link href="/register">Tạo tài khoản</Link></p>
          <div className={styles.note}><span aria-hidden="true">✧</span> Không cần hoàn hảo. Cứ bắt đầu nói thôi.</div>
        </section>
        <AuthFlowerVideo variant="login"/>
      </div>
      <footer className={styles.footer}>AUNORA <span>LEARN A LITTLE. GROW EVERY DAY.</span></footer>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className={styles.page}><div className={styles.loading} role="status"><span className={styles.spinner} aria-hidden="true"/> Đang tải trang đăng nhập…</div></main>}><LoginPageContent/></Suspense>;
}
