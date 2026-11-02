"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthFlowerVideo from "./auth-flower-video";
import PreferenceControls from "./preference-controls";
import { usePreferences } from "./preferences-provider";
import type { Language } from "./preferences-provider";
import styles from "./account-panel.module.css";

type Mode = "login" | "register";
const copy = {
  vi: { eyebrow: "KHỞI ĐẦU MỚI CỦA BẠN", home: "Trang chủ", account: "Tài khoản AUNORA", choose: "Đăng nhập hoặc đăng ký", login: "Đăng nhập", register: "Đăng ký", checkEmail: "Kiểm tra email nhé.", welcome: "Chào mừng trở lại.", start: "Một khởi đầu mới.", intro: "Cùng nuôi dưỡng tiếng Anh, mỗi ngày.", name: "Họ và tên", namePlaceholder: "Tên của bạn", password: "Mật khẩu", forgot: "Quên mật khẩu?", newPassword: "Ít nhất 8 ký tự", currentPassword: "Mật khẩu của bạn", hide: "Ẩn mật khẩu", show: "Hiện mật khẩu", busy: "Đang xử lý…", continue: "Tiếp tục hành trình", create: "Tạo tài khoản", confirm: "Nếu email này có thể đăng ký, bạn sẽ nhận được thư xác nhận. Hãy kiểm tra hộp thư và thư rác, rồi quay lại đăng nhập.", toLogin: "Đến đăng nhập" },
  en: { eyebrow: "YOUR NEXT CHAPTER", home: "Home", account: "AUNORA account", choose: "Sign in or sign up", login: "Sign in", register: "Sign up", checkEmail: "Check your email.", welcome: "Welcome back.", start: "A fresh start.", intro: "Grow your English, a little every day.", name: "Full name", namePlaceholder: "Your name", password: "Password", forgot: "Forgot password?", newPassword: "At least 8 characters", currentPassword: "Your password", hide: "Hide password", show: "Show password", busy: "Please wait…", continue: "Continue your journey", create: "Create account", confirm: "If this email can be registered, you will receive a confirmation link. Check your inbox and spam folder, then return to sign in.", toLogin: "Go to sign in" },
} as const;
const errors = {
  vi: { name: "Vui lòng nhập tên của bạn.", credentials: "Email hoặc mật khẩu chưa đúng. Bạn kiểm tra lại nhé.", confirm: "Hãy xác nhận email trước khi đăng nhập. Kiểm tra cả thư rác nhé.", weak: "Mật khẩu chưa đủ mạnh. Hãy kết hợp chữ, số và ký hiệu.", email: "Email chưa hợp lệ. Vui lòng kiểm tra lại.", rate: "Bạn đã thử nhiều lần. Vui lòng đợi một chút rồi thử lại.", exists: "Chưa thể đăng ký. Nếu đã có tài khoản, hãy đăng nhập hoặc khôi phục mật khẩu.", login: "Chưa thể đăng nhập. Kiểm tra thông tin và kết nối rồi thử lại nhé.", register: "Chưa thể tạo tài khoản. Kiểm tra thông tin và kết nối rồi thử lại nhé." },
  en: { name: "Please enter your name.", credentials: "Your email or password is incorrect. Please try again.", confirm: "Please confirm your email before signing in. Check your spam folder too.", weak: "Choose a stronger password with letters, numbers and symbols.", email: "Please check your email address.", rate: "Too many attempts. Please wait a moment and try again.", exists: "Unable to sign up. If you already have an account, sign in or reset your password.", login: "Unable to sign in. Check your details and connection, then try again.", register: "Unable to create your account. Check your details and connection, then try again." },
} as const;
function authError(error: unknown, mode: Mode, language: Language) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const t = errors[language];
  if (code === "name_required") return t.name;
  if (code === "invalid_credentials") return t.credentials;
  if (code === "email_not_confirmed") return t.confirm;
  if (code === "weak_password") return t.weak;
  if (code === "email_address_invalid") return t.email;
  if (code.includes("rate_limit")) return t.rate;
  if (["email_exists", "user_already_exists"].includes(code)) return t.exists;
  return t[mode];
}

export default function AccountPanel({ initialMode }: { initialMode: Mode }) {
  const { language } = usePreferences();
  const t = copy[language];
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
  const [error, setError] = useState<unknown>(null);
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
    setMode(next); setError(null); setPassword(""); setShowPassword(false); setConfirmation(false);
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
    if (mode === "register" && !name.trim()) { setError({ code: "name_required" }); return; }
    setBusy(true); setError(null);
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
    } catch (error) { setError(error); }
    finally { setBusy(false); }
  }

  return <main ref={pageRef} className={`${styles.page} ${keyboardVisible ? styles.keyboard : ""}`}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label={`AUNORA — ${t.home}`}><span className={styles.mark}><Sprout size={22} strokeWidth={1.5}/></span>AUNORA</Link>
      <div className={styles.headerActions}><PreferenceControls/><Link href="/" className={styles.back}><ArrowLeft size={14}/><span>{t.home}</span></Link></div>
    </header>
    <div className={styles.shell}>
      <section className={styles.card} aria-label={t.account}>
        <div className={styles.heading}><p className={styles.eyebrow}>{t.eyebrow}</p><h1>{confirmation ? t.checkEmail : mode === "login" ? t.welcome : t.start}</h1><p className={styles.intro}>{t.intro}</p></div>
        <div className={styles.tabs} role="tablist" aria-label={t.choose}>
          <button ref={loginTab} id="login-tab" type="button" role="tab" aria-controls="account-form" aria-selected={mode === "login"} tabIndex={mode === "login" ? 0 : -1} disabled={busy} onKeyDown={tabKey} onClick={() => changeMode("login")}>{t.login}</button>
          <button ref={registerTab} id="register-tab" type="button" role="tab" aria-controls="account-form" aria-selected={mode === "register"} tabIndex={mode === "register" ? 0 : -1} disabled={busy} onKeyDown={tabKey} onClick={() => changeMode("register")}>{t.register}</button>
        </div>
        <div id="account-form" role="tabpanel" aria-labelledby={mode === "login" ? "login-tab" : "register-tab"} className={styles.panel}>
          {confirmation ? <div className={styles.confirmation} role="status"><span className={styles.check}><Check size={25}/></span><p>{t.confirm}</p><button type="button" className={styles.submit} onClick={() => changeMode("login")}>{t.toLogin}<ArrowRight size={16}/></button></div> : <form onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={busy} className={`${styles.fields} ${mode === "register" ? styles.registerFields : ""}`}>
              {mode === "register" ? <div className={styles.field}><label htmlFor="account-name">{t.name}</label><input id="account-name" name="name" required maxLength={80} autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder={t.namePlaceholder}/></div> : null}
              <div className={styles.field}><label htmlFor="account-email">Email</label><input id="account-email" name="email" type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} placeholder={language === "vi" ? "ban@example.com" : "you@example.com"}/></div>
              <div className={`${styles.field} ${styles.passwordField}`}><div className={styles.labelRow}><label htmlFor="account-password">{t.password}</label>{mode === "login" ? <Link href="/forgot-password">{t.forgot}</Link> : null}</div><div className={styles.password}><input id="account-password" name="password" type={showPassword ? "text" : "password"} required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "register" ? t.newPassword : t.currentPassword}/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? t.hide : t.show} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
            </fieldset>
            <p className={styles.feedback} role={error ? "alert" : "status"}>{error ? authError(error, mode, language) : "\u00a0"}</p>
            <button type="submit" disabled={busy} className={styles.submit}>{busy ? t.busy : mode === "login" ? t.continue : t.create}<ArrowRight size={16}/></button>
          </form>}
        </div>
      </section>
      <div className={styles.art} aria-hidden="true"><AuthFlowerVideo variant={mode}/></div>
    </div>
  </main>;
}
