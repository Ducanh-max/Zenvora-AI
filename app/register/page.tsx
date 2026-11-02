"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../auth-garden.module.css";
import AuthFlowerVideo from "../auth-flower-video";

function registrationError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (code === "weak_password" || message.includes("password should")) return "Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự và kết hợp chữ, số, ký hiệu.";
  if (code === "email_address_invalid" || message.includes("invalid email")) return "Địa chỉ email chưa hợp lệ. Vui lòng kiểm tra lại.";
  if (code === "user_already_exists" || code === "email_exists" || message.includes("already registered")) return "Không thể hoàn tất đăng ký. Nếu bạn đã có tài khoản, hãy đăng nhập hoặc khôi phục mật khẩu.";
  if (code.includes("rate_limit") || message.includes("too many requests")) return "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.";
  if (message.includes("fetch") || message.includes("network")) return "Chưa thể kết nối. Vui lòng kiểm tra mạng và thử lại.";
  if (message.includes("cấu hình")) return "Đăng ký tạm thời chưa sẵn sàng. Vui lòng thử lại sau.";
  return "Không thể đăng ký lúc này. Vui lòng thử lại sau.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
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
        setNotice("Nếu địa chỉ email này có thể đăng ký, bạn sẽ nhận được email xác nhận. Hãy kiểm tra hộp thư và thư rác trước khi đăng nhập.");
      }
    } catch (error) {
      setError(registrationError(error));
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
        <section className={styles.card} aria-labelledby="register-title">
          <span className={styles.eyebrow}>MỘT KHỞI ĐẦU NHỎ. MỘT HÀNH TRÌNH MỚI.</span>
          <h1 id="register-title">Gieo lời chào.<br/><em>Nuôi sự tự tin.</em></h1>
          <p className={styles.intro}>Tạo tài khoản AUNORA để bắt đầu học<br/>và lưu những bước tiến của riêng bạn.</p>
          <form onSubmit={submit} aria-busy={busy}>
            <fieldset className={styles.fields} disabled={busy}>
              <div className={styles.field}><label htmlFor="register-name">Họ và tên</label><input id="register-name" name="name" autoComplete="name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Tên của bạn"/></div>
              <div className={styles.field}><label htmlFor="register-email">Email</label><input id="register-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => setEmail(event.target.value)} placeholder="ban@example.com"/></div>
              <div className={styles.field}><label htmlFor="register-password">Mật khẩu</label><div className={styles.password}><input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} aria-describedby="password-help" value={password} onChange={event => setPassword(event.target.value)} placeholder="Tạo mật khẩu của bạn"/><button type="button" className={styles.reveal} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Ẩn" : "Hiện"}</button></div><small className={styles.help} id="password-help">Ít nhất 8 ký tự. Nên kết hợp chữ, số và ký hiệu.</small></div>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
              <button className={styles.submit} type="submit" disabled={busy}>{busy ? <><span className={styles.spinner} aria-hidden="true"/>Đang tạo tài khoản…</> : <>Bắt đầu hành trình <span aria-hidden="true">↗</span></>}</button>
            </fieldset>
          </form>
          <p className={styles.switch}>Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
          <div className={styles.note}><span aria-hidden="true">✧</span> Mỗi ngày một chút. Tiến bộ từ gốc rễ.</div>
        </section>
        <AuthFlowerVideo variant="register"/>
      </div>
      <footer className={styles.footer}>AUNORA <span>LEARN A LITTLE. GROW EVERY DAY.</span></footer>
    </main>
  );
}
