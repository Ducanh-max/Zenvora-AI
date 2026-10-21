"use client";
import {FormEvent,useEffect,useRef,useState} from "react";
import {Send,RotateCcw,Volume2} from "lucide-react";
type Turn={question:string;translation:string;hint:string;why:string;evaluate:(s:string)=>{ok:boolean;reason:string}};
const clean=(s:string)=>s.toLowerCase().replace(/[.,!?;:'"“”]/g," ").replace(/\s+/g," ").trim();
const defaultQuestions:Turn[]=[
 {question:"Hello! What's your name?",translation:"Xin chào! Bạn tên là gì?",hint:"Bạn có thể trả lời: My name is [tên của bạn].",why:"Vì “What's your name?” hỏi tên, nên “My name is ...” trả lời trực tiếp câu hỏi. “My” nghĩa là “của tôi”, “name” là “tên”, “is” là “là”.",evaluate:(s)=>{const t=clean(s);const match=t.match(/^(?:my name is|i am|i m|im)\s+([a-z][a-z -]{0,35})$/i);return match?{ok:true,reason:"Đúng rồi! “My name is ...” và “I'm ...” đều là cách giới thiệu tên tự nhiên bằng tiếng Anh."}:{ok:false,reason:"Câu hỏi “What's your name?” hỏi tên của bạn. Hãy trả lời thành câu hoàn chỉnh như “My name is Minh.” hoặc “I'm Lan.”"};}},
 {question:"Nice to meet you! How are you today?",translation:"Rất vui được gặp bạn! Hôm nay bạn thế nào?",hint:"Bạn có thể trả lời: I'm fine, thank you.",why:"Vì “How are you?” hỏi tình trạng hoặc cảm xúc hiện tại. “I'm fine” nghĩa là “Mình khỏe/ổn”; “thank you” thể hiện sự lịch sự.",evaluate:(s)=>{const t=clean(s);const ok=/^(?:i am|i m|im|i feel)\s+(?:fine|good|great|happy|okay|ok|well|tired|sad|excited|not bad|very good|very well|pretty good)(?:\s+(?:thank you|thanks|today))?$/.test(t)||/^(?:fine|good|great|okay|ok|not bad)(?:\s+(?:thank you|thanks))?$/.test(t);return ok?{ok:true,reason:"Chính xác! Khi được hỏi “How are you?”, bạn có thể nói “I'm fine”, “I'm good” hoặc diễn tả cảm xúc của mình."}:{ok:false,reason:"“How are you?” hỏi bạn đang cảm thấy thế nào, không phải tên hay tuổi. Hãy thử “I'm fine, thank you.” hoặc “I'm happy.”"};}},
 {question:"Where are you from?",translation:"Bạn đến từ đâu?",hint:"Bạn có thể trả lời: I'm from Vietnam. (hoặc thay Vietnam bằng nơi bạn sống)",why:"Vì “Where” hỏi địa điểm, “are you from” hỏi nơi xuất thân. Cấu trúc “I'm from + địa điểm” diễn tả nơi bạn đến từ.",evaluate:(s)=>{const t=clean(s);const ok=/^(?:i am|i m|im)\s+from\s+[a-z][a-z -]+$/.test(t)||/^i (?:come|am coming) from\s+[a-z][a-z -]+$/.test(t);return {ok,reason:ok?"Tốt lắm! Cấu trúc “I'm from + địa điểm” dùng để nói bạn đến từ đâu.":"“Where are you from?” hỏi quê quán hoặc nơi bạn đến từ. Hãy dùng “I'm from + tên địa điểm”, ví dụ “I'm from Vietnam.”"};}},
 {question:"Do you like learning English?",translation:"Bạn có thích học tiếng Anh không?",hint:"Bạn có thể trả lời: Yes, I do. (hoặc No, I don't.)",why:"Vì câu hỏi bắt đầu bằng “Do you ...?”, câu trả lời ngắn thường dùng “Yes, I do” hoặc “No, I don't”. Bạn có thể trả lời theo sở thích thật của mình.",evaluate:(s)=>{const t=clean(s);const ok=/^(yes|yeah|yep)( i do| i like (learning )?english| i love (learning )?english)?$/.test(t)||/^(no|nope)( i do not| i don t| i dislike (learning )?english)?$/.test(t)||/^i (?:like|love|enjoy|do not like|don t like) (?:learning )?english$/.test(t);return {ok,reason:ok?"Giỏi lắm! Với câu hỏi bắt đầu bằng “Do you...?”, bạn có thể trả lời ngắn “Yes, I do” hoặc “No, I don't”.":"Đây là câu hỏi Yes/No. Bạn có thể trả lời “Yes, I do.”, “No, I don't.” hoặc “I like English.”"};}},
 {question:"It was great talking to you! How do you say goodbye?",translation:"Nói chuyện với bạn thật vui! Bạn nói lời tạm biệt như thế nào?",hint:"Bạn có thể trả lời: Goodbye!",why:"Vì Aivanta đang kết thúc cuộc trò chuyện và hỏi cách nói tạm biệt. “Goodbye” nghĩa là “Tạm biệt”; “See you later” nghĩa là “Hẹn gặp lại”.",evaluate:(s)=>{const t=clean(s);const ok=/^(?:goodbye|bye|bye bye|see you|see you later|see you soon|take care)(?: aivanta)?$/.test(t);return {ok,reason:ok?"Tuyệt vời! “Goodbye”, “Bye” và “See you later” đều là cách chào tạm biệt phù hợp.":"Khi kết thúc hội thoại, hãy nói “Goodbye!”, “Bye!” hoặc “See you later!”."};}}
];
function buildLessonQuestions(words:{word:string;meaning:string;example:string}[],title:string):Turn[]{
 const usable=words.filter(w=>w.word?.trim()&&w.meaning?.trim()).slice(0,5);
 return usable.map((w,i)=>({
  question:i===0?`Hello! Let's practice ${title}. How do you say "${w.meaning}" in English?`:`Great! How do you say "${w.meaning}" in English?`,
  translation:`Chúng mình cùng luyện bài ${title}. Bạn nói “${w.meaning}” bằng tiếng Anh như thế nào?`,
  hint:`Bạn có thể trả lời: ${w.word}.`,
  why:`Vì “${w.word}” có nghĩa là “${w.meaning}” trong chủ đề này. ${w.example?"Ví dụ: "+w.example:"Hãy nghe và nhắc lại từ mới."}`,
  evaluate:(input:string)=>{
   const answer=clean(w.word),text=clean(input);
   const ok=text===answer||text===clean(w.example||"")||text===clean("It is "+w.word)||text===clean("The answer is "+w.word);
   return {ok,reason:ok?`Đúng rồi! “${w.word}” nghĩa là “${w.meaning}”. ${w.example?"Ví dụ: "+w.example:""}`:`“${w.meaning}” tương ứng với “${w.word}”. Hãy thử nhập “${w.word}” hoặc nói theo ví dụ: ${w.example||w.word}.`};
  }
 }));
}
type Message={role:"assistant"|"user";text:string;kind?:"question"|"correct"|"incorrect"|"done"};
function speak(t:string){if(typeof window==="undefined"||!("speechSynthesis"in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.88;window.speechSynthesis.speak(u);}
export default function GuidedLessonTutor({onComplete,words,title}:{onComplete?:()=>void;words?:{word:string;meaning:string;example:string}[];title?:string}){
 const questions=words?.length?buildLessonQuestions(words,title||"English"):defaultQuestions;
 const [index,setIndex]=useState(0),[input,setInput]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 const [messages,setMessages]=useState<Message[]>([{role:"assistant",text:questions[0]?.question||"Hello!",kind:"question"}]);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),bottom=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth",block:"nearest"});},[messages]);
 function reset(){if(timer.current)clearTimeout(timer.current);setIndex(0);setInput("");setBusy(false);setDone(false);setMessages([{role:"assistant",text:questions[0]?.question||"Hello!",kind:"question"}]);}
 function send(e:FormEvent){e.preventDefault();const value=input.trim();if(!value||busy||done)return;
 const result=questions[index].evaluate(value);setInput("");
 setMessages(prev=>[...prev,{role:"user",text:value},{role:"assistant",text:(result.ok?"🎉 Làm tốt lắm! ":"💡 Thử lại nhé! ")+result.reason,kind:result.ok?"correct":"incorrect"}]);
 if(!result.ok)return;
 setBusy(true);
 timer.current=setTimeout(()=>{if(index+1<questions.length){setMessages(prev=>[...prev,{role:"assistant",text:questions[index+1].question,kind:"question"}]);setIndex(index+1);}else{setDone(true);setMessages(prev=>[...prev,{role:"assistant",text:"🎓 Xuất sắc! Bạn đã hoàn thành hội thoại cùng Aivanta. Mình rất vui vì được luyện tập với bạn!",kind:"done"}]);onComplete?.();}setBusy(false);},1900);
 }
 return <section className="guided-tutor" style={{background:"#f0f5ff",border:"1px solid #cdddfb",borderRadius:20,padding:20,marginTop:24}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><div><h2 style={{margin:"0 0 5px",fontSize:22}}>🐺 Hội thoại cùng Aivanta</h2><p style={{margin:0,color:"#526c9d"}}>Trả lời từng câu · Aivanta nhận xét và tự chuyển câu khi bạn trả lời đúng.</p></div><button type="button" onClick={reset} style={{border:"1px solid #c8d9f6",background:"white",borderRadius:12,padding:11,cursor:"pointer",display:"flex",gap:7,alignItems:"center"}}><RotateCcw size={16}/> Bắt đầu lại</button></div>
 <div style={{margin:"15px 0",height:8,borderRadius:20,background:"#dbe6fa",overflow:"hidden"}}><div style={{width:((done?questions.length:index)/questions.length*100)+"%",height:"100%",background:"#23bf6a",transition:"width .3s"}}/></div>
 <div aria-live="polite" style={{height:360,overflowY:"auto",background:"white",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:12}}>
 {messages.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"90%",background:m.role==="user"?"#2169ee":m.kind==="correct"?"#e2f9eb":m.kind==="incorrect"?"#fff2e5":"#eaf1ff",color:m.role==="user"?"white":"#15356d",borderRadius:16,padding:"12px 16px",lineHeight:1.65,whiteSpace:"pre-wrap"}}><strong style={{display:"block",fontSize:12,marginBottom:5}}>{m.role==="user"?"Bạn":"🐺 Aivanta"}</strong>{m.text}{m.kind==="question"&&<button type="button" onClick={()=>speak(m.text)} aria-label="Nghe câu hỏi" style={{display:"inline-flex",verticalAlign:"middle",marginLeft:10,border:0,background:"#d8e7ff",color:"#1956bc",borderRadius:9,padding:6,cursor:"pointer"}}><Volume2 size={17}/></button>}</div>)}
 {busy&&<p style={{color:"#5973a6",fontWeight:700}}>🐺 Aivanta đang chuyển sang câu tiếp theo...</p>}<div ref={bottom}/>
 </div>
 {!done?<><div style={{background:"#fff",border:"1px solid #d4e2fa",borderRadius:14,padding:"13px 16px",margin:"12px 0",color:"#254b8f",lineHeight:1.6}}>
 <p style={{margin:"0 0 8px"}}><strong>🇻🇳 Dịch câu Aivanta hỏi:</strong> {questions[index].translation}</p>
 <p style={{margin:"0 0 8px"}}><strong>💡 Gợi ý trả lời:</strong> {questions[index].hint}</p>
 <p style={{margin:0}}><strong>📘 Vì sao có thể trả lời như vậy?</strong> {questions[index].why}</p>
 </div><form onSubmit={send} style={{display:"flex",gap:9}}><input aria-label="Trả lời Aivanta" value={input} onChange={e=>setInput(e.target.value)} disabled={busy} placeholder="Nhập câu trả lời tiếng Anh..." style={{flex:1,minWidth:0,border:"1px solid #c8d9f7",borderRadius:13,padding:"13px 15px",fontSize:16}}/><button disabled={busy||!input.trim()} type="submit" style={{display:"flex",gap:7,alignItems:"center",background:"#1766f3",color:"white",border:0,borderRadius:12,padding:"0 18px",cursor:"pointer",opacity:busy?.5:1}}><Send size={17}/> Gửi</button></form></>:<p role="status" style={{fontWeight:800,color:"#17834c"}}>✅ Hoàn thành {questions.length}/{questions.length} câu hội thoại!</p>}
 </section>;
}
