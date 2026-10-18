"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, BookOpen, Dumbbell, MessageCircle, Mic2, BookText, LogOut, LockKeyhole, ArrowRight, Menu } from "lucide-react";

const courses = [
  {id:"starter",slug:"english-starter",title:"English Starter",level:"Beginner",description:"Xây dựng nền tảng tiếng Anh với những mẫu câu giao tiếp đầu tiên.",is_free:true},
  {id:"conversation",title:"Daily Conversation",level:"Beginner",description:"Luyện những tình huống giao tiếp quen thuộc hằng ngày.",is_free:false},
  {id:"grammar",title:"Grammar Boost",level:"Elementary",description:"Nắm chắc ngữ pháp qua ví dụ và bài tập ngắn.",is_free:false},
  {id:"listening",title:"Listening Lab",level:"Elementary",description:"Rèn kỹ năng nghe và nhận biết từ vựng.",is_free:false},
  {id:"speaking",title:"Speaking Confidence",level:"Pre-intermediate",description:"Tự tin diễn đạt suy nghĩ bằng tiếng Anh.",is_free:false},
];
const menu = [
  {label:"Overview",href:"/learn",icon:LayoutDashboard,active:true},
  {label:"My learning",href:"#courses",icon:BookOpen},
  {label:"Practice",href:"/learn/starter",icon:Dumbbell},
  {label:"AI Tutor",href:"#ai-tutor",icon:MessageCircle,ai:true},
  {label:"Speaking",href:"#speaking",icon:Mic2},
  {label:"Dictionary",href:"#dictionary",icon:BookText},
];
export default function LearnPage() {
  const [profile,setProfile] = useState<{name:string;email:string}|null>(null);
  const [mobileOpen,setMobileOpen] = useState(false);
  useEffect(()=>{try{const raw=localStorage.getItem("zenvora_demo_session");if(raw)setProfile(JSON.parse(raw));}catch{}},[]);
  function logout(){localStorage.removeItem("zenvora_demo_session");document.cookie="zenvora_demo_session=; Path=/; Max-Age=0; SameSite=Lax";window.location.href="/login";}
  return <main className="aunora-app">
    <aside className={`aunora-sidebar ${mobileOpen?"sidebar-open":""}`}>
      <Link href="/learn" className="aunora-brand"><span className="wolf-logo"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 8 19 13 24 9 29 13 41 8 38 29 31 39 24 34 17 39 10 29Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="m16 21 5 2m11-2-5 2m-3 2v5m-6 1 6-3 6 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link>
      <div className="sidebar-group-title">LEARNING SPACE</div>
      <nav className="aunora-menu">{menu.map(item=><Link key={item.label} href={item.href} onClick={()=>setMobileOpen(false)} className={`aunora-menu-item ${item.active?"active":""}`}><item.icon size={19}/><span>{item.label}</span>{item.ai&&<b className="ai-tag">AI</b>}</Link>)}</nav>
      <div className="wolf-rewards"><div className="reward-heading"><span>WORD REWARDS</span><span className="reward-level">LV. 0</span></div><div className="reward-mascot">🐺</div><div className="reward-xp"><b>0 XP</b><span>50,000 XP</span></div><div className="reward-track"><i/></div><p>0 / 50000 XP</p><small>Keep learning to grow!</small></div>
      <div className="sidebar-account"><div className="account-avatar">{(profile?.name||profile?.email||"U").slice(0,1).toUpperCase()}</div><div className="account-details"><b>{profile?.name||profile?.email||"Người dùng"}</b><span>Level: Chưa xác định</span></div><button onClick={logout} title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={17}/></button></div>
    </aside>
    <section className="aunora-main">
      <header className="aunora-topbar"><button className="mobile-menu-button" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Mở menu"><Menu/></button><div><span className="topbar-kicker">YOUR LEARNING JOURNEY</span><b>Learning dashboard</b></div><div className="topbar-user">{profile?.name||profile?.email||"Tài khoản demo"}</div></header>
      <div className="learnwrap"><div className="eyebrow">KHÔNG GIAN HỌC TẬP</div><h1>Chào mừng đến với <em>AUNORA.</em></h1><p className="learnlead">Mỗi ngày một chút tiến bộ — bắt đầu hành trình tiếng Anh của bạn ngay hôm nay.</p>
        <div className="learnfeatures"><article><BookOpen/><b>Bài học</b><span>Học theo chủ đề</span></article><article><Dumbbell/><b>Luyện tập</b><span>Quiz tương tác</span></article><article id="ai-tutor"><MessageCircle/><b>AI Tutor</b><span>Trợ lý học tập</span></article></div>
        <div id="courses"><h2>Khóa học của bạn</h2><div className="coursegrid">{courses.map((course,i)=><article className="learncourse" key={course.id}><div className="learncoursehead"><span className={course.is_free?"freeflag":"lockflag"}>{course.is_free?"MIỄN PHÍ":<><LockKeyhole size={12}/> SẮP MỞ</>}</span><span>{String(i+1).padStart(2,"0")}</span></div><div className="learnletter">{course.title.slice(0,1).toUpperCase()}</div><h3>{course.title}</h3><p>{course.description}</p><div className="learnmeta"><span>{course.level}</span><span>{course.is_free?"3 bài học":"Sắp ra mắt"}</span></div>{course.is_free?<Link href="/learn/starter" className="coursebutton">Vào học <ArrowRight size={15}/></Link>:<button className="coursebutton disabled" disabled>Chưa mở khóa</button>}</article>)}</div></div>
        <p className="demo-note">Bạn đang sử dụng chế độ trải nghiệm. Tài khoản và tiến độ demo được lưu trên trình duyệt này.</p>
      </div>
    </section>
  </main>;
}
