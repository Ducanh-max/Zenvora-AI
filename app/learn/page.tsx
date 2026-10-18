"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, BrainCircuit, MessageCircle, LockKeyhole, LogOut } from "lucide-react";

const courses = [
  {id:"starter",slug:"english-starter",title:"English Starter",level:"Beginner",description:"Xây dựng nền tảng tiếng Anh với những mẫu câu giao tiếp đầu tiên.",is_free:true},
  {id:"conversation",title:"Daily Conversation",level:"Beginner",description:"Luyện những tình huống giao tiếp quen thuộc hằng ngày.",is_free:false},
  {id:"grammar",title:"Grammar Boost",level:"Elementary",description:"Nắm chắc ngữ pháp qua ví dụ và bài tập ngắn.",is_free:false},
  {id:"listening",title:"Listening Lab",level:"Elementary",description:"Rèn kỹ năng nghe và nhận biết từ vựng.",is_free:false},
  {id:"speaking",title:"Speaking Confidence",level:"Pre-intermediate",description:"Tự tin diễn đạt suy nghĩ bằng tiếng Anh.",is_free:false},
];
export default function LearnPage() {
  const [profile,setProfile] = useState<{name:string;email:string}|null>(null);
  useEffect(()=>{try{const raw=localStorage.getItem("zenvora_demo_session");if(raw)setProfile(JSON.parse(raw));}catch{}},[]);
  function logout(){localStorage.removeItem("zenvora_demo_session");document.cookie="zenvora_demo_session=; Path=/; Max-Age=0; SameSite=Lax";window.location.href="/login";}
  return <main className="learnpage">
    <header className="learnnav"><Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link><div className="navlogout">{profile?.name || profile?.email || "Tài khoản demo"} <button onClick={logout} title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={16}/></button></div></header>
    <section className="learnwrap"><div className="eyebrow">KHÔNG GIAN HỌC TẬP</div><h1>Chào mừng đến với <em>Zenvora AI.</em></h1><p className="learnlead">Chọn một khóa học để bắt đầu hành trình tiếng Anh của bạn.</p>
      <div className="learnfeatures"><article><BookOpen/><b>Bài học</b><span>Học theo chủ đề</span></article><article><BrainCircuit/><b>Luyện tập</b><span>Quiz tương tác</span></article><article><MessageCircle/><b>AI Tutor</b><span>Trợ lý học tập</span></article></div>
      <h2>Khóa học của bạn</h2><div className="coursegrid">{courses.map((course,i)=><article className="learncourse" key={course.id}><div className="learncoursehead"><span className={course.is_free?"freeflag":"lockflag"}>{course.is_free?"MIỄN PHÍ":<><LockKeyhole size={12}/> SẮP MỞ</>}</span><span>{String(i+1).padStart(2,"0")}</span></div><div className="learnletter">{course.title.slice(0,1).toUpperCase()}</div><h3>{course.title}</h3><p>{course.description}</p><div className="learnmeta"><span>{course.level}</span><span>{course.is_free?"3 bài học":"Sắp ra mắt"}</span></div>{course.is_free?<Link href="/learn/starter" className="coursebutton">Vào học <ArrowRight size={15}/></Link>:<button className="coursebutton disabled" disabled>Chưa mở khóa</button>}</article>)}</div>
      <p className="demo-note">Bạn đang sử dụng chế độ trải nghiệm. Tài khoản và tiến độ demo được lưu trên trình duyệt này.</p>
    </section>
  </main>;
}
