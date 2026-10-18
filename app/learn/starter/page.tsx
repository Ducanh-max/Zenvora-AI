"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Languages } from "lucide-react";

type Lang = "vi" | "en";
const questions = [
 {q:"What does “confident” mean?",opts:["Tự tin","Lo lắng","Mệt mỏi"],optsEn:["Confident","Worried","Tired"],answer:0,why:"Confident có nghĩa là tự tin, tin tưởng vào bản thân.",whyEn:"Confident means feeling sure of yourself."},
 {q:"Choose the correct sentence.",opts:["She go to school.","She goes to school.","She going school."],optsEn:["She go to school.","She goes to school.","She going school."],answer:1,why:"Với chủ ngữ She ở hiện tại đơn, động từ go thêm -es.",whyEn:"With 'she' in the present simple, add -es to the verb: goes."},
 {q:"“Good morning” is used...",opts:["Khi tạm biệt","Buổi sáng để chào hỏi","Khi xin lỗi"],optsEn:["When saying goodbye","As a morning greeting","When apologizing"],answer:1,why:"Good morning là lời chào thường dùng vào buổi sáng.",whyEn:"Good morning is a greeting commonly used in the morning."}
];
export default function StarterLesson() {
 const [index,setIndex]=useState(0); const [choice,setChoice]=useState<number|null>(null);
 const [score,setScore]=useState(0); const [resultScore,setResultScore]=useState(0);
 const [done,setDone]=useState(false); const [lang,setLang]=useState<Lang>("vi");
 useEffect(()=>{const saved=localStorage.getItem("aunora_language");if(saved==="en"||saved==="vi")setLang(saved);},[]);
 function changeLang(value:Lang){setLang(value);localStorage.setItem("aunora_language",value);}
 function next(){
  if(choice===null)return; const nextScore=score+(choice===questions[index].answer?1:0);setScore(nextScore);
  if(index===questions.length-1){setResultScore(nextScore);setDone(true);localStorage.setItem("zenvora_demo_last_score",JSON.stringify({score:nextScore,total:questions.length,completedAt:new Date().toISOString()}));}
  else{setIndex(i=>i+1);setChoice(null);}
 }
 const q=questions[index]; const opts=lang==="en"?q.optsEn:q.opts;
 return <main className="quizpage aunora-quiz">
  <div className="quiztop"><Link href="/learn"><ArrowLeft size={17}/> {lang==="vi"?"Khóa học":"Courses"}</Link><span>{lang==="vi"?"Bài 01 · English Starter":"Lesson 01 · English Starter"}</span><div className="language-switch quiz-language"><Languages size={15}/><button className={lang==="vi"?"selected":""} onClick={()=>changeLang("vi")}>VI</button><span>/</span><button className={lang==="en"?"selected":""} onClick={()=>changeLang("en")}>EN</button></div></div>
  {done?<section className="quizcard result"><div className="eyebrow">{lang==="vi"?"HOÀN THÀNH BÀI HỌC":"LESSON COMPLETED"}</div><h1>{lang==="vi"?"Bạn đã hoàn thành! 🎉":"You did it! 🎉"}</h1><p>{lang==="vi"?"Kết quả:":"Your score:"} <b>{resultScore}/{questions.length}</b> {lang==="vi"?"câu trả lời đúng.":"correct answers."}</p><p className="save-result">{lang==="vi"?"Kết quả demo đã lưu trên trình duyệt này.":"Your demo result has been saved in this browser."}</p><Link href="/learn" className="btn">{lang==="vi"?"Quay lại khóa học":"Back to courses"}</Link></section>
  :<section className="quizcard"><div className="eyebrow">{lang==="vi"?"LUYỆN TẬP TƯƠNG TÁC":"INTERACTIVE PRACTICE"}</div><div className="quizprogress"><i style={{width:((index+1)/questions.length*100)+"%"}}/></div><small>{lang==="vi"?"CÂU HỎI":"QUESTION"} {index+1}/{questions.length}</small><h1>{q.q}</h1><div className="options">{opts.map((option,i)=><button key={option} onClick={()=>setChoice(i)} className={choice===i?"selected":""}>{String.fromCharCode(65+i)}. {option}</button>)}</div>{choice!==null&&<div className={choice===q.answer?"feedback good":"feedback bad"}>{choice===q.answer?<CheckCircle2/>:<XCircle/>}{lang==="vi"?q.why:q.whyEn}</div>}<button className="btn nextbtn" disabled={choice===null} onClick={next}>{lang==="vi"?(index===questions.length-1?"Xem kết quả":"Câu tiếp theo"):(index===questions.length-1?"See results":"Next question")}</button></section>}
 </main>;
}
