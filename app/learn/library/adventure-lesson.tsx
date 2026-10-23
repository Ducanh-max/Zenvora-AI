"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Lightbulb,Volume2,Mic,CheckCircle2,RotateCcw} from "lucide-react";
import GuidedLessonTutor from "./guided-lesson-tutor";
import MatchPairs from "./match-pairs";
type Word={word:string;meaning:string;example:string;pronunciation?:string};
type Dialogue={speaker:string;english:string;vietnamese?:string};
type Activity={type:"intro"|"choice"|"listen"|"fill"|"order"|"match"|"speak"|"chat"|"read";word?:Word;question:string;answer:string;options?:string[];sentence?:string};
const wolf="/brand/aivanta-mascot.webp.png";
function say(t:string){if(typeof window!=="undefined"&&"speechSynthesis"in window){window.speechSynthesis.cancel();const s=new SpeechSynthesisUtterance(t);s.lang="en-US";s.rate=.85;window.speechSynthesis.speak(s);}}
function playSuccessSound(){
 if(typeof window==="undefined")return;
 try{
  const AudioContextClass=window.AudioContext;
  if(!AudioContextClass)return;
  const ctx=new AudioContextClass();
  if(ctx.state==="suspended")void ctx.resume();
  const notes=[659.25,783.99,1046.5];
  notes.forEach((frequency,index)=>{
   const oscillator=ctx.createOscillator();
   const gain=ctx.createGain();
   const start=ctx.currentTime+index*0.11;
   oscillator.type="sine";
   oscillator.frequency.setValueAtTime(frequency,start);
   gain.gain.setValueAtTime(0.0001,start);
   gain.gain.exponentialRampToValueAtTime(0.13,start+0.015);
   gain.gain.exponentialRampToValueAtTime(0.0001,start+0.24);
   oscillator.connect(gain);
   gain.connect(ctx.destination);
   oscillator.start(start);
   oscillator.stop(start+0.25);
  });
  window.setTimeout(()=>{void ctx.close().catch(()=>{});},1100);
 }catch{/* Audio is optional when the browser blocks playback. */}
}
function norm(t:string){return t.toLowerCase().replace(/[.,!?]/g,"").replace(/\s+/g," ").trim();}
export default function AdventureLesson({lesson,onExit,onFinish}:{lesson:{id:string;title:string;words:Word[];dialogue?:Dialogue[];goal?:string};onExit:()=>void;onFinish:(correct:number,total:number)=>Promise<void>}){
 const activities=useMemo<Activity[]>(()=>{
  const words=lesson.words.filter(w=>w.word&&w.meaning).slice(0,5);if(!words.length)return[];
  const a:Activity[]=[];
  words.forEach(w=>a.push({type:"intro",word:w,question:"Làm quen với từ mới",answer:w.word}));
  words.slice(0,3).forEach((w,i)=>{
   // Only one valid meaning per question; avoid duplicate meanings in the lesson.
   const key=(value:string)=>norm(value.normalize("NFC"));
   const seen=new Set([key(w.meaning)]);
   const distractors=words.filter(x=>x.word!==w.word).map(x=>x.meaning).filter(meaning=>{
    const k=key(meaning);if(!k||seen.has(k))return false;seen.add(k);return true;
   }).slice(0,3);
   const choices=[w.meaning,...distractors];
   const shift=(i+1)%choices.length;
   a.push({type:"choice",word:w,question:"Chọn nghĩa đúng của từ sau",answer:w.meaning,options:[...choices.slice(shift),...choices.slice(0,shift)]});
  });
  const w0=words[0];a.push({type:"listen",word:w0,question:"Nghe và chọn từ bạn nghe được",answer:w0.word,options:words.slice(0,4).map(x=>x.word).reverse()});
  const w1=words[1]||w0;a.push({type:"fill",word:w1,question:"Điền từ tiếng Anh tương ứng với nghĩa",answer:w1.word});
  const w2=words[2]||w0;const phrase=(w2.example||"I like English.").replace(/[.!?]+$/,"");a.push({type:"order",word:w2,question:"Sắp xếp các từ thành câu đúng",answer:phrase});
  a.push({type:"match",question:"Nối cặp từ tiếng Anh và nghĩa tiếng Việt",answer:"",options:words.slice(0,4).flatMap(w=>[w.word,w.meaning])});
  // Keep vocabulary pronunciation practice in lessons; conversational Speaking stays in the separate studio.
  words.slice(0,Math.min(3,words.length)).forEach(w=>a.push({type:"speak",word:w,question:"Luyện phát âm từ vựng",answer:w.word}));
  a.push({type:"chat",question:"Trò chuyện thực tế với Aivanta",answer:""});
  // Hội thoại với Aivanta là hoạt động cuối cùng; không lặp lại câu hỏi đã làm.
  return a;
 },[lesson]);
 const [reviewQueue,setReviewQueue]=useState<number[]>([]),[reviewIndex,setReviewIndex]=useState(0),[reviewMode,setReviewMode]=useState(false),[speechSkipped,setSpeechSkipped]=useState(false);const [matchComplete,setMatchComplete]=useState(false),[matchCorrect,setMatchCorrect]=useState(false);const [chatCompleted,setChatCompleted]=useState(false);const [step,setStep]=useState(0),[selected,setSelected]=useState(""),[checked,setChecked]=useState(false),[hint,setHint]=useState(false),[matched,setMatched]=useState<string[]>([]),[first,setFirst]=useState(""),[tokens,setTokens]=useState<string[]>([]),[recognized,setRecognized]=useState(""),[listening,setListening]=useState(false),[right,setRight]=useState(0),[saving,setSaving]=useState(false),[error,setError]=useState("");
 useEffect(()=>{setStep(0);setSelected("");setChecked(false);setHint(false);setMatched([]);setFirst("");setMatchComplete(false);setMatchCorrect(false);setTokens([]);setRecognized("");setRight(0);setReviewQueue([]);setReviewIndex(0);setReviewMode(false);setSpeechSkipped(false);setChatCompleted(false);setMatchComplete(false);setMatchCorrect(false);},[lesson.id]);
 const activityIndex=reviewMode?reviewQueue[reviewIndex]:step;
 const activity=activities[activityIndex];const finished=reviewMode?reviewIndex>=reviewQueue.length:step>=activities.length&&reviewQueue.length===0;
 const reviewPrompt=step>=activities.length&&!reviewMode&&reviewQueue.length>0;
 const orderWords=(activity?.answer||"").split(" ").filter(Boolean);
 const options=activity?.type==="order"?orderWords.map((w,i)=>({id:i,word:w})).sort((a,b)=>((a.id*7+3)%Math.max(orderWords.length,1))-((b.id*7+3)%Math.max(orderWords.length,1))):[];
 const correct=activity?.type==="speak"&&speechSkipped?false:activity?.type==="order"?norm(tokens.join(" "))===norm(activity.answer):activity?.type==="speak"?norm(recognized)===norm(activity.answer):activity?.type==="match"?matchCorrect:norm(selected)===norm(activity?.answer||"");
 const easy=activity?.type==="intro"||activity?.type==="chat";
 const canCheck=activity?.type==="chat"?chatCompleted:easy||activity?.type==="match"?activity?.type==="match"?matchComplete:true:activity?.type==="order"?tokens.length===orderWords.length:activity?.type==="speak"?!!recognized||speechSkipped:!!selected;
 function resetAnswer(){setSelected("");setChecked(false);setHint(false);setMatched([]);setFirst("");setMatchComplete(false);setMatchCorrect(false);setTokens([]);setRecognized("");setSpeechSkipped(false);setError("");}
 function advance(){resetAnswer();if(reviewMode){setReviewIndex(n=>n+1);}else{setStep(n=>n+1);}}
 function next(){
  if(!activity)return;
  if(activity.type==="intro"){advance();return;}
  if(activity.type==="chat"){if(!chatCompleted)return;setRight(n=>n+1);setChatCompleted(false);advance();return;}
  if(activity.type==="match"&&checked&&!matchCorrect){setChecked(false);return;}
  if(!checked){
   if(!canCheck)return;
   setChecked(true);
   if(correct){setRight(n=>n+1);playSuccessSound();}
   else if(activity.type!=="match"&&!reviewMode){setReviewQueue(prev=>prev.includes(activityIndex)?prev:[...prev,activityIndex]);}
   return;
  }
  advance();
 }
 function skipSpeaking(){if(activity?.type!=="speak"||checked)return;setSpeechSkipped(true);setChecked(true);if(!reviewMode)setReviewQueue(prev=>prev.includes(activityIndex)?prev:[...prev,activityIndex]);}
 // Capture Enter before a focused answer button consumes it as a click.
 const nextRef=useRef<()=>void>(()=>{});
 nextRef.current=next;
 useEffect(()=>{
  const handleEnter=(event:KeyboardEvent)=>{
   if(event.key!=="Enter"||event.repeat||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
   const target=event.target;
   if(target instanceof HTMLElement){
    if(target.closest(".guided-tutor")||target.closest("[contenteditable]")||target.tagName==="TEXTAREA"||target.tagName==="SELECT")return;
    // Keep normal Enter behavior for external controls, but allow lesson answer buttons.
    if(target.closest("a, [role=dialog]"))return;
   }
   if(reviewPrompt||finished||!activity||activity.type==="chat")return;
   // Do not trigger when an answer hasn't been selected yet (except vocabulary introduction).
   if(!checked&&activity.type!=="intro"&&!canCheck)return;
   event.preventDefault();
   event.stopPropagation();
   nextRef.current();
  };
  document.addEventListener("keydown",handleEnter,true);
  return()=>document.removeEventListener("keydown",handleEnter,true);
 },[reviewPrompt,finished,activity,checked,canCheck]);
 function listen(){const SpeechRecognition=(window as unknown as {SpeechRecognition?:new()=>any;webkitSpeechRecognition?:new()=>any}).SpeechRecognition||(window as unknown as {webkitSpeechRecognition?:new()=>any}).webkitSpeechRecognition;if(!SpeechRecognition){setError("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn có thể nhập câu vào ô bên dưới.");return;}try{const r=new SpeechRecognition();r.lang="en-US";r.interimResults=false;r.onresult=(e:{results:{[key:number]:{[key:number]:{transcript:string}}}})=>{setRecognized(e.results[0][0].transcript);setListening(false);};r.onerror=()=>{setListening(false);setError("Không nhận diện được giọng nói. Hãy thử lại hoặc nhập câu.");};r.onend=()=>setListening(false);setListening(true);r.start();}catch{setListening(false);setError("Không thể mở micro.");}}

 return <section className="adv-screen"><div className="adv-top"><button onClick={onExit} className="adv-back"><ArrowLeft size={19}/> Bài học</button><div className="adv-progress"><div style={{width:(Math.min(step,activities.length)/Math.max(activities.length,1)*100)+"%"}}/></div><b>{Math.min(step+1,activities.length)} / {activities.length}</b></div>
 {reviewPrompt?<div className="adv-main adv-done"><img src={wolf} alt="Aivanta"/><h1>📚 Ôn lại các câu chưa đúng</h1><p>Bạn đã hoàn thành phần học chính. Cùng Aivanta làm lại {reviewQueue.length} câu trả lời sai hoặc chưa thể luyện nói nhé!</p><button className="adv-primary" onClick={()=>{setReviewMode(true);setReviewIndex(0);resetAnswer();}}>Bắt đầu ôn tập <ArrowRight size={18}/></button></div>:finished?<div className="adv-main adv-done"><img src={wolf} alt="Aivanta"/><h1>🎉 Hoàn thành bài học!</h1><p>Aivanta: Bạn đã hoàn thành {activities.length} hoạt động. {reviewQueue.length?`Bạn đã ôn tập ${reviewQueue.length} câu cần cải thiện.`:"Bạn đã hoàn thành tất cả câu hỏi."} Hãy ôn lại những phần chưa chắc nhé!</p><button disabled={saving} className="adv-primary" onClick={async()=>{setSaving(true);try{await onFinish(right,activities.length);}catch{setError("Chưa lưu được tiến độ. Vui lòng thử lại.");}finally{setSaving(false);}}}>{saving?"Đang lưu...":"Lưu tiến độ và về danh sách"} <ArrowRight size={18}/></button>{error&&<p role="alert">{error}</p>}</div>:<div className="adv-layout"><main className="adv-main"><div className="adv-heading"><span>📖 {lesson.title}</span><h1>{activity.question}</h1>{reviewMode&&<p className="adv-review-label">🔁 Ôn tập câu {reviewIndex+1}/{reviewQueue.length}</p>}<div className="adv-mini-progress">{activity.type==="chat"?"Hội thoại AI":activity.type==="intro"?"Học cùng Aivanta":"Thử thách tương tác"}</div></div>
 {activity.type==="intro"&&<div className="adv-word"><button onClick={()=>say(activity.word?.word||"")}><Volume2 size={26}/></button><h2>{activity.word?.word}</h2><strong>{activity.word?.meaning}</strong><small>Nhấn loa để nghe phát âm.</small></div>}
 {(activity.type==="choice"||activity.type==="listen"||activity.type==="read")&&<>{activity.type==="listen"&&<button className="adv-audio" onClick={()=>say(activity.answer)}><Volume2 size={27}/> Nghe phát âm</button>}{activity.type==="choice"&&<h2 className="adv-prompt">{activity.word?.word}</h2>}{activity.type==="read"&&<p className="adv-read">🐺 Aivanta: {activity.sentence}</p>}<div className="adv-choices">{activity.options?.map((o,i)=><button disabled={checked} className={selected===o?"adv-selected":""} onClick={()=>setSelected(o)} key={i}><span>{String.fromCharCode(65+i)}</span>{o}</button>)}</div></>}
 {activity.type==="fill"&&<div className="adv-input"><p><strong>🌐 Dịch từ tiếng Việt sang tiếng Anh:</strong> {activity.word?.meaning}</p><input autoComplete="off" value={selected} disabled={checked} onChange={e=>setSelected(e.target.value)} placeholder="Nhập từ tiếng Anh..."/></div>}
 {activity.type==="order"&&<><div className="adv-order-answer">{tokens.length?tokens.map((w,i)=><button key={i} onClick={()=>!checked&&setTokens(t=>t.filter((_,j)=>j!==i))}>{w}</button>):"Chạm vào các từ bên dưới để tạo câu"}</div><div className="adv-order-pool">{options.map(o=><button key={o.id} disabled={checked||tokens.filter(x=>x===o.word).length>=orderWords.filter(x=>x===o.word).length} onClick={()=>setTokens(t=>[...t,o.word])}>{o.word}</button>)}</div></>}
 {activity.type==="match"&&<MatchPairs words={lesson.words.filter(w=>w.word&&w.meaning).slice(0,4)} locked={checked&&matchCorrect} onChange={(complete,allCorrect)=>{setMatchComplete(complete);setMatchCorrect(allCorrect);}}/>}
 {activity.type==="speak"&&<div className="adv-speak"><p>{activity.answer}</p><button onClick={()=>say(activity.answer)}><Volume2/> Nghe mẫu</button><button onClick={listen} disabled={listening||checked}><Mic/> {listening?"Đang nghe...":"Nhấn để nói"}</button><input value={recognized} disabled={checked} onChange={e=>setRecognized(e.target.value)} placeholder="Từ được nhận diện (hoặc nhập nếu micro không hỗ trợ)..."/>{!checked&&<button type="button" className="adv-skip-speech" onClick={skipSpeaking}>Tạm thời không nói được →</button>}{error&&<small role="alert">{error}</small>}</div>}
 {activity.type==="chat"&&<GuidedLessonTutor key={lesson.id} words={lesson.words} title={lesson.title} onComplete={()=>setChatCompleted(true)}/>}
 {hint&&<p className="adv-hint">💡 {activity.type==="intro"?"Hãy nghe từ mới và đọc lại.":activity.type==="match"?"Ghép nghĩa tương ứng với từng từ.":activity.type==="chat"?"Hãy thử giới thiệu bản thân với Aivanta.":activity.word?.example?"Ví dụ: "+activity.word.example:"Hãy đọc kỹ yêu cầu và thử lại nhé!"}</p>}
 {checked&&<div role="status" className={"adv-feedback "+(correct||easy?"adv-good":"adv-bad")}>{correct||easy?"🎉 Làm tốt lắm!":speechSkipped?"Bạn có thể luyện phát âm từ này vào cuối bài.":"💡 Chưa chính xác. Đáp án: "+(activity.type==="match"?"Có cặp nối sai (đường màu đỏ). Nhấn vào từ đã nối để gỡ và nối lại.":activity.answer)}</div>}
 <div className="adv-actions"><button className="adv-hint-btn" onClick={()=>setHint(v=>!v)}><Lightbulb size={19}/> Gợi ý từ Aivanta</button><button className="adv-primary" disabled={!checked&&!canCheck} onClick={next}>{activity.type==="chat"?"Hoàn thành hội thoại":activity.type==="intro"?"Tiếp theo":activity.type==="match"&&checked&&!matchCorrect?"Sửa các cặp sai":checked?"Tiếp tục":"Kiểm tra"} <ArrowRight size={19}/></button></div></main><aside className="adv-companion"><div className="adv-wolf"><img src={wolf} alt="Sói Aivanta đồng hành"/><div className="adv-bubble">{checked?(correct||easy?"Giỏi quá! Tiếp tục nhé! 🐾":"Không sao! Mình cùng học lại nhé."):hint?"Mình ở đây để giúp bạn!":"Cùng học nào! Bạn làm được mà! 💙"}</div></div><div className="adv-side-note"><h3>🐺 Aivanta gợi ý</h3><p>{activity.type==="intro"?"Nghe và lặp lại từ mới để ghi nhớ.":activity.type==="chat"?"Hãy trò chuyện bằng tiếng Anh. Mình sẽ sửa lỗi nhẹ nhàng.":"Đọc kỹ câu hỏi. Bạn có thể nhấn Gợi ý khi cần."}</p></div></aside></div>}</section>;
}
