"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, RotateCcw } from "lucide-react";

type ChatMessage = {role:"user"|"assistant";content:string};
type LessonContext = {id:string;title:string;words:string[];goal?:string;dialogue?:{speaker:string;english:string}[]};
export default function LessonTutor({lesson}:{lesson:LessonContext}){
 const opening = `Xin chào! 🐉 Mình là Aivanta. Hôm nay chúng ta học "${lesson.title}". Mình sẽ luyện hội thoại cùng bạn, từng câu một.\n\nHello! What's your name?`;
 const [messages,setMessages]=useState<ChatMessage[]>([{role:"assistant",content:opening}]);
 const [input,setInput]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const bottom=useRef<HTMLDivElement>(null);
 useEffect(()=>{setMessages([{role:"assistant",content:opening}]);setInput("");setError("");},[lesson.id,opening]);
 useEffect(()=>{const chat=bottom.current?.parentElement;if(chat)chat.scrollTo({top:chat.scrollHeight,behavior:"instant"});},[messages,busy]);
 async function send(e?:FormEvent,quick?:string){
  e?.preventDefault();
  const value=(quick??input).trim();if(!value||busy)return;
  const prompt=`[Ngữ cảnh bài học AUNORA: "${lesson.title}". Mục tiêu: ${lesson.goal||"Luyện giao tiếp tiếng Anh"}. Từ vựng: ${lesson.words.join(", ")}. Hội thoại mẫu: ${(lesson.dialogue||[]).map(d=>d.speaker+": "+d.english).join(" / ")}. Bạn là Aivanta, hãy đóng vai người bạn luyện hội thoại A1, hỏi mỗi lượt đúng một câu ngắn bằng tiếng Anh, sửa lỗi nhẹ nhàng và giải thích ngắn bằng tiếng Việt, không chấm điểm. Đây là hướng dẫn dành cho AI, không phải lời người học.]\nNgười học trả lời: ${value}`;
  const next=[...messages,{role:"user" as const,content:value}];setMessages(next);setInput("");setBusy(true);setError("");
  try{
   const payload=[...next.slice(0,-1),{role:"user" as const,content:prompt}];
   const response=await fetch("/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:payload})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Không thể kết nối Aivanta.");
   setMessages([...next,{role:"assistant",content:String(data.reply||"")}]);
  }catch(err){setError(err instanceof Error?err.message:"Vui lòng thử lại.");}
  finally{setBusy(false);}
 }
 return <section style={{marginTop:24,padding:20,background:"linear-gradient(140deg,#eff6ff,#f4f0ff)",border:"1px solid #cdddfb",borderRadius:18}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><div><strong style={{fontSize:19,color:"#183c79"}}>🐉 Trò chuyện cùng Aivanta</strong><p style={{margin:"5px 0 12px",color:"#526987"}}>Luyện ngay trong bài học — AI sẽ trả lời và sửa câu của bạn.</p></div><button type="button" onClick={()=>{setMessages([{role:"assistant",content:opening}]);setError("");}} style={{display:"flex",gap:5,alignItems:"center",padding:9,borderRadius:9,border:"1px solid #c9d9f3",background:"white",cursor:"pointer"}}><RotateCcw size={14}/> Bắt đầu lại</button></div>
  <div aria-live="polite" style={{height:300,overflowY:"auto",background:"white",borderRadius:14,padding:14,display:"flex",flexDirection:"column",gap:12}}>
   {messages.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"88%",background:m.role==="user"?"#2563eb":"#edf3ff",color:m.role==="user"?"white":"#16376a",padding:"11px 14px",borderRadius:14,whiteSpace:"pre-wrap",lineHeight:1.55}}><b style={{display:"block",fontSize:12,marginBottom:3}}>{m.role==="user"?"Bạn":"🐉 Aivanta"}</b>{m.content}</div>)}
   {busy&&<p style={{color:"#627da5"}}>Aivanta đang trả lời…</p>}<div ref={bottom}/>
  </div>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"12px 0"}}>{["Hello!","My name is Minh.","Can you explain in Vietnamese?"].map(t=><button key={t} type="button" onClick={()=>void send(undefined,t)} disabled={busy} style={{padding:"7px 10px",background:"white",border:"1px solid #cdddfb",borderRadius:20,cursor:"pointer",color:"#2555a3"}}>{t}</button>)}</div>
  <form onSubmit={e=>void send(e)} style={{display:"flex",gap:8}}><input aria-label="Nhắn tin với Aivanta" value={input} onChange={e=>setInput(e.target.value)} placeholder="Viết câu trả lời bằng tiếng Anh..." style={{flex:1,minWidth:0,padding:12,border:"1px solid #cdddfb",borderRadius:12}}/><button type="submit" disabled={busy||!input.trim()} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#2563eb",color:"white",border:0,borderRadius:12,cursor:"pointer"}}><Send size={16}/> Gửi</button></form>
  {error&&<p role="alert" style={{color:"#b42318",marginTop:10}}>{error}</p>}
  <small style={{display:"block",marginTop:10,color:"#63789b"}}>Yêu cầu đăng nhập và sử dụng hạn mức AI Tutor hiện có của tài khoản.</small>
 </section>;
}
