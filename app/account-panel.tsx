"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthFlowerVideo from "./auth-flower-video";
import styles from "./account-panel.module.css";

type Mode = "login" | "register";
function authError(error: unknown, mode: Mode) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "invalid_credentials") return "Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.";
  if (code === "email_not_confirmed") return "Hãy xác nhận email trước khi đăng nhập. Kiểm tra cả thư rác nhé.";
  if (code === "weak_password") return "Mật khẩu chưa đủ mạnh. Hãy kết hợp chữ, số và ký hiệu.";
  if (code === "email_address_invalid") return "Email chưa hợp lệ. Vui lòng kiểm tra lại.";
  if (code.includes("rate_limit")) return "Bạn đã thử nhiều lần. Vui lòng đợi một chút rồi thử lại.";
  if (["email_exists", "user_already_exists"].includes(code)) return "Chưa thể đăng ký. Nếu đã có tài khoản, hãy đăng nhập hoặc khôi phục mật khẩu.";
  return mode === "login" ? "Chưa thể đăng nhập. Kiểm tra thông tin và kết nối rồi thử lại nhé." : "Chưa thể tạo tài khoản. Kiểm tra thông tin và kết nối rồi thử lại nhé.";
}

export default function AccountPanel({ initialMode }: { initialMode: Mode }) {
  const pageRef = useRef<HTMLElement>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const loginTab = useRef<HTMLButtonElement>(null);
  const registerTab = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    function resize() {
      const height = Math.round(viewport!.height);
      pageRef.current?.style.setProperty("--account-height", `${height}px`);
      const isInput = document.activeElement instanceof HTMLInputElement;
      setKeyboardVisible(isInput && height < window.innerHeight * .78);
    }
    resize();
    viewport.addEventListener("resize", resize);
    document.addEventListener("focusin", resize);
    document.addEventListener("focusout", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      document.removeEventListener("focusin", resize);
      document.removeEventListener("focusout", resize);
    };
  }, []);

  function changeMode(next: Mode) {
    if (busy) return;
    setMode(next); setError(""); setPassword(""); setShowPassword(false); setConfirmation(false);
  }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || busy) return;
    event.preventDefault();
    const next = event.key === "Home" ? "login" : event.key === "End" ? "register" : mode === "login" ? "register" : "login";
    changeMode(next);
    (next === "login" ? loginTab : registerTab).current?.focus();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (mode === "register" && !name.trim()) { setError("Vui lòng nhập tên của bạn."); return; }
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { display_name: name.trim(), full_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) { setPassword(""); setConfirmation(true); return; }
        router.replace("/learn"); router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) throw error;
        const next = search.get("next");
        const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(next) ? next : null;
        const { data: { user } } = await supabase.auth.getUser();
        router.replace(safeNext || (user?.app_metadata?.role === "admin" ? "/admin" : "/learn")); router.refresh();
      }
    } catch (error) { setError(authError(error, mode)); }
    finally { setBusy(false); }
  }

  return <main ref={pageRef} className={`${styles.page} ${keyboardVisible ? styles.keyboard : ""}`}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="AUNORA — Trang chủ"><span className={styles.mark}><Sprout size={22} strokeWidth={1.5}/></span>AUNORA</Link>
      <Link href="/" className={styles.back}><ArrowLeft size={14}/><span>Trang chủ</span></Link>
    </header>
    <div className={styles.shell}>
      <section className={styles.card} aria-label="Tài khoản AUNORA">
        <div className={styles.heading}><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h1>{confirmation ? "Kiểm tra email nhé." : mode === "login" ? "Chào mừng trở lại." : "Một khởi đầu mới."}</h1><p className={styles.intro}>Cùng nuôi dưỡng tiếng Anh, mỗi ngày.</p></div>
        <div className={styles.tabs} role="tablist" aria-label="Đăng nhập hoặc đăng ký">
          <button ref={loginTab} id="login-tab" type="button" role="tab" aria-controls="account-form" aria-selected={mode === "login"} tabIndex={mode === "login" ? 0 : -1} disabled={busy} onKeyDown={tabKey} onClick={() => changeMode("login")}>Đăng nhập</button>
          <button ref={registerTab} id="register-tab" type="button" role="tab" aria-controls="account-form" aria-selected={mode === "register"} tabIndex={mode === "register" ? 0 : -1} disabled={busy} onKeyDown={tabKey} onClick={() => changeMode("register")}>Đăng ký</button>
        </div>
        <div id="account-form" role="tabpanel" aria-labelledby={mode === "login" ? "login-tab" : "register-tab"} className={styles.panel}>
          {confirmation ? <div className={styles.confirmation} role="status"><span className={styles.check}><Check size={25}/></span><p>Nếu email này có thể đăng ký, bạn sẽ nhận được thư xác nhận. Hãy kiểm tra hộp thư và thư rác, rồi quay lại đăng nhập.</p><button type="button" className={styles.submit} onClick={() => changeMode("login")}>Đến đăng nhập<ArrowRight size={16}/></button></div> : <form onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={busy} className={`${styles.fields} ${mode === "register" ? styles.registerFields : ""}`}>
              {mode === "register" ? <div className={styles.field}><label htmlFor="account-name">Họ và tên</label><input id="account-name" name="name" required maxLength={80} autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Tên của bạn"/></div> : null}
              <div className={styles.field}><label htmlFor="account-email">Email</label><input id="account-email" name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} placeholder="ban@example.com"/></div>
              <div className={`${styles.field} ${styles.passwordField}`}><div className={styles.labelRow}><label htmlFor="account-password">Mật khẩu</label>{mode === "login" ? <Link href="/forgot-password">Quên mật khẩu?</Link> : null}</div><div className={styles.password}><input id="account-password" name="password" type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "register" ? "Ít nhất 8 ký tự" : "Mật khẩu của bạn"}/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
            </fieldset>
            <p className={styles.feedback} role={error ? "alert" : "status"}>{error || "\u00a0"}</p>
            <button type="submit" disabled={busy} className={styles.submit}>{busy ? "Đang xử lý…" : mode === "login" ? "Tiếp tục hành trình" : "Tạo tài khoản"}<ArrowRight size={16}/></button>
          </form>}
        </div>
      </section>
      <div className={styles.art} aria-hidden="true"><AuthFlowerVideo variant={mode}/></div>
    </div>
  </main>;
}
