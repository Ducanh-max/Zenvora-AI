"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, BookOpen, Dumbbell, MessageCircle, Mic2, BookText, LogOut, ArrowRight, Menu, Trophy, Sparkles, Languages, UserRound, Bell, Compass, ClipboardCheck, Flame, Star, Target, ChevronDown } from "lucide-react";

type Lang = "vi" | "en";
const copy = {
 vi: {
  overview:"Trang chủ", learning:"Khóa học", practice:"Luyện tập", tutor:"AI Tutor", speaking:"Luyện nói", dictionary:"Từ điển",
  space:"KHÔNG GIAN HỌC TẬP", journey:"HÀNH TRÌNH CỦA BẠN", dashboard:"Bảng điều khiển",
  hello:"Chào mừng trở lại!", lead:"Cùng AUNORA và AI Tutor, chinh phục tiếng Anh mỗi ngày!",
  heroQuote:"Better English, Brighter Future", tutorTitle:"Mình là Aivanta!", tutorText:"Gia sư AI đồng hành cùng bạn trên hành trình học tiếng Anh. Cùng bắt đầu nhé!",
  courses:"Khóa học", coursesText:"5 khóa học từ cơ bản đến nâng cao.", explore:"Khám phá",
  practiceTitle:"Luyện tập", practiceText:"Ôn từ vựng và củng cố kiến thức.", start:"Bắt đầu",
  tests:"Kiểm tra", testsText:"Đánh giá kiến thức qua câu hỏi tương tác.", testNow:"Làm bài",
  chat:"Trò chuyện AI", chatText:"Hỏi bài và luyện tiếng Anh cùng Aivanta.", chatNow:"Chat ngay",
  yourCourses:"Khóa học của bạn", seeAll:"Xem tất cả", free:"MIỄN PHÍ", enter:"Vào học",
  profile:"Hồ sơ", logout:"Đăng xuất", confirmTitle:"Bạn có chắc chắn muốn đăng xuất không?", confirmBody:"Bạn sẽ được đưa về trang chủ.", cancel:"Ở lại", confirm:"Đăng xuất",
  encouragement:"Mỗi ngày học một chút, bạn sẽ tiến bộ rất nhiều!", quote:"“Small steps every day lead to big changes.”",
  cta:"Học cùng AI – Thật đơn giản!", ctaText:"Aivanta luôn sẵn sàng giải đáp và luyện tập cùng bạn.", begin:"Bắt đầu ngay",
  account:"Tài khoản", language:"Ngôn ngữ", menu:"Mở menu", courseDescriptions:["Nền tảng tiếng Anh cho người mới bắt đầu.","Giao tiếp tự nhiên trong các tình huống hằng ngày.","Tiếng Anh thực tế khi đi du lịch.","Nắm vững ngữ pháp qua ví dụ và bài tập.","Tự tin trò chuyện và bày tỏ ý kiến."]
 },
 en: {
  overview:"Home", learning:"Courses", practice:"Practice", tutor:"AI Tutor", speaking:"Speaking", dictionary:"Dictionary",
  space:"YOUR LEARNING SPACE", journey:"YOUR JOURNEY", dashboard:"Learning dashboard",
  hello:"Welcome back!", lead:"Learn English every day with AUNORA and your AI Tutor!",
  heroQuote:"Better English, Brighter Future", tutorTitle:"I'm Aivanta!", tutorText:"Your AI tutor and learning companion. Let's make your English journey brighter!",
  courses:"Courses", coursesText:"Five courses from beginner to advanced.", explore:"Explore",
  practiceTitle:"Practice", practiceText:"Review vocabulary and strengthen your skills.", start:"Start",
  tests:"Quick tests", testsText:"Check your knowledge with interactive questions.", testNow:"Take a test",
  chat:"AI Chat", chatText:"Ask questions and practise English with Aivanta.", chatNow:"Chat now",
  yourCourses:"Your courses", seeAll:"View all", free:"FREE", enter:"Start learning",
  profile:"Profile", logout:"Log out", confirmTitle:"Are you sure you want to log out?", confirmBody:"You will be taken to the home page.", cancel:"Stay", confirm:"Log out",
  encouragement:"A little practice every day makes a big difference!", quote:"“Small steps every day lead to big changes.”",
  cta:"Learn with AI – It's that simple!", ctaText:"Aivanta is always ready to answer and practise with you.", begin:"Start now",
  account:"Account", language:"Language", menu:"Open menu", courseDescriptions:["Build your English foundation from scratch.","Communicate naturally in everyday situations.","Practical English for travelling.","Master grammar through examples and practice.","Speak confidently and share your opinions."]
 }
};
const courseNames=["English Starter","Everyday English","English for Travel","Grammar in Action","Confident Conversations"];
const courseSlugs=["english-starter","everyday-english","english-for-travel","grammar-in-action","confident-conversations"];
const courseLevels=["A1","A1–A2","A2","A2–B1","B1"];
const menuItems=[
 {key:"overview" as const,href:"/learn",icon:LayoutDashboard,active:true},
 {key:"learning" as const,href:"/learn/library",icon:BookOpen},
 {key:"practice" as const,href:"/learn/library",icon:Dumbbell},
 {key:"tutor" as const,href:"/learn/tutor",icon:MessageCircle,ai:true},
 {key:"speaking" as const,href:"/learn/tutor",icon:Mic2},
 {key:"dictionary" as const,href:"/learn/library",icon:BookText}
];
export default function LearnPage(){
 const [profile,setProfile]=useState<{name:string;email:string;avatar:string}|null>(null);
 const [mobileOpen,setMobileOpen]=useState(false);
 const [lang,setLang]=useState<Lang>("vi");
 const [showLogoutConfirm,setShowLogoutConfirm]=useState(false);
 useEffect(()=>{
  let active=true;
  async function loadAccount(){
   try{
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/login";return;}
    const {data}=await supabase.from("profiles").select("display_name,avatar_url").eq("id",user.id).maybeSingle();
    if(active)setProfile({name:data?.display_name||user.user_metadata?.display_name||user.email?.split("@")[0]||"",email:user.email||"",avatar:data?.avatar_url||user.user_metadata?.avatar_url||""});
   }catch{if(active)setProfile({name:"",email:"",avatar:""});}
  }
  void loadAccount();
  try{const saved=localStorage.getItem("aunora_language");if(saved==="en"||saved==="vi")setLang(saved);}catch{}
  return()=>{active=false;};
 },[]);
 function changeLang(value:Lang){setLang(value);try{localStorage.setItem("aunora_language",value);}catch{}}
 async function logout(){try{const supabase=createClient();await supabase.auth.signOut();}finally{window.location.href="/";}}
 const t=copy[lang];
 return <main className="aunora-dashboard">
  <aside className={`aunora-side ${mobileOpen?"is-open":""}`}>
   <Link href="/learn" className="aunora-logo-lockup"><span className="aunora-logo-symbol"><img className="aunora-brand-logo" src="/brand/aunora-logo.webp.png" alt="" onError={(event)=>{event.currentTarget.style.display="none";}}/><span className="brand-logo-fallback">A</span></span><span><b>AUNORA</b><small>HỌC TIẾNG ANH CÙNG AI</small></span></Link>
   <div className="side-caption">{t.space}</div>
   <nav className="side-nav">{menuItems.map(item=><Link key={item.key} href={item.href} onClick={()=>setMobileOpen(false)} className={item.active?"current":""}><item.icon size={19}/><span>{t[item.key]}</span>{item.ai&&<i>AI</i>}</Link>)}</nav>
   <div className="side-bottom"><div className="side-account"><Link href="/learn/profile" className="side-user-avatar">{profile?.avatar?<img src={profile.avatar} alt="Avatar"/>:<UserRound size={19}/>}</Link><div><b>{profile?.name||t.account}</b><Link href="/learn/profile">{t.profile}</Link></div><button onClick={()=>setShowLogoutConfirm(true)} aria-label={t.logout} title={t.logout}><LogOut size={17}/></button></div>
    <div className="side-language"><Languages size={17}/><span>{t.language}</span><div><button className={lang==="vi"?"chosen":""} onClick={()=>changeLang("vi")}>VI</button><button className={lang==="en"?"chosen":""} onClick={()=>changeLang("en")}>EN</button></div></div>
   </div>
  </aside>
  <section className="aunora-dash-main">
   <header className="dash-topbar"><button className="dash-mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)} aria-label={t.menu}><Menu/></button><div className="dash-breadcrumb"><span>{t.journey}</span><b>{t.dashboard}</b></div><div className="dash-top-actions"><button className="dash-notification" aria-label="Notifications"><Bell size={20}/><i/></button><Link href="/learn/profile" className="dash-profile">{profile?.avatar?<img src={profile.avatar} alt=""/>:<span className="dash-avatar-fallback">{(profile?.name||"A").slice(0,1).toUpperCase()}</span>}<b>{profile?.name||t.account}</b><ChevronDown size={15}/></Link></div></header>
   <div className="dash-content">
    <div className="dash-welcome"><div><span className="dash-eyebrow"><Sparkles size={14}/> AUNORA · LEARN • GROW • GLOW</span><h1>{t.hello} <span>👋</span></h1><p>{t.lead}</p></div><div className="dash-date-pill"><Star size={15}/> {t.encouragement}</div></div>
    <section className="dash-hero">
     <div className="dash-hero-copy"><span>{t.heroQuote}</span><h2>{lang==="vi"?"Mỗi bước nhỏ, một tương lai tự tin hơn.":"Every small step builds a brighter future."}</h2><p>{t.tutorText}</p><Link href="/learn/tutor">{t.chatNow} <ArrowRight size={16}/></Link></div>
     <div className="aivanta-hero" aria-label="Aivanta, AI English tutor"><div className="aivanta-orbit orbit-one"/><div className="aivanta-orbit orbit-two"/><div className="aivanta-avatar aivanta-photo"><span className="aivanta-fallback">🐺</span><img src="/brand/aivanta-mascot.webp.png" alt="" onLoad={(event)=>{const fallback=event.currentTarget.previousElementSibling as HTMLElement|null;if(fallback)fallback.style.display="none";}} onError={(event)=>{event.currentTarget.style.display="none";}}/></div><div className="aivanta-bubble"><b>{t.tutorTitle}</b><span>{lang==="vi"?"Cùng học tiếng Anh nhé!":"Let's learn English together!"}</span><small>✦ Aivanta · AI Tutor</small></div><div className="aivanta-spark spark-a">✦</div><div className="aivanta-spark spark-b">✧</div></div>
    </section>
    <section className="dash-shortcuts">
     <article className="shortcut-card shortcut-blue"><div className="shortcut-icon"><BookOpen/></div><h3>{t.courses}</h3><p>{t.coursesText}</p><Link href="/learn/library">{t.explore} <ArrowRight size={15}/></Link></article>
     <article className="shortcut-card shortcut-mint"><div className="shortcut-icon"><Target/></div><h3>{t.practiceTitle}</h3><p>{t.practiceText}</p><Link href="/learn/library">{t.start} <ArrowRight size={15}/></Link></article>
     <article className="shortcut-card shortcut-violet"><div className="shortcut-icon"><ClipboardCheck/></div><h3>{t.tests}</h3><p>{t.testsText}</p><Link href="/learn/library">{t.testNow} <ArrowRight size={15}/></Link></article>
     <article className="shortcut-card shortcut-cyan"><div className="shortcut-icon"><MessageCircle/></div><h3>{t.chat}</h3><p>{t.chatText}</p><Link href="/learn/tutor">{t.chatNow} <ArrowRight size={15}/></Link></article>
    </section>
    <div className="dash-lower-grid"><section className="dash-courses" id="courses"><div className="dash-section-heading"><div><span>{t.space}</span><h2>{t.yourCourses}</h2></div><Link href="/learn/library">{t.seeAll} <ArrowRight size={15}/></Link></div><div className="dash-course-grid">{courseNames.map((name,i)=><Link key={name} href={`/learn/library?course=${courseSlugs[i]}`} className={`dash-course-card course-tone-${i}`}><div className="dash-course-art"><span>{["A","Hi","✈","文","✦"][i]}</span><small>{courseLevels[i]}</small></div><div className="dash-course-info"><b>{name}</b><span>{courseLevels[i]} · {i===0?t.free:(lang==="vi"?"Khóa học":"Course")}</span></div><div className="dash-course-link">{t.enter} <ArrowRight size={14}/></div></Link>)}</div></section>
     <aside className="dash-side-column"><section className="dash-aivanta-card"><div className="mini-aivanta"><span className="mini-aivanta-fallback">🐺</span><img src="/brand/aivanta-mascot.webp.png" alt="" onLoad={(event)=>{const fallback=event.currentTarget.previousElementSibling as HTMLElement|null;if(fallback)fallback.style.display="none";}} onError={(event)=>{event.currentTarget.style.display="none";}}/></div><div><b>{t.tutorTitle}</b><p>{t.tutorText}</p><Link href="/learn/tutor">{t.chatNow} <ArrowRight size={14}/></Link></div></section><section className="dash-quote-card"><div className="quote-stars">✦ ✧ ✦</div><p>{t.quote}</p><small>— Aivanta</small></section></aside>
    </div>
    <section className="dash-memberships" id="memberships">
      <div className="dash-section-heading"><div><span>{lang==="vi"?"CHỌN GÓI HỌC PHÙ HỢP":"LEARNING OPTIONS"}</span><h2>{lang==="vi"?"Khám phá gói học phù hợp với bạn":"Find your ideal learning plan"}</h2></div></div>
      <p className="dash-memberships-intro">{lang==="vi"?"Xem đặc quyền của từng gói và chọn lộ trình phù hợp. Hiện tại cả 5 khóa học vẫn miễn phí; các gói nâng cấp chưa mở bán.":"Explore our learning plans. All five courses remain free to access; upgrades are not yet available."}</p>
      <a className="dash-benefits-all" href="#plan-benefits">{lang==="vi"?"Xem tất cả đặc quyền":"View all benefits"} <ArrowRight size={16}/></a>
      <div className="dash-membership-grid" id="plan-benefits">
       {[
        {name:"Free",icon:"✦",vi:"Bắt đầu hành trình",en:"Start your journey",featured:false,featuresVi:["Truy cập 5 khóa học hiện tại","Bài học, luyện tập và kiểm tra","Sử dụng AI Tutor","Theo dõi tiến trình"],featuresEn:["Access 5 current courses","Lessons, practice and quizzes","Use AI Tutor","Track your progress"]},
        {name:"Starter",icon:"♧",vi:"Học đều mỗi ngày",en:"Build a daily habit",featured:false,featuresVi:["Dự kiến bao gồm quyền lợi Free","Bài tập mở rộng (dự kiến)","Báo cáo học tập (dự kiến)"],featuresEn:["Planned Free benefits","Extra exercises (planned)","Learning reports (planned)"]},
        {name:"Pro",icon:"♛",vi:"Học tập chuyên sâu",en:"Learn more deeply",featured:true,featuresVi:["Dự kiến bao gồm quyền lợi Starter","Lộ trình cá nhân hóa (dự kiến)","Phân tích điểm mạnh (dự kiến)"],featuresEn:["Planned Starter benefits","Personalized paths (planned)","Strength analysis (planned)"]},
        {name:"Premium",icon:"◆",vi:"Trải nghiệm nâng cao",en:"An enhanced experience",featured:false,featuresVi:["Dự kiến bao gồm quyền lợi Pro","Tính năng AI mở rộng (dự kiến)","Hỗ trợ ưu tiên (dự kiến)"],featuresEn:["Planned Pro benefits","Expanded AI tools (planned)","Priority support (planned)"]}
       ].map(plan=><article className={`dash-membership-card ${plan.featured?"featured":""}`} key={plan.name}>
        <span className="dash-membership-icon">{plan.icon}</span>
        <h3>{plan.name==="Free"?(lang==="vi"?"Gói Miễn Phí":"Free Plan"):(lang==="vi"?"Gói ":"Plan ")+plan.name}</h3><p>{lang==="vi"?plan.vi:plan.en}</p><ul className="dash-plan-feature-list">{(lang==="vi"?plan.featuresVi:plan.featuresEn).map(feature=><li key={feature}><span>✓</span>{feature}</li>)}</ul>
        <strong>{plan.name==="Free"?(lang==="vi"?"Miễn phí":"Free"):(lang==="vi"?"Sắp ra mắt":"Coming soon")}</strong>
        {plan.name==="Free"?<Link href="/learn/library">{lang==="vi"?"Vào học":"Start learning"} <ArrowRight size={15}/></Link>:<span className="dash-membership-unavailable">{lang==="vi"?"Chưa mở đăng ký":"Not available yet"}</span>}
        <a className="dash-plan-benefits" href="#plan-benefits">{lang==="vi"?"Xem đặc quyền gói":"View plan benefits"} <ArrowRight size={15}/></a>
       </article>)}
      </div>
    </section>
    <section className="dash-bottom-cta"><div className="cta-mascot"><span className="mini-aivanta-fallback">🐺</span><img src="/brand/aivanta-mascot.webp.png" alt="" onLoad={(event)=>{const fallback=event.currentTarget.previousElementSibling as HTMLElement|null;if(fallback)fallback.style.display="none";}} onError={(event)=>{event.currentTarget.style.display="none";}}/></div><div><h2>{t.cta}</h2><p>{t.ctaText}</p></div><Link href="/learn/tutor">{t.begin} <ArrowRight size={16}/></Link></section>
   </div>
  </section>
  {showLogoutConfirm&&<div className="logout-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowLogoutConfirm(false);}}><section className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title"><div className="logout-modal-icon"><LogOut size={22}/></div><h2 id="logout-title">{t.confirmTitle}</h2><p>{t.confirmBody}</p><div className="logout-modal-actions"><button type="button" className="logout-cancel" onClick={()=>setShowLogoutConfirm(false)}>{t.cancel}</button><button type="button" className="logout-confirm" onClick={logout}>{t.confirm}</button></div></section></div>}
 </main>;
}
