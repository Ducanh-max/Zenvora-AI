"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Crown, Flame, Mic2, PhoneCall, Sparkles, Star, Trophy, Zap, Languages } from "lucide-react";

type Lang = "vi" | "en";
const plans = [
 {id:"starter",name:"Aunora Sprout",tag:"BẮT ĐẦU MIỄN PHÍ",price:0,lessons:500,energy:"40",ai:"10",quiz:15,level:"A1–A2",desc:"Xây nền tảng tiếng Anh vững chắc, học đều đặn mỗi ngày.",features:["500 bài học theo lộ trình","Luyện nói và phát âm","Bài kiểm tra nhỏ: 15 câu/bài","40 năng lượng Sói mỗi ngày","10 lượt hỏi AI Tutor mỗi ngày"],tone:"sprout"},
 {id:"plus",name:"Aunora Explorer",tag:"HỌC TẬP MỞ RỘNG",price:49000,lessons:800,energy:"100",ai:"30",quiz:50,level:"A1–B1",desc:"Mở rộng vốn từ và giao tiếp tự tin trong nhiều tình huống.",features:["800 bài học theo lộ trình","Luyện nói và phát âm","Bài kiểm tra nhỏ: 50 câu/bài","100 năng lượng Sói mỗi ngày","30 lượt hỏi AI Tutor mỗi ngày"],tone:"explorer"},
 {id:"pro",name:"Aunora Achiever",tag:"LỰA CHỌN NỔI BẬT",price:99000,lessons:1400,energy:"Không giới hạn",ai:"60",quiz:50,level:"A1–B2",desc:"Tăng tốc toàn diện với kho bài học lớn và luyện tập chuyên sâu.",features:["1.400 bài học theo lộ trình","Luyện nói và phát âm","Bài kiểm tra nhỏ: 50 câu/bài","Không giới hạn năng lượng Sói","60 lượt hỏi AI Tutor mỗi ngày"],tone:"achiever",popular:true},
 {id:"elite",name:"Aunora Mastery",tag:"TOÀN DIỆN CAO CẤP",price:149000,lessons:2100,energy:"Không giới hạn",ai:"Không giới hạn",quiz:50,level:"A1–C1",desc:"Lộ trình chuyên sâu, luyện thi và thực hành giao tiếp cùng Sói.",features:["2.100 bài học theo lộ trình","Luyện nói và phát âm","Bài kiểm tra nhỏ: 50 câu/bài","Luyện thi IELTS & TOEFL mô phỏng","AI Tutor không giới hạn","Không giới hạn năng lượng Sói","Gọi thoại với mascot Sói để luyện giao tiếp"],tone:"elite"}
];
const words = {vi:{back:"Về trang chủ",eyebrow:"CÁC GÓI HỌC AUNORA",title:"Chọn hành trình",accent:"của bạn.",lead:"Bốn cấp độ thành viên, từ làm quen đến chinh phục tiếng Anh chuyên sâu.",monthly:"/ tháng",free:"Miễn phí",lessons:"BÀI HỌC",energy:"NĂNG LƯỢNG SÓI",ai:"LƯỢT AI TUTOR / NGÀY",quiz:"CÂU HỎI / BÀI",level:"LỘ TRÌNH",choose:"Chọn gói này",current:"Đang dùng",popular:"ĐƯỢC YÊU THÍCH",included:"TÍNH NĂNG BAO GỒM",note:"Các gói thành viên trả phí và thanh toán đang tạm hoãn. Trong thời gian hoàn thiện AUNORA, bạn có thể trải nghiệm nội dung của cả 5 khóa học. Các bài thi IELTS/TOEFL là bài luyện tập mô phỏng, không phải chứng chỉ chính thức.",freeNote:"Bắt đầu miễn phí ngay",selected:"Đã ghi nhớ gói bạn chọn. Tính năng thanh toán sẽ được mở khi cổng thanh toán được tích hợp."},en:{back:"Home",eyebrow:"AUNORA MEMBERSHIPS",title:"Choose your",accent:"learning path.",lead:"Four membership levels, from your first steps to advanced English mastery.",monthly:"/ month",free:"Free",lessons:"LESSONS",energy:"WOLF ENERGY",ai:"AI TUTOR / DAY",quiz:"QUESTIONS / LESSON",level:"LEARNING PATH",choose:"Choose this plan",current:"Current plan",popular:"MOST POPULAR",included:"WHAT'S INCLUDED",note:"Paid memberships and checkout are temporarily paused. While AUNORA is being completed, you can explore all five learning courses. IELTS/TOEFL activities are simulations, not official exams or certificates.",freeNote:"Start for free",selected:"Your selected plan has been saved. Checkout will be available once payment integration is added."}};
export default function CoursesPage(){
 const [lang,setLang]=useState<Lang>("vi"); const [selected,setSelected]=useState(""); const [notice,setNotice]=useState(""); const [busyPlan,setBusyPlan]=useState(""); const [checkoutError,setCheckoutError]=useState("");
 useEffect(()=>{try{const l=localStorage.getItem("aunora_language");if(l==="en"||l==="vi")setLang(l);setSelected(localStorage.getItem("aunora_selected_plan")||"");}catch{}},[]);
 const t=words[lang];
 async function pick(id:string){
  setCheckoutError(""); setNotice("");
  if(id==="starter"){try{localStorage.setItem("aunora_selected_plan",id);}catch{}setSelected(id);window.location.assign("/learn");return;}
  setNotice(lang==="vi"?"Các gói thành viên trả phí đang tạm đóng. Bạn có thể học thử cả 5 khóa học miễn phí trong giai đoạn hoàn thiện AUNORA.":"Paid memberships are temporarily unavailable. You can explore all five courses for free while AUNORA is being completed.");
  return;
  setBusyPlan(id);
  try{
   const response=await fetch("/api/payments/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId:id})});
   const result=await response.json();
   if(response.status===401){window.location.assign("/login?next=%2Fcourses");return;}
   if(!response.ok||!result.checkoutUrl)throw new Error(result.error||"Không thể tạo thanh toán.");
   try{localStorage.setItem("aunora_selected_plan",id);}catch{}
   window.location.assign(result.checkoutUrl);
  }catch(error){setCheckoutError(error instanceof Error?error.message:"Không thể kết nối cổng thanh toán.");}
  finally{setBusyPlan("");}
 }
 return <main className="marketing-page plan-page">
  <nav className="nav wrap"><Link href="/learn" className="aunora-auth-brand"><span className="aunora-mark"><BookOpen/></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link><div className="navactions"><Link href="/learn">{lang==="vi"?"Không gian học tập":"Learning space"}</Link><div className="marketing-language"><Languages size={15}/><button className={lang==="vi"?"active":""} onClick={()=>{setLang("vi");localStorage.setItem("aunora_language","vi");}}>VI</button><button className={lang==="en"?"active":""} onClick={()=>{setLang("en");localStorage.setItem("aunora_language","en");}}>EN</button></div></div></nav>
  <section className="plan-wrap"><Link href="/learn" className="catalog-back"><ArrowLeft size={16}/>{t.back}</Link><div className="eyebrow"><Sparkles size={14}/>{t.eyebrow}</div><h1>{t.title} <em>{t.accent}</em></h1><p className="plan-lead">{t.lead}</p>
   <div className="plan-grid">{plans.map((p,i)=><article className={"plan-card "+p.tone+(p.popular?" plan-popular":"")} key={p.id}>
    {p.popular&&<div className="plan-ribbon"><Star size={12}/>{t.popular}</div>}<div className="plan-card-top"><span>{p.tag}</span><span>{String(i+1).padStart(2,"0")}</span></div>
    <div className="plan-icon">{i===0?<BookOpen/>:i===1?<Zap/>:i===2?<Trophy/>:<Crown/>}</div><h2>{p.name}</h2><p className="plan-desc">{lang==="vi"?p.desc:["Build a strong English foundation and learn consistently every day.","Expand your vocabulary and communicate confidently in more situations.","Accelerate your progress with a large library and focused practice.","A comprehensive path with exam preparation and wolf speaking practice."][i]}</p>
    <div className="plan-price">{p.price===0?<><strong>{t.free}</strong></>:<><strong>{p.price.toLocaleString("vi-VN")}<small>đ</small></strong><span>{t.monthly}</span></>}</div>
    <div className="plan-stats"><div><BookOpen/><b>{p.lessons.toLocaleString("vi-VN")}</b><small>{t.lessons}</small></div><div><Flame/><b>{p.energy}</b><small>{t.energy}</small></div><div><Sparkles/><b>{p.ai}</b><small>{t.ai}</small></div></div>
    <div className="plan-included">{t.included}</div><ul>{p.features.map(f=><li key={f}><Check size={15}/><span>{lang==="vi"?f:(f==="Luyện nói và phát âm"?"Speaking and pronunciation":f.replace(" bài học theo lộ trình"," structured lessons").replace("Bài kiểm tra nhỏ: ","Mini test: ").replace(" câu/bài"," questions/lesson").replace(" năng lượng Sói mỗi ngày"," Wolf Energy per day").replace(" lượt hỏi AI Tutor mỗi ngày"," AI Tutor prompts per day").replace("Không giới hạn năng lượng Sói","Unlimited Wolf Energy").replace("AI Tutor không giới hạn","Unlimited AI Tutor").replace("Luyện thi IELTS & TOEFL mô phỏng","IELTS & TOEFL practice tests").replace("Gọi thoại với mascot Sói để luyện giao tiếp","Voice calls with the Wolf mascot"))}</span></li>)}</ul>
    <div className="plan-level">{t.level}<b>{p.level}</b></div><button className={"plan-cta "+(selected===p.id?"is-selected":"")} onClick={()=>pick(p.id)} disabled={busyPlan!==""} aria-busy={busyPlan===p.id}>{busyPlan===p.id?"Đang tạo thanh toán...":selected===p.id&&p.price===0?<><Check size={16}/>{t.current}</>:<>{p.price===0?(lang==="vi"?"Bắt đầu miễn phí":"Start for free"):(lang==="vi"?"Thanh toán gói này":"Pay for this plan")}<ArrowRight size={16}/></>}</button>
   </article>)}</div>
   {checkoutError&&<div className="payment-inline-error" role="alert">{checkoutError}</div>}{notice&&<div className="plan-notice" role="status">{notice}</div>}<p className="plan-footnote">{t.note}</p>
  </section><footer className="wrap footer"><span><b>AUNORA</b> · LEARN • GROW • GLOW</span><small>© 2026 AUNORA</small></footer>
 </main>;
}
