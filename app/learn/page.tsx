"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, BookOpen, Dumbbell, MessageCircle, Mic2, BookText, LogOut, LockKeyhole, ArrowRight, Menu, Trophy, Sparkles, Languages, UserRound } from "lucide-react";

type Lang = "vi" | "en";
const copy = {
 vi: {
  overview:"Tổng quan", learning:"Khóa học của tôi", practice:"Luyện tập", tutor:"Gia sư AI", speaking:"Luyện nói", dictionary:"Từ điển",
  space:"KHÔNG GIAN HỌC TẬP", rewards:"WORD REWARDS", keep:"Tiếp tục học để mở khóa phần thưởng!", level:"CẤP ĐỘ",
  journey:"HÀNH TRÌNH HỌC TẬP CỦA BẠN", dashboard:"Bảng điều khiển học tập", hello:"Chào mừng đến với", lead:"Tiến bộ từng ngày — bắt đầu hành trình tiếng Anh của bạn ngay hôm nay.",
  lessons:"Bài học", topics:"Học theo chủ đề", practiceCard:"Luyện tập", quizzes:"Câu hỏi tương tác", assistant:"Gia sư AI", support:"Trợ lý học tập",
  courses:"Khóa học của bạn", free:"MIỄN PHÍ", soon:"SẮP MỞ", enter:"Vào học", locked:"Chưa mở khóa", lessonsCount:"3 bài học",
  demo:"Tài khoản và dữ liệu học tập của bạn được đồng bộ an toàn qua Supabase.", account:"Người dùng", levelUnknown:"Cấp độ: Chưa xác định", logout:"Đăng xuất", confirmTitle:"Bạn có chắc chắn muốn đăng xuất không?", confirmBody:"Bạn sẽ được đưa về trang đăng nhập.", cancel:"Ở lại", confirm:"Đăng xuất", menu:"Mở menu", demoAccount:"Tài khoản",
  descriptions:["500 bài học, luyện nói, 15 câu kiểm tra mỗi bài và 40 năng lượng Sói.","800 bài học, luyện nói, 50 câu kiểm tra mỗi bài và 100 năng lượng Sói.","1.400 bài học, luyện nói, 50 câu kiểm tra và năng lượng không giới hạn.","2.100 bài học, luyện thi IELTS/TOEFL và gọi thoại cùng mascot Sói."],
  levels:["Miễn phí","49.000đ/tháng","99.000đ/tháng","149.000đ/tháng"]
 },
 en: {
  overview:"Overview", learning:"My learning", practice:"Practice", tutor:"AI Tutor", speaking:"Speaking", dictionary:"Dictionary",
  space:"LEARNING SPACE", rewards:"WORD REWARDS", keep:"Keep learning to unlock rewards!", level:"LEVEL",
  journey:"YOUR LEARNING JOURNEY", dashboard:"Learning dashboard", hello:"Welcome to", lead:"Make progress every day — start your English journey today.",
  lessons:"Lessons", topics:"Learn by topic", practiceCard:"Practice", quizzes:"Interactive quizzes", assistant:"AI Tutor", support:"Your learning assistant",
  courses:"Your courses", free:"FREE", soon:"COMING SOON", enter:"Start learning", locked:"Locked", lessonsCount:"12 lessons available",
  demo:"Your account and learning data are securely synced with Supabase.", account:"User", levelUnknown:"Level: Not set", logout:"Log out", confirmTitle:"Are you sure you want to log out?", confirmBody:"You will be taken back to the login page.", cancel:"Stay", confirm:"Log out", menu:"Open menu", demoAccount:"Account",
  descriptions:["500 lessons, speaking, 15-question mini tests and 40 Wolf Energy.","800 lessons, speaking, 50-question mini tests and 100 Wolf Energy.","1,400 lessons, speaking, 50-question mini tests and unlimited energy.","2,100 lessons, IELTS/TOEFL practice and voice calls with the Wolf mascot."],
  levels:["Free","49,000 VND/month","99,000 VND/month","149,000 VND/month"]
 }
};
const courseNames=["Aunora Sprout","Aunora Explorer","Aunora Achiever","Aunora Mastery"];
const coursePrices=["FREE","49.000đ / tháng","99.000đ / tháng","149.000đ / tháng"];
const menuItems = [
 {key:"overview" as const,href:"/learn",icon:LayoutDashboard,active:true},
 {key:"learning" as const,href:"#courses",icon:BookOpen},
 {key:"practice" as const,href:"/learn/library",icon:Dumbbell},
 {key:"tutor" as const,href:"/learn/tutor",icon:MessageCircle,ai:true},
 {key:"speaking" as const,href:"#speaking",icon:Mic2},
 {key:"dictionary" as const,href:"#dictionary",icon:BookText}
];
export default function LearnPage() {
 const [profile,setProfile] = useState<{name:string;email:string;avatar:string}|null>(null);
 const [mobileOpen,setMobileOpen] = useState(false);
 const [lang,setLang] = useState<Lang>("vi");
 const [showLogoutConfirm,setShowLogoutConfirm] = useState(false);
 useEffect(()=>{
  let active = true;
  async function loadAccount() {
   try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    if (active) setProfile({ name: data?.display_name || user.user_metadata?.display_name || "", email: user.email || "", avatar: user.user_metadata?.avatar_url || "" });
   } catch { if (active) setProfile({ name: "", email: "", avatar: "" }); }
  }
  loadAccount();
  try { const saved=localStorage.getItem("aunora_language"); if(saved==="en"||saved==="vi")setLang(saved); } catch {}
  return ()=>{ active = false; };
 },[]);
 function changeLang(value:Lang){setLang(value);try{localStorage.setItem("aunora_language",value);}catch{}}
 async function logout(){
  try { const supabase=createClient(); await supabase.auth.signOut(); } finally { window.location.href="/"; }
 }
 const t=copy[lang];
 return <main className="aunora-app">
  <aside className={`aunora-sidebar ${mobileOpen?"sidebar-open":""}`}>
   <Link href="/learn" className="aunora-brand"><span className="wolf-logo"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 8 19 13 24 9 29 13 41 8 38 29 31 39 24 34 17 39 10 29Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="m16 21 5 2m11-2-5 2m-3 2v5m-6 1 6-3 6 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link>
   <div className="sidebar-group-title">{t.space}</div>
   <nav className="aunora-menu">{menuItems.map(item=><Link key={item.key} href={item.href} onClick={()=>setMobileOpen(false)} className={`aunora-menu-item ${item.active?"active":""}`}><item.icon size={19}/><span>{t[item.key]}</span>{item.ai&&<b className="ai-tag">AI</b>}</Link>)}</nav>
   <div className="sidebar-account"><Link href="/learn/profile" className="account-avatar account-avatar-link" title="Chỉnh sửa hồ sơ">{profile?.avatar?<img src={profile.avatar} alt="Avatar"/>:(profile?.name||profile?.email?<span>{(profile?.name||profile?.email||"U").slice(0,1).toUpperCase()}</span>:<UserRound size={17}/>)}</Link><Link href="/learn/profile" className="account-details account-details-link"><b>{profile?.name||profile?.email||t.account}</b><span>{lang==="vi"?"Chỉnh sửa hồ sơ":"Edit profile"}</span></Link><button onClick={()=>setShowLogoutConfirm(true)} title={t.logout} aria-label={t.logout}><LogOut size={17}/></button></div>
   <div className="wolf-rewards">
    <div className="reward-heading"><span>{t.rewards}</span><span className="reward-level">{t.level} 0</span></div>
    <div className="reward-emblem"><div className="reward-emblem-ring"><Trophy size={30} strokeWidth={1.8}/><Sparkles className="reward-sparkle" size={15}/></div></div>
    <div className="reward-xp"><b>0 XP</b><span>50,000 XP</span></div><div className="reward-track"><i/></div><p>0 / 50000 XP</p><small>{t.keep}</small>
   </div>
  </aside>
  <section className="aunora-main">
   <header className="aunora-topbar"><button className="mobile-menu-button" onClick={()=>setMobileOpen(!mobileOpen)} aria-label={t.menu}><Menu/></button><div><span className="topbar-kicker">{t.journey}</span><b>{t.dashboard}</b></div><div className="topbar-actions"><div className="language-control" role="group" aria-label="Select interface language"><span className="language-control-label"><Languages size={14}/> LANGUAGE</span><div className="language-segment"><button type="button" className={lang==="vi"?"selected":""} aria-pressed={lang==="vi"} onClick={()=>changeLang("vi")} title="Tiếng Việt">VI</button><button type="button" className={lang==="en"?"selected":""} aria-pressed={lang==="en"} onClick={()=>changeLang("en")} title="English">EN</button></div></div><div className="topbar-user">{profile?.name||profile?.email||t.demoAccount}</div></div></header>
   <div className="learnwrap"><div className="eyebrow">{t.space}</div><h1>{t.hello} <em>AUNORA.</em></h1><p className="learnlead">{t.lead}</p>
    <div className="learnfeatures"><article><BookOpen/><b>{t.lessons}</b><span>{t.topics}</span></article><article><Dumbbell/><b>{t.practiceCard}</b><span>{t.quizzes}</span></article><Link href="/learn/tutor" className="learnfeature-link"><article id="ai-tutor"><MessageCircle/><b>{t.assistant}</b><span>{t.support}</span></article></Link></div>
    <div id="courses"><div className="course-section-heading"><h2>{t.courses}</h2><Link href="/courses" className="all-plans-link">{lang==="vi"?"Xem chi tiết 4 gói học":"Explore all 4 plans"} <ArrowRight size={15}/></Link></div><div className="coursegrid">{courseNames.map((name,i)=><article className="learncourse" key={name}><div className="learncoursehead"><span className={i===0?"freeflag":"lockflag"}>{i===0?t.free:<><LockKeyhole size={12}/> {lang==="vi"?"GÓI THÀNH VIÊN":"MEMBERSHIP"}</>}</span><span>{String(i+1).padStart(2,"0")}</span></div><div className="learnletter">{name.slice(7,8)}</div><h3>{name}</h3><p>{t.descriptions[i]}</p><div className="learnmeta"><span>{t.levels[i]}</span><span>{coursePrices[i]}</span></div>{i===0?<Link href="/learn/library" className="coursebutton">{t.enter} <ArrowRight size={15}/></Link>:<Link href="/courses" className="coursebutton">{lang==="vi"?"Xem quyền lợi":"View benefits"} <ArrowRight size={15}/></Link>}</article>)}</div></div>
    <p className="demo-note">{t.demo}</p>
   </div>
  </section>
  {showLogoutConfirm&&<div className="logout-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowLogoutConfirm(false);}}><section className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title"><div className="logout-modal-icon"><LogOut size={22}/></div><h2 id="logout-title">{t.confirmTitle}</h2><p>{t.confirmBody}</p><div className="logout-modal-actions"><button type="button" className="logout-cancel" onClick={()=>setShowLogoutConfirm(false)}>{t.cancel}</button><button type="button" className="logout-confirm" onClick={logout}>{t.confirm}</button></div></section></div>}
 </main>;
}
