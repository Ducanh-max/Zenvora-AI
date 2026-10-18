"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const supabase=createClient();
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error) throw error;
      router.push("/learn"); router.refresh();
    } catch(err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập.");
    } finally { setBusy(false); }
  }
  return <main className="authpage"><Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link><section className="authcard"><div className="eyebrow">CHÀO MỪNG TRỞ LẠI</div><h1>Tiếp tục hành trình<br/><em>học tiếng Anh.</em></h1><p>Đăng nhập để tiếp tục bài học của bạn.</p><form onSubmit={submit}><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label>Mật khẩu</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu"/>{error&&<div className="formerror">{error}</div>}<button className="btn authsubmit" disabled={busy}>{busy?"Đang đăng nhập...":"Đăng nhập"}</button></form><div className="authswitch">Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link></div></section></main>;
}
