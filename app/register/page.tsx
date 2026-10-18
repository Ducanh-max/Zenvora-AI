"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router=useRouter();
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const supabase=createClient();
      const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:`${window.location.origin}/auth/callback?next=/learn`}});
      if(error) throw error;
      if(data.session){router.push("/learn");router.refresh();}
      else setMessage("Tạo tài khoản thành công. Hãy kiểm tra email để xác nhận trước khi đăng nhập.");
    } catch(err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản.");
    } finally { setBusy(false); }
  }
  return <main className="authpage"><Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link><section className="authcard"><div className="eyebrow">BẮT ĐẦU MIỄN PHÍ</div><h1>Tạo tài khoản<br/><em>Zenvora AI.</em></h1><p>Mỗi ngày một bước nhỏ, tiếng Anh tiến bộ hơn.</p><form onSubmit={submit}><label>Họ và tên</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Tên của bạn"/><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label>Mật khẩu</label><input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Ít nhất 8 ký tự"/>{error&&<div className="formerror">{error}</div>}{message&&<div className="formsuccess">{message}</div>}<button className="btn authsubmit" disabled={busy}>{busy?"Đang tạo tài khoản...":"Tạo tài khoản"}</button></form><div className="authswitch">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></div></section></main>;
}
