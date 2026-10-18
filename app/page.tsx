"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, BrainCircuit, MessageCircle, Sparkles, ShieldCheck, Zap, Languages } from "lucide-react";

type Lang = "vi" | "en";
const words = {
 vi: {
  featuresNav:"Tính năng", coursesNav:"Khóa học", login:"Đăng nhập", signup:"Bắt đầu miễn phí", kicker:"HỌC TIẾNG ANH THEO CÁCH MỚI",
  title1:"Tiếng Anh tốt hơn,",title2:"bắt đầu từ hôm nay.",lead:"Học chủ động với bài tập tương tác, lộ trình rõ ràng và trợ lý AI luôn sẵn sàng đồng hành.",
  explore:"Khám phá AUNORA",viewCourses:"Xem khóa học",trust1:"Học theo tốc độ của bạn",trust2:"Bài tập ngắn, dễ tiếp thu",
  featureEyebrow:"HỌC HIỆU QUẢ HƠN",featureTitle:"Mọi thứ bạn cần để",featureAccent:"tiến bộ mỗi ngày.",featureLead:"Một không gian học tập gọn gàng, tập trung vào thực hành.",
  f1:"Bài học tương tác",f1d:"Học qua tình huống, từ vựng và câu hỏi thay vì chỉ đọc lý thuyết.",f2:"Luyện tập thông minh",f2d:"Câu hỏi tương tác, phản hồi tức thì và theo dõi tiến độ.",f3:"Gia sư AI",f3d:"Trợ lý học tập giúp giải thích ngữ pháp và luyện hội thoại.",
  space:"YOUR LEARNING SPACE",today:"Tiến độ hôm nay",word:"TỪ VỰNG HÔM NAY",meaning:"Tự tin — cảm thấy tin tưởng vào bản thân.",encourage:"✨ Tiếp tục cố gắng, bạn đang làm rất tốt!",streak:"Chuỗi học tập",ai:"Gia sư AI",
  footer:"© 2026 AUNORA. Học tốt hơn mỗi ngày."
 },
 en: {
  featuresNav:"Features",coursesNav:"Courses",login:"Log in",signup:"Get started free",kicker:"A NEW WAY TO LEARN ENGLISH",
  title1:"Better English,",title2:"starts today.",lead:"Learn actively with interactive exercises, a clear learning path, and an AI tutor ready to help.",
  explore:"Explore AUNORA",viewCourses:"Explore courses",trust1:"Learn at your own pace",trust2:"Short, effective lessons",
  featureEyebrow:"LEARN MORE EFFECTIVELY",featureTitle:"Everything you need to",featureAccent:"make progress every day.",featureLead:"A focused learning space built around practice.",
  f1:"Interactive lessons",f1d:"Learn through real-life situations, vocabulary, and questions instead of just reading theory.",f2:"Smart practice",f2d:"Interactive questions, instant feedback, and progress tracking.",f3:"AI Tutor",f3d:"A learning assistant that explains grammar and helps you practice conversations.",
  space:"YOUR LEARNING SPACE",today:"Today's progress",word:"WORD OF THE DAY",meaning:"Feeling sure about yourself.",encourage:"✨ Keep going, you're doing great!",streak:"Day streak",ai:"AI Tutor",
  footer:"© 2026 AUNORA. Learn better every day."
 }
};
export default function Home() {
 const [lang,setLang]=useState<Lang>("vi");
 useEffect(()=>{const saved=localStorage.getItem("aunora_language");if(saved==="en"||saved==="vi")setLang(saved);},[]);
 function changeLang(value:Lang){setLang(value);localStorage.setItem("aunora_language",value);}
 const t=words[lang];
 const features=[
  {icon:BookOpen,title:t.f1,text:t.f1d},
  {icon:BrainCircuit,title:t.f2,text:t.f2d},
  {icon:MessageCircle,title:t.f3,text:t.f3d}
 ];
 return <main className="marketing-page">
  <nav className="nav wrap"><Link href="/" className="aunora-auth-brand"><span className="aunora-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 8 19 13 24 9 29 13 41 8 38 29 31 39 24 34 17 39 10 29Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="m16 21 5 2m11-2-5 2m-3 2v5m-6 1 6-3 6 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link><div className="navlinks"><a href="#features">{t.featuresNav}</a><Link href="/courses">{t.coursesNav}</Link></div><div className="navactions"><div className="marketing-language" role="group" aria-label="Choose language"><Languages size={15}/><button type="button" className={lang==="vi"?"active":""} onClick={()=>changeLang("vi")}>VI</button><button type="button" className={lang==="en"?"active":""} onClick={()=>changeLang("en")}>EN</button></div><Link href="/login">{t.login}</Link><Link className="btn small" href="/register">{t.signup} <ArrowRight size={16}/></Link></div></nav>
  <section className="hero wrap"><div><div className="eyebrow"><Sparkles size={15}/> {t.kicker}</div><h1>{t.title1}<br/><em>{t.title2}</em></h1><p className="lead">{t.lead}</p><div className="actions"><Link className="btn" href="/register">{t.explore} <ArrowRight size={18}/></Link><Link className="plain" href="/courses">{t.viewCourses}</Link></div><div className="trust"><span><ShieldCheck size={16}/> {t.trust1}</span><span><Zap size={16}/> {t.trust2}</span></div></div>
  <div className="visual"><div className="glow"></div><div className="study"><div className="tiny">{t.space} <span>•••</span></div><div className="progress"><span>{t.today}</span><b>72%</b></div><div className="bar"><i/></div><div className="word"><small>{t.word}</small><strong>Confident</strong><label>/ˈkɒn.fɪ.dənt/</label><p>{t.meaning}</p><hr/><b>{t.encourage}</b></div><div className="streak">🔥 <div><b>5 {lang==="vi"?"ngày":"days"}</b><small>{t.streak}</small></div></div></div><div className="badge"><BrainCircuit/> {t.ai}</div></div></section>
  <section id="features" className="features wrap"><div className="center"><div className="eyebrow">{t.featureEyebrow}</div><h2>{t.featureTitle} <em>{t.featureAccent}</em></h2><p>{t.featureLead}</p></div><div className="grid">{features.map(({icon:Icon,title,text})=><article key={title}><div className="icon"><Icon/></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section className="courses"><div className="wrap courseinner"><div><div className="eyebrow">{t.coursesNav.toUpperCase()}</div><h2>{lang==="vi"?"Bắt đầu từ nền tảng,":"Start with the basics,"}<br/><em>{lang==="vi"?"tiến xa hơn mỗi ngày.":"go further every day."}</em></h2><p>{lang==="vi"?"Khám phá 5 khóa học được thiết kế theo lộ trình rõ ràng.":"Explore five courses designed around a clear learning path."}</p><Link className="btn" href="/courses">{t.viewCourses} <ArrowRight size={16}/></Link></div><article className="coursecard"><div className="coursehead"><b>{lang==="vi"?"MIỄN PHÍ":"FREE"}</b><span>01 / 05</span></div><div className="letter">A</div><h3>English Starter</h3><p>{lang==="vi"?"Xây dựng nền tảng từ vựng, câu giao tiếp và ngữ pháp cơ bản.":"Build your foundation in vocabulary, everyday phrases, and basic grammar."}</p><div className="meta">🌱 {lang==="vi"?"Cơ bản":"Beginner"} <span>12 {lang==="vi"?"bài học":"lessons"}</span></div><Link href="/courses" className="btn full">{t.viewCourses} <ArrowRight size={16}/></Link></article></div></section>
  <footer className="wrap footer"><Link href="/" className="brand"><b>A</b> AUNORA</Link><small>{t.footer}</small></footer>
 </main>;
}
