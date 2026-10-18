"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type DemoAccount = { name: string; email: string; password: string };
const ACCOUNTS_KEY = "zenvora_demo_accounts";
export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const accounts: DemoAccount[] = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
      const account = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
      if (!account) { setError("Email hoặc mật khẩu chưa đúng. Hãy đăng ký tài khoản demo trước nhé."); return; }
      localStorage.setItem("zenvora_demo_session", JSON.stringify({name:account.name,email:account.email}));
      document.cookie = "zenvora_demo_session=1; Path=/; Max-Age=604800; SameSite=Lax";
      router.push("/learn"); router.refresh();
    } catch { setError("Không thể đăng nhập. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }
  return <main className="authpage"><Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link><section className="authcard"><div className="eyebrow">CHÀO MỪNG TRỞ LẠI</div><h1>Tiếp tục hành trình<br/><em>học tiếng Anh.</em></h1><p>Đăng nhập để tiếp tục bài học của bạn.</p><form onSubmit={submit}><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label>Mật khẩu</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu"/>{error&&<div className="formerror">{error}</div>}<button className="btn authsubmit" disabled={busy}>{busy?"Đang đăng nhập...":"Đăng nhập"}</button></form><div className="authswitch">Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link></div><p className="demo-note">Chế độ trải nghiệm: tài khoản được lưu trên trình duyệt này.</p></section></main>;
}
