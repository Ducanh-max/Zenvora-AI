"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type DemoAccount = { name: string; email: string; password: string };
const ACCOUNTS_KEY = "zenvora_demo_accounts";
export default function RegisterPage() {
  const router=useRouter();
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const accounts: DemoAccount[] = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
      const normalizedEmail = email.trim().toLowerCase();
      if (accounts.some(a => a.email.toLowerCase() === normalizedEmail)) {
        setError("Email này đã được đăng ký. Hãy đăng nhập nhé."); return;
      }
      const account = {name:name.trim(),email:normalizedEmail,password};
      accounts.push(account);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      localStorage.setItem("zenvora_demo_session", JSON.stringify({name:account.name,email:account.email}));
      document.cookie = "zenvora_demo_session=1; Path=/; Max-Age=604800; SameSite=Lax";
      router.push("/learn"); router.refresh();
    } catch { setError("Trình duyệt không cho phép lưu tài khoản. Hãy thử bật bộ nhớ trang web."); }
    finally { setBusy(false); }
  }
  return <main className="authpage"><Link href="/" className="aunora-auth-brand"><span className="aunora-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 8 19 13 24 9 29 13 41 8 38 29 31 39 24 34 17 39 10 29Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="m16 21 5 2m11-2-5 2m-3 2v5m-6 1 6-3 6 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link><section className="authcard"><div className="eyebrow">BẮT ĐẦU MIỄN PHÍ</div><h1>Tạo tài khoản<br/><em>Zenvora AI.</em></h1><p>Mỗi ngày một bước nhỏ, tiếng Anh tiến bộ hơn.</p><form onSubmit={submit}><label>Họ và tên</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Tên của bạn"/><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label>Mật khẩu</label><input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Ít nhất 8 ký tự"/>{error&&<div className="formerror">{error}</div>}<button className="btn authsubmit" disabled={busy}>{busy?"Đang tạo tài khoản...":"Tạo tài khoản"}</button></form><div className="authswitch">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></div><p className="demo-note">Đây là tài khoản demo, chỉ lưu trên trình duyệt hiện tại; chưa phải tài khoản trực tuyến.</p></section></main>;
}
