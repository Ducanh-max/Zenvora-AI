"use client";
import {FormEvent,useEffect,useRef,useState} from "react";
import {Send,RotateCcw,Volume2} from "lucide-react";
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
 const [input,setInput]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[count,setCount]=useState(0),[done,setDone]=useState(false),[help,setHelp]=useState(false);
 const bottom=useRef<HTMLDivElement>(null);
 useEffect(()=>{setMessages([{role:"assistant",content:first}]);setInput("");setError("");setCount(0);setDone(false);setHelp(false);},[title,first]);
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth",block:"nearest"});},[messages,busy]);
 async function send(e:FormEvent){e.preventDefault();const value=input.trim();if(!value||busy||done)return;
  const next:Message[]=[...messages,{role:"user",content:value}];setMessages(next);setInput("");setBusy(true);setError("");
  try{
   const response=await fetch("/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"lesson_conversation",lesson:{title,words:words.map(w=>w.word)},messages:next})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Không thể kết nối Aivanta.");
   setMessages([...next,{role:"assistant",content:String(data.reply||"Let's keep talking!")}]);
   const n=count+1;setCount(n);if(n>=5){setDone(true);onComplete?.();}
  }catch(err){setError(err instanceof Error?err.message:"Có lỗi xảy ra.");}
  finally{setBusy(false);}
 }
 function reset(){setMessages([{role:"assistant",content:first}]);setInput("");setError("");setCount(0);setDone(false);}
 return <section className="guided-tutor" style={{background:"#f0f5ff",border:"1px solid #cdddfb",borderRadius:20,padding:20,marginTop:24}}>
  <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
   <div><h2 style={{margin:0,fontSize:22}}>🐺 Hội thoại cùng Aivanta</h2><p style={{margin:"6px 0",color:"#526c9d"}}>Chủ đề: {title} · Aivanta phản hồi theo câu trả lời của bạn</p></div>
   <button type="button" onClick={reset} style={{border:"1px solid #c8d9f6",background:"white",borderRadius:12,padding:11,cursor:"pointer"}}><RotateCcw size={16}/> Bắt đầu lại</button>
  </header>
  <div style={{height:8,background:"#dbe6fa",borderRadius:20,margin:"15px 0",overflow:"hidden"}}><div style={{width:Math.min(count/5,1)*100+"%",height:"100%",background:"#23bf6a",transition:"width .3s"}}/></div>
  <div aria-live="polite" style={{height:360,overflowY:"auto",background:"white",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:12}}>
   {messages.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"90%",background:m.role==="user"?"#2169ee":"#eaf1ff",color:m.role==="user"?"white":"#15356d",borderRadius:16,padding:"12px 16px",lineHeight:1.65,whiteSpace:"pre-wrap"}}><strong style={{display:"block",fontSize:12,marginBottom:5}}>{m.role==="user"?"Bạn":"🐺 Aivanta"}</strong>{m.content}{m.role==="assistant"&&<button type="button" onClick={()=>speak(m.content)} aria-label="Nghe Aivanta" style={{marginLeft:10,border:0,borderRadius:8,padding:5,background:"#d8e7ff",color:"#1956bc",cursor:"pointer"}}><Volume2 size={16}/></button>}</div>)}
   {busy&&<p style={{color:"#5973a6"}}>🐺 Aivanta đang trả lời…</p>}<div ref={bottom}/>
  </div>
  <div style={{margin:"12px 0"}}><button type="button" onClick={()=>setHelp(v=>!v)} style={{background:"white",border:"1px solid #d4e2fa",borderRadius:10,padding:10,cursor:"pointer"}}>💡 {help?"Ẩn gợi ý":"Cần gợi ý?"}</button>{help&&<p style={{color:"#254b8f"}}>Hãy trả lời câu hỏi gần nhất bằng tiếng Anh. Bạn có thể trả lời ngắn hoặc hỏi lại Aivanta.</p>}</div>
  {!done?<form onSubmit={send} style={{display:"flex",gap:9}}><input aria-label="Trả lời Aivanta" value={input} onChange={e=>setInput(e.target.value)} disabled={busy} placeholder="Trả lời Aivanta bằng tiếng Anh..." style={{flex:1,minWidth:0,border:"1px solid #c8d9f7",borderRadius:13,padding:"13px 15px",fontSize:16}}/><button disabled={busy||!input.trim()} type="submit" style={{display:"flex",alignItems:"center",gap:7,background:"#1766f3",color:"white",border:0,borderRadius:12,padding:"0 18px",cursor:"pointer"}}><Send size={17}/> Gửi</button></form>:<p role="status" style={{color:"#17834c",fontWeight:800}}>✅ Đã hoàn thành 5 lượt hội thoại! Bạn có thể bắt đầu lại để luyện thêm.</p>}
  {error&&<p role="alert" style={{color:"#b42318"}}>{error}</p>}
 </section>;
}
