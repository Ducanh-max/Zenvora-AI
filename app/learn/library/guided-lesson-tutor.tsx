"use client";
import {FormEvent,useEffect,useRef,useState} from "react";
import {Send,RotateCcw,Volume2} from "lucide-react";
import Link from "next/link";
type Word={word:string;meaning:string;example:string};
type Message={role:"assistant"|"user";content:string};
function opening(title:string,words:Word[]){
 const t=title.toLowerCase();
 if(/how are you|feeling|emotion/.test(t))return "Hey! How are you feeling today?";
 if(/greet|introduc|chào hỏi/.test(t))return "Hello! Nice to meet you. How are you?";
 if(/food|drink|restaurant|đồ ăn/.test(t))return "Hey! What do you like to eat?";
 if(/travel|airport|hotel|du lịch/.test(t))return "Welcome! Where would you like to go?";
 if(/family|gia đình/.test(t))return "Hi! Would you like to tell me about your family?";
 if(/school|class|trường học/.test(t))return "Hey! What do you enjoy about school?";
 if(/shop|mua sắm/.test(t))return "Hello! Welcome to my shop. What are you looking for?";
 return `Hi! Let's talk about ${title}. ${words[0]?.word?`What do you think about ${words[0].word}?`:"What would you like to talk about first?"}`;
}
function speak(t:string){if(!("speechSynthesis"in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.88;window.speechSynthesis.speak(u);}
export default function GuidedLessonTutor({onComplete,words=[],title="English"}:{onComplete?:()=>void;words?:Word[];title?:string}){
 const first=opening(title,words);
 const [messages,setMessages]=useState<Message[]>([{role:"assistant",content:first}]);
 const [showTranslation,setShowTranslation]=useState(false),[translations,setTranslations]=useState<Record<number,string>>({}),[translating,setTranslating]=useState<number|null>(null);
 const [hintText,setHintText]=useState(""),[hintBusy,setHintBusy]=useState(false);
 const [input,setInput]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[count,setCount]=useState(0),[done,setDone]=useState(false),[help,setHelp]=useState(false);
 const [quotaLocked,setQuotaLocked]=useState(false);
 const [resetAt,setResetAt]=useState("");
 const [clock,setClock]=useState(Date.now());
 useEffect(()=>{const id=window.setInterval(()=>setClock(Date.now()),1000);return()=>window.clearInterval(id)},[]);
 useEffect(()=>{let active=true;async function check(){try{const r=await fetch("/api/tutor/quota",{cache:"no-store"});if(!r.ok)return;const q=await r.json();if(active){setQuotaLocked(Boolean(q.locked));setResetAt(q.resetAt||"");}}catch{}}void check();const id=window.setInterval(()=>void check(),30000);return()=>{active=false;window.clearInterval(id)}},[]);
 const remainingSeconds=Math.max(0,Math.ceil((new Date(resetAt).getTime()-clock)/1000)||0);
 const waitTime=[Math.floor(remainingSeconds/3600),Math.floor(remainingSeconds%3600/60),remainingSeconds%60].map(n=>String(n).padStart(2,"0")).join(":");
 const bottom=useRef<HTMLDivElement>(null);
 const restored=useRef(false);
 useEffect(()=>{if(!restored.current)return;try{localStorage.setItem("aunora_conversation_progress",JSON.stringify({title,count,done,total:5,messages,updatedAt:Date.now()}));window.dispatchEvent(new Event("aunora-progress-updated"));}catch{}},[title,count,done,messages]);
 useEffect(()=>{restored.current=false;try{const raw=localStorage.getItem("aunora_conversation_progress");const saved=raw?JSON.parse(raw):null;if(saved?.title===title&&Array.isArray(saved.messages)){setMessages(saved.messages);setCount(Math.max(0,Math.min(5,Number(saved.count)||0)));setDone(Boolean(saved.done));}else{setMessages([{role:"assistant",content:first}]);setCount(0);setDone(false);}}catch{setMessages([{role:"assistant",content:first}]);setCount(0);setDone(false);}setInput("");setError("");setHelp(false);setHintText("");setTranslations({});setShowTranslation(false);restored.current=true;},[title,first]);
 useEffect(()=>{const chat=bottom.current?.parentElement;if(chat)chat.scrollTo({top:chat.scrollHeight,behavior:"instant"});},[messages,busy]);
 async function translateMessage(index:number,content:string){
  if((translations[index]&&!translations[index].startsWith("⚠️"))||translating!==null)return;
  setTranslating(index);
  try{
   const response=await fetch("/api/speaking/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[content]})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Không dịch được.");
   setTranslations(prev=>({...prev,[index]:String(data.translations?.[0]||"Chưa có bản dịch.")}));
  }catch{setTranslations(prev=>({...prev,[index]:"⚠️ Không thể dịch lúc này. Nhấn để thử lại."}));}
  finally{setTranslating(null);}
 }
 async function getHint(){
  if(hintBusy)return;
  if(help){setHelp(false);return;}
  setHelp(true);
  if(hintText)return;
  setHintBusy(true);
  try{
   const response=await fetch("/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"lesson_hint",lesson:{title,words:words.map(w=>w.word)},messages:[...messages,{role:"user",content:"Please give me a hint for the last question."}]})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Không lấy được gợi ý.");
   setHintText(String(data.reply||""));
  }catch(err){setHintText(err instanceof Error?err.message:"Không lấy được gợi ý.");}
  finally{setHintBusy(false);}
 }
 async function send(e:FormEvent){e.preventDefault();const value=input.trim();if(!value||busy||done||quotaLocked)return;
  const next:Message[]=[...messages,{role:"user",content:value}];setMessages(next);setInput("");setHelp(false);setHintText("");setBusy(true);setError("");
  try{
   const response=await fetch("/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"lesson_conversation",lesson:{title,words:words.map(w=>w.word)},relevantTurns:count,messages:next})});
   const data=await response.json();
   if(response.status===429){setQuotaLocked(true);setDone(true);onComplete?.();return;}
   if(!response.ok)throw new Error(data.error||"Không thể kết nối Aivanta.");
   const onTopic=true;
   const n=Math.min(5,count+(onTopic?1:0));
   const reply=String(data.reply||"Let's keep talking about our lesson!");
   setMessages([...next,{role:"assistant",content:reply}]);
   setCount(n);
   if(onTopic&&n>=5){setDone(true);onComplete?.();}
  }catch(err){setError(err instanceof Error?err.message:"Có lỗi xảy ra.");}
  finally{setBusy(false);}
 }
 function reset(){try{localStorage.removeItem("aunora_conversation_progress")}catch{}setHintText("");setHelp(false);setTranslations({});setShowTranslation(false);setMessages([{role:"assistant",content:first}]);setInput("");setError("");setCount(0);setDone(false);}
 return <section className="guided-tutor" style={{background:"#f0f5ff",border:"1px solid #cdddfb",borderRadius:20,padding:20,marginTop:24}}>
  <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
   <div><h2 style={{margin:0,fontSize:22}}><img src="/brand/wolf-face/aivanta-face.png" alt="" style={{width:32,height:32,objectFit:"contain",verticalAlign:"middle",marginRight:6}}/> Hội thoại cùng Aivanta</h2><p style={{margin:"6px 0",color:"#526c9d"}}>Chủ đề: {title} · Aivanta phản hồi theo câu trả lời của bạn</p></div>
   <button type="button" onClick={reset} style={{border:"1px solid #c8d9f6",background:"white",borderRadius:12,padding:11,cursor:"pointer"}}><RotateCcw size={16}/> Bắt đầu lại</button>
  </header>
  <button type="button" onClick={()=>setShowTranslation(v=>!v)} style={{border:"1px solid #c8d9f6",background:"#fff",borderRadius:10,padding:"9px 12px",cursor:"pointer",marginTop:10}}>🌐 {showTranslation?"Ẩn dịch tiếng Việt":"Hiện dịch tiếng Việt"}</button>

  <div style={{height:8,background:"#dbe6fa",borderRadius:20,margin:"15px 0",overflow:"hidden"}}><div style={{width:Math.min(count/5,1)*100+"%",height:"100%",background:"#23bf6a",transition:"width .3s"}}/></div>
  <div aria-live="polite" style={{height:360,overflowY:"auto",background:"white",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:12}}>
   {messages.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"90%",background:m.role==="user"?"#2169ee":"#eaf1ff",color:m.role==="user"?"white":"#15356d",borderRadius:16,padding:"12px 16px",lineHeight:1.65,whiteSpace:"pre-wrap"}}><strong style={{display:"block",fontSize:12,marginBottom:5}}>{m.role==="user"?"Bạn":<><img src="/brand/wolf-face/aivanta-face.png" alt="" style={{width:22,height:22,objectFit:"contain",verticalAlign:"middle",marginRight:5}}/>Aivanta</>}</strong>{m.content}{m.role==="assistant"&&showTranslation&&<div style={{fontSize:13,marginTop:8,paddingTop:8,borderTop:"1px solid #c8d9f6",color:"#365b91"}}>{translations[i]?.startsWith("⚠️")&&<button type="button" onClick={()=>void translateMessage(i,m.content)} style={{border:0,background:"#fff",borderRadius:7,padding:7,cursor:"pointer"}}>🔄 Thử dịch lại</button>}{translations[i]||<button type="button" disabled={translating===i} onClick={()=>void translateMessage(i,m.content)} style={{border:0,background:"#fff",borderRadius:7,padding:7,cursor:"pointer"}}>{translating===i?"Đang dịch…":"🇻🇳 Dịch câu này"}</button>}</div>}{m.role==="assistant"&&<button type="button" onClick={()=>speak(m.content)} aria-label="Nghe Aivanta" style={{marginLeft:10,border:0,borderRadius:8,padding:5,background:"#d8e7ff",color:"#1956bc",cursor:"pointer"}}><Volume2 size={16}/></button>}</div>)}
   {busy&&<p style={{color:"#5973a6"}}>Aivanta đang trả lời…</p>}<div ref={bottom}/>
  </div>
  <div style={{margin:"12px 0"}}><button type="button" onClick={()=>void getHint()} style={{background:"white",border:"1px solid #d4e2fa",borderRadius:10,padding:10,cursor:"pointer"}}>💡 {help?"Ẩn gợi ý":"Cần gợi ý?"}</button>{help&&<p style={{color:"#254b8f"}}>{hintBusy?"Aivanta đang chuẩn bị gợi ý…":hintText||"Đang tải gợi ý…"}</p>}</div>
  {!done?<form onSubmit={send} style={{display:"flex",gap:9}}><input aria-label="Trả lời Aivanta" value={input} onChange={e=>setInput(e.target.value)} disabled={busy||quotaLocked} placeholder="Trả lời Aivanta bằng tiếng Anh..." style={{flex:1,minWidth:0,border:"1px solid #c8d9f7",borderRadius:13,padding:"13px 15px",fontSize:16}}/><button disabled={busy||quotaLocked||!input.trim()} type="submit" style={{display:"flex",alignItems:"center",gap:7,background:"#1766f3",color:"white",border:0,borderRadius:12,padding:"0 18px",cursor:"pointer"}}><Send size={17}/> Gửi</button></form>:<p role="status" style={{color:"#17834c",fontWeight:800}}>✅ Phần hội thoại đã hoàn thành! {quotaLocked?"Bạn có thể tiếp tục bài học và quay lại luyện AI sau khi hạn mức được làm mới.":"Bạn có thể bắt đầu lại để luyện thêm."}</p>}
  {quotaLocked&&<div role="dialog" aria-modal="true" aria-label="Đã hết lượt AI Tutor" style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(9,27,66,.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}><div style={{maxWidth:480,width:"100%",background:"white",borderRadius:24,padding:32,textAlign:"center",boxShadow:"0 20px 70px #081b4580",color:"#173869"}}><div style={{fontSize:48}}>🐺</div><h2>Hết lượt AI Tutor hôm nay</h2><p>Bạn có thể tiếp tục hội thoại sau:</p><strong style={{fontSize:36,color:"#2368ed",fontVariantNumeric:"tabular-nums"}}>{waitTime}</strong><p>Phần hội thoại vẫn được tính hoàn thành. Bạn có thể quay lại bài học hoặc xem các gói nâng cấp.</p><div style={{display:"flex",flexDirection:"column",gap:10}}><Link href="/learn/plans?from=lesson" style={{padding:14,borderRadius:12,background:"#2368ed",color:"white",fontWeight:800,textDecoration:"none"}}>✨ Nâng cấp gói</Link><button type="button" onClick={()=>{setDone(true);onComplete?.();setQuotaLocked(false);setError("");}} style={{padding:14,borderRadius:12,border:"1px solid #bfd1f3",background:"#eef5ff",color:"#173869",fontWeight:800,cursor:"pointer"}}>← Trở lại bài học</button></div></div></div>}
  {error&&<p role="alert" style={{color:"#b42318"}}>{error}</p>}
 </section>;
}
