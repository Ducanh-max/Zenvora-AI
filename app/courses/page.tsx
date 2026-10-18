"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, LockKeyhole, Languages } from "lucide-react";
type Lang="vi"|"en";
const courseData=[
 {name:"English Starter",vi:"Xây dựng nền tảng từ vựng, câu giao tiếp và ngữ pháp cơ bản.",en:"Build your foundation in vocabulary, everyday phrases, and basic grammar.",levelVi:"Cơ bản",levelEn:"Beginner",lessons:12,free:true},
 {name:"Daily Conversation",vi:"Luyện giao tiếp trong những tình huống quen thuộc hằng ngày.",en:"Practice conversations in familiar everyday situations.",levelVi:"Cơ bản",levelEn:"Beginner",lessons:16},
 {name:"Grammar Boost",vi:"Nắm chắc ngữ pháp qua ví dụ và bài tập tương tác.",en:"Strengthen your grammar through examples and interactive exercises.",levelVi:"Sơ cấp",levelEn:"Elementary",lessons:18},
 {name:"Listening Lab",vi:"Rèn kỹ năng nghe và nhận biết từ vựng qua các chủ đề.",en:"Improve listening skills and vocabulary across different topics.",levelVi:"Sơ cấp",levelEn:"Elementary",lessons:14},
 {name:"Speaking Confidence",vi:"Tự tin diễn đạt suy nghĩ và giao tiếp bằng tiếng Anh.",en:"Build confidence expressing your thoughts in English.",levelVi:"Tiền trung cấp",levelEn:"Pre-intermediate",lessons:20}
];
export default function CoursesPage(){
 const [lang,setLang]=useState<Lang>("vi");
 useEffect(()=>{const saved=localStorage.getItem("aunora_language");if(saved==="en"||saved==="vi")setLang(saved);},[]);
 function changeLang(v:Lang){setLang(v);localStorage.setItem("aunora_language",v);}
 const vi=lang==="vi";
 return <main className="marketing-page catalog-page">
  <nav className="nav wrap"><Link href="/" className="aunora-auth-brand"><span className="aunora-mark"><BookOpen/></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link><div className="navlinks"><Link href="/">{vi?"Trang chủ":"Home"}</Link><Link href="/about">{vi?"Về chúng tôi":"About us"}</Link></div><div className="navactions"><div className="marketing-language"><Languages size={15}/><button className={vi?"active":""} onClick={()=>changeLang("vi")}>VI</button><button className={!vi?"active":""} onClick={()=>changeLang("en")}>EN</button></div><Link href="/learn">{vi?"Không gian học tập":"Learning space"}</Link></div></nav>
  <section className="catalog-wrap"><Link href="/" className="catalog-back"><ArrowLeft size={16}/>{vi?"Trang chủ":"Home"}</Link><div className="eyebrow">{vi?"LỘ TRÌNH HỌC TẬP":"LEARNING PATH"}</div><h1>{vi?"Khám phá các":"Explore your"} <em>{vi?"khóa học AUNORA.":"AUNORA courses."}</em></h1><p className="catalog-lead">{vi?"Chọn khóa học phù hợp và bắt đầu tiến bộ từng ngày. Một khóa học miễn phí đang sẵn sàng cho bạn.":"Choose a course that fits your goals and make progress every day. One free course is ready to start."}</p>
   <div className="catalog-grid">{courseData.map((course,i)=><article className="catalog-card" key={course.name}><div className="catalog-card-top"><span className={course.free?"freeflag":"lockflag"}>{course.free?(vi?"MIỄN PHÍ":"FREE"):<><LockKeyhole size={12}/>{vi?"SẮP MỞ":"COMING SOON"}</>}</span><span>0{i+1} / 05</span></div><div className="catalog-letter">{course.name.slice(0,1)}</div><h2>{course.name}</h2><p>{vi?course.vi:course.en}</p><div className="catalog-meta"><span>{vi?course.levelVi:course.levelEn}</span><span>{course.lessons} {vi?"bài học":"lessons"}</span></div>{course.free?<Link className="coursebutton" href="/learn/starter">{vi?"Bắt đầu học":"Start learning"} <ArrowRight size={15}/></Link>:<button className="coursebutton disabled" disabled>{vi?"Chưa mở khóa":"Coming soon"}</button>}</article>)}</div>
  </section>
  <footer className="wrap footer"><Link href="/" className="brand"><b>A</b> AUNORA</Link><small>© 2026 AUNORA. LEARN • GROW • GLOW</small></footer>
 </main>;
}
