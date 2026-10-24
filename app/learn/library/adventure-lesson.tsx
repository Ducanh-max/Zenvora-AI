"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Lightbulb,Volume2,Mic,CheckCircle2,RotateCcw} from "lucide-react";
import GuidedLessonTutor from "./guided-lesson-tutor";
import MatchPairs from "./match-pairs";
type Word={word:string;meaning:string;example:string;pronunciation?:string};
type Dialogue={speaker:string;english:string;vietnamese?:string};
type Activity={type:"intro"|"picture"|"choice"|"listen"|"fill"|"order"|"match"|"speak"|"chat"|"read";word?:Word;question:string;answer:string;options?:string[];sentence?:string};
const wolf="/brand/aivanta-mascot.webp.png";
function say(t:string){if(typeof window!=="undefined"&&"speechSynthesis"in window){window.speechSynthesis.cancel();const s=new SpeechSynthesisUtterance(t);s.lang="en-US";s.rate=.85;window.speechSynthesis.speak(s);}}
function playErrorSound(){if(typeof window==="undefined")return;try{const ctx=new AudioContext();const oscillator=ctx.createOscillator();const gain=ctx.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(320,ctx.currentTime);oscillator.frequency.exponentialRampToValueAtTime(205,ctx.currentTime+.2);gain.gain.setValueAtTime(.13,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.25);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.26);setTimeout(()=>void ctx.close(),500);}catch{}}
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
function visualFor(word:string,meaning:string){const t=(word+" "+meaning).toLowerCase();const entries:[RegExp,string][]=[[/one|một|first|đầu tiên/,"1️⃣"],[/two|hai|second/,"2️⃣"],[/three|ba/,"3️⃣"],[/ten|mười/,"🔟"],[/country|quốc gia/,"🌍"],[/vietnam|việt nam/,"🇻🇳"],[/korea|hàn quốc/,"🇰🇷"],[/japan|nhật bản/,"🇯🇵"],[/pencil|bút chì/,"✏️"],[/pen|bút/,"🖊️"],[/table|bàn/,"🪑"],[/chair|ghế/,"🪑"],[/teacher|giáo viên/,"👩‍🏫"],[/student|học sinh/,"🧑‍🎓"],[/family|gia đình/,"👨‍👩‍👧"],[/brother|anh trai|em trai|anh em trai/,"👦"],[/sister|chị gái|em gái|chị em gái/,"👧"],[/grandmother|grandma|bà nội|bà ngoại/,"👵"],[/grandfather|grandpa|ông nội|ông ngoại/,"👴"],[/baby|em bé/,"👶"],[/uncle|chú|bác trai|cậu/,"👨"],[/aunt|cô|dì|bác gái/,"👩"],[/son|con trai/,"👦"],[/daughter|con gái/,"👧"],[/mother|mẹ/,"👩"],[/father|bố|cha/,"👨"],[/rice|cơm|gạo/,"🍚"],[/bread|bánh mì/,"🍞"],[/egg|trứng/,"🥚"],[/orange|cam/,"🍊"],[/blue|xanh dương/,"🔵"],[/red|đỏ/,"🔴"],[/green|xanh lá/,"🟢"],[/coffee|cà phê/,"☕"],[/tea|trà/,"🍵"],[/milk|sữa/,"🥛"],[/water|nước/,"💧"],[/apple|táo/,"🍎"],[/banana|chuối/,"🍌"],[/book|sách/,"📚"],[/school|trường/,"🏫"],[/cat|mèo/,"🐱"],[/dog|chó/,"🐶"],[/car|xe hơi|ô tô/,"🚗"],[/plane|máy bay/,"✈️"],[/house|home|nhà/,"🏠"],[/sun|mặt trời/,"☀️"],[/friend|bạn bè/,"🧑‍🤝‍🧑"],[/hello|xin chào/,"👋"],[/food|đồ ăn/,"🍱"],[/phone|điện thoại/,"📱"],[/music|âm nhạc/,"🎵"],[/happy|vui/,"😊"]];return entries.find(([re])=>re.test(t))?.[1]||"🖼️";}
function norm(t:string){return t.toLowerCase().replace(/[.,!?]/g,"").replace(/\s+/g," ").trim();}
export default function AdventureLesson({lesson,onExit,onFinish}:{lesson:{id:string;title:string;words:Word[];dialogue?:Dialogue[];goal?:string;review?:boolean;test?:boolean};onExit:()=>void;onFinish:(correct:number,total:number)=>Promise<void>}){
 const activities=useMemo<Activity[]>(()=>{
  const words=lesson.words.filter(w=>w.word&&w.meaning).slice(0,lesson.review||lesson.test?10:5);if(!words.length)return[];
  const a:Activity[]=[];
  const choicesFor=(w:Word,field:"meaning"|"word")=>{
    const values=[w[field],...words.filter(x=>x.word!==w.word&&x[field]!==w[field]).map(x=>x[field])];
    return [...new Set(values)].slice(0,4).sort((x,y)=>x.localeCompare(y));
  };
  if(lesson.review&&!lesson.test){
    // Lesson 3 revisits both previous lessons: no new-word introductions.
    // Interleave source halves so neither topic dominates the practice.
    const midpoint=Math.ceil(words.length/2);
    const mixed:Word[]=[];
    for(let i=0;i<midpoint;i++){
      if(words[i])mixed.push(words[i]);
      if(words[midpoint+i])mixed.push(words[midpoint+i]);
    }
    const practice=mixed.slice(0,8);
    practice.slice(0,2).forEach(w=>a.push({type:"choice",word:w,question:"Chọn nghĩa đúng",answer:w.meaning,options:choicesFor(w,"meaning")}));
    practice.slice(2,4).forEach(w=>a.push({type:"listen",word:w,question:"Nghe và chọn từ đúng",answer:w.word,options:choicesFor(w,"word")}));
    const exampleWord=practice.find(w=>w.example?.trim().split(/\s+/).length>=3);
    if(exampleWord)a.push({type:"order",word:exampleWord,question:"Ghép câu đã học",answer:exampleWord.example.replace(/[.!?]+$/,"")});
    a.push({type:"match",question:"Nối từ Anh – Việt của cả hai bài",answer:"",options:[...practice.slice(0,4).flatMap(w=>[w.word,w.meaning])]});
    practice.slice(4,6).forEach(w=>a.push({type:"choice",word:w,question:"Ôn nhanh: Chọn nghĩa đúng",answer:w.meaning,options:choicesFor(w,"meaning")}));
    practice.slice(6,8).forEach(w=>a.push({type:"listen",word:w,question:"Nghe và nhận biết từ",answer:w.word,options:choicesFor(w,"word")}));
    a.push({type:"chat",question:"Trò chuyện thực tế với Aivanta",answer:""});
    return a;
  }
  // Fifteen short, varied activities, followed by the Aivanta conversation.
  if(!lesson.test)words.slice(0,3).forEach(w=>a.push({type:"intro",word:w,question:"Khám phá từ mới qua thẻ và âm thanh",answer:w.word}));
  words.slice(0,2).forEach((w,i)=>a.push({type:i===0?"picture":"choice",word:w,question:i===0?"Chọn hình đúng với từ tiếng Anh":"Aivanta hỏi: Từ này có nghĩa là gì?",answer:i===0?w.word:w.meaning,options:choicesFor(w,i===0?"word":"meaning")}));
  words.slice(2,4).forEach(w=>a.push({type:"listen",word:w,question:"Nghe Aivanta đọc rồi chọn từ tương ứng",answer:w.word,options:choicesFor(w,"word")}));
  [...new Map(words.filter(w=>w.example?.trim().split(/\s+/).length>=3).map(w=>[norm(w.example),w])).values()].slice(0,1).forEach(w=>a.push({type:"order",word:w,question:"Ghép các mảnh từ thành câu tiếng Anh",answer:w.example.replace(/[.!?]+$/,"")}));
  a.push({type:"match",question:"Nối các cặp từ Anh – Việt",answer:"",options:words.slice(0,4).flatMap(w=>[w.word,w.meaning])});
  words.slice(3,5).forEach(w=>{
    const example=w.example||"";
    const index=example.toLowerCase().indexOf(w.word.toLowerCase());
    if(index<0)return; // Avoid asking for a word absent from the displayed sentence.
    a.push({type:"fill",word:w,question:"Nghe câu và nhập lại toàn bộ bằng tiếng Anh",answer:example.trim(),sentence:example.trim()});
  });
  // Do not fabricate multiple-choice conversation answers from vocabulary examples.
  // The guided Aivanta conversation at the end handles contextual responses.
  words.slice(0,2).forEach(w=>a.push({type:"speak",word:w,question:"Tự nói hoặc viết từ tiếng Anh",answer:w.word}));
  a.push({type:"chat",question:"Trò chuyện thực tế với Aivanta",answer:""});
  // Hội thoại với Aivanta là hoạt động cuối cùng; không lặp lại câu hỏi đã làm.
  return a;
 },[lesson]);
 const [reviewQueue,setReviewQueue]=useState<number[]>([]),[reviewIndex,setReviewIndex]=useState(0),[reviewMode,setReviewMode]=useState(false),[speechSkipped,setSpeechSkipped]=useState(false);const [matchComplete,setMatchComplete]=useState(false),[matchCorrect,setMatchCorrect]=useState(false);const [chatCompleted,setChatCompleted]=useState(false);const [step,setStep]=useState(0),[selected,setSelected]=useState(""),[checked,setChecked]=useState(false),[hint,setHint]=useState(false),[matched,setMatched]=useState<string[]>([]),[first,setFirst]=useState(""),[tokens,setTokens]=useState<string[]>([]),[recognized,setRecognized]=useState(""),[listening,setListening]=useState(false),[right,setRight]=useState(0),[saving,setSaving]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  let savedStep=0;let savedChat=false;
  try{const raw=localStorage.getItem("aunora_lesson_step_"+lesson.id);if(raw){const state=JSON.parse(raw);savedStep=Math.max(0,Math.min(activities.length,Number(state.step)||0));savedChat=Boolean(state.chatCompleted);}}catch{}
  setStep(savedStep);setSelected("");setChecked(false);setHint(false);setMatched([]);setFirst("");setMatchComplete(false);setMatchCorrect(false);setTokens([]);setRecognized("");setRight(0);setReviewQueue([]);setReviewIndex(0);setReviewMode(false);setSpeechSkipped(false);setChatCompleted(savedChat);
 },[lesson.id,activities.length]);
 useEffect(()=>{try{localStorage.setItem("aunora_lesson_step_"+lesson.id,JSON.stringify({step,chatCompleted,total:activities.length,title:lesson.title}));}catch{}},[lesson.id,step,chatCompleted]);
 const sceneInfo:Record<string,{icon:string;name:string;mission:string}>={intro:{icon:"✨",name:"KHÁM PHÁ",mission:"Mở thẻ bí mật và nghe từ mới"},picture:{icon:"🖼️",name:"CHỌN HÌNH",mission:"Quan sát các hình và chọn đáp án"},choice:{icon:"🎯",name:"THỬ THÁCH",mission:"Chọn chiếc thẻ đúng để vượt ải"},listen:{icon:"🎧",name:"TRẠM ÂM THANH",mission:"Nghe tín hiệu và giải mã từ"},order:{icon:"🧩",name:"XƯỞNG GHÉP CÂU",mission:"Thu thập mảnh ghép để tạo câu"},match:{icon:"🔗",name:"CẦU KẾT NỐI",mission:"Nối hai thế giới Anh – Việt"},fill:{icon:"🎧",name:"NGHE VÀ VIẾT",mission:"Hoàn thành câu tiếng Anh"},read:{icon:"💬",name:"GẶP GỠ NHÂN VẬT",mission:"Chọn lời đáp phù hợp với câu chuyện"},speak:{icon:"🎤",name:"SÂN KHẤU CỦA BẠN",mission:"Nói hoặc viết để hoàn thành thử thách"},chat:{icon:"🐺",name:"HỘI THOẠI AIVANTA",mission:"Cùng Aivanta trò chuyện thực tế"}};
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
   else {playErrorSound();if(activity.type!=="match"&&!reviewMode){setReviewQueue(prev=>prev.includes(activityIndex)?prev:[...prev,activityIndex]);}}
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

 const scene=sceneInfo[activity?.type||"intro"];
 useEffect(()=>{if(activity?.type!=="match"||!matchComplete||!matchCorrect)return;playSuccessSound();setRight(n=>n+1);const timer=setTimeout(()=>advance(),850);return()=>clearTimeout(timer);},[activityIndex,activity?.type,matchComplete,matchCorrect]);
 return <section key={lesson.id+"-"+activityIndex+(reviewMode?"-review":"")} className={"adv-screen adv-scene-"+(activity?.type||"intro")+(checked?" adv-is-checked":"") }><div className="adv-top"><button onClick={onExit} className="adv-back"><ArrowLeft size={19}/> Bài học</button><div className="adv-progress"><div style={{width:(Math.min(step,activities.length)/Math.max(activities.length,1)*100)+"%"}}/></div><b>{Math.min(step+1,activities.length)} / {activities.length}</b></div>
 {reviewPrompt?<div className="adv-main adv-done"><img src={wolf} alt="Aivanta"/><h1>📚 Ôn lại các câu chưa đúng</h1><p>Bạn đã hoàn thành phần học chính. Cùng Aivanta làm lại {reviewQueue.length} câu trả lời sai hoặc chưa thể luyện nói nhé!</p><button className="adv-primary" onClick={()=>{setReviewMode(true);setReviewIndex(0);resetAnswer();}}>Bắt đầu ôn tập <ArrowRight size={18}/></button></div>:finished?<div className="adv-main adv-done"><img src={wolf} alt="Aivanta"/><h1>🎉 Hoàn thành bài học!</h1><p>Aivanta: Bạn đã hoàn thành {activities.length} hoạt động. {reviewQueue.length?`Bạn đã ôn tập ${reviewQueue.length} câu cần cải thiện.`:"Bạn đã hoàn thành tất cả câu hỏi."} Hãy ôn lại những phần chưa chắc nhé!</p><button disabled={saving} className="adv-primary" onClick={async()=>{setSaving(true);try{await onFinish(right,activities.length);}catch{setError("Chưa lưu được tiến độ. Vui lòng thử lại.");}finally{setSaving(false);}}}>{saving?"Đang lưu...":"Lưu tiến độ và về danh sách"} <ArrowRight size={18}/></button>{error&&<p role="alert">{error}</p>}</div>:<div className="adv-layout"><main className="adv-main"><div className="adv-heading"><div className="adv-mission-label"><span>{scene.icon} {scene.name}</span><span>⭐ NHIỆM VỤ {Math.min(step+1,activities.length)}/{activities.length}</span></div><span className="adv-lesson-title">📖 {lesson.title}</span><h1>{activity.question}</h1><p className="adv-mission-subtitle">{scene.mission}</p>{reviewMode&&<p className="adv-review-label">🔁 Ôn tập câu {reviewIndex+1}/{reviewQueue.length}</p>}<div className="adv-mini-progress">{activity.type==="chat"?"Hội thoại AI":activity.type==="intro"?"Học cùng Aivanta":"Thử thách tương tác"}</div></div>
 {activity.type==="intro"&&<div className="adv-word adv-picture-card"><div className="adv-picture-illustration" aria-hidden="true">{visualFor(activity.word?.word||"",activity.word?.meaning||"")}</div><button onClick={()=>say(activity.word?.word||"")}><Volume2 size={26}/></button><h2>{activity.word?.word}</h2><strong>{activity.word?.meaning}</strong><small>Nhấn loa để nghe phát âm.</small></div>}
 {(activity.type==="choice"||activity.type==="picture"||activity.type==="listen"||activity.type==="read")&&<>{activity.type==="listen"&&<button className="adv-audio" onClick={()=>say(activity.answer)}><Volume2 size={27}/> Nghe phát âm</button>}{(activity.type==="choice"||activity.type==="picture")&&<div className="adv-character-prompt"><img src={wolf} alt="Aivanta"/><div className="adv-character-speech">{activity.word?.word}</div></div>}{activity.type==="read"&&<div className="adv-character-prompt"><img src={wolf} alt="Aivanta"/><div className="adv-character-speech">{activity.sentence}</div></div>}<div className={"adv-choices "+(activity.type==="read"?"adv-choices-dialogue ":"")+(activity.type==="listen"||activity.type==="picture"?"adv-choices-listen":"")}>{activity.options?.map((o,i)=><button disabled={checked} className={selected===o?"adv-selected":""} onClick={()=>setSelected(o)} key={i}><span>{activity.type==="listen"||activity.type==="picture"?visualFor(o,lesson.words.find(w=>w.word===o)?.meaning||""):String.fromCharCode(65+i)}</span>{o}</button>)}</div></>}
 {activity.type==="fill"&&<div className="adv-input"><p><strong>🎧 Nghe và viết lại cả câu:</strong> Không hiển thị câu mẫu</p><button type="button" onClick={()=>say(activity.sentence||activity.answer)}><Volume2 size={20}/> Nghe câu tiếng Anh</button><input autoComplete="off" value={selected} disabled={checked} onChange={e=>setSelected(e.target.value)} placeholder="Nhập toàn bộ câu bạn nghe được..."/></div>}
 {activity.type==="order"&&<><div className="adv-workshop-title">🧩 KHU VỰC LẮP GHÉP</div><div className="adv-order-answer adv-animated-tiles">{tokens.length?tokens.map((w,i)=><button key={i} onClick={()=>!checked&&setTokens(t=>t.filter((_,j)=>j!==i))}>{w}</button>):"Chạm vào các từ bên dưới để tạo câu"}</div><div className="adv-order-pool">{options.map(o=><button key={o.id} disabled={checked||tokens.filter(x=>x===o.word).length>=orderWords.filter(x=>x===o.word).length} onClick={()=>setTokens(t=>[...t,o.word])}>{o.word}</button>)}</div></>}
 {activity.type==="match"&&<MatchPairs words={(activity.options?.length?Array.from({length:Math.floor(activity.options.length/2)},(_,i)=>({word:activity.options![i*2],meaning:activity.options![i*2+1],example:""})):lesson.words.filter(w=>w.word&&w.meaning).slice(0,4))} locked={checked&&matchCorrect} onChange={(complete,allCorrect)=>{setMatchComplete(complete);setMatchCorrect(allCorrect);}}/>}
 {activity.type==="speak"&&<div className="adv-speak"><p>{activity.answer}</p><button onClick={()=>say(activity.answer)}><Volume2/> Nghe mẫu</button><button onClick={listen} disabled={listening||checked}><Mic/> {listening?"Đang nghe...":"Nhấn để nói"}</button><input value={recognized} disabled={checked} onChange={e=>setRecognized(e.target.value)} placeholder="Từ được nhận diện (hoặc nhập nếu micro không hỗ trợ)..."/>{!checked&&<button type="button" className="adv-skip-speech" onClick={skipSpeaking}>Tạm thời không nói được →</button>}{error&&<small role="alert">{error}</small>}</div>}
 {activity.type==="chat"&&<GuidedLessonTutor key={lesson.id} words={lesson.words} title={lesson.title} onComplete={()=>setChatCompleted(true)}/>}
 
 {checked&&<div role="status" className={"adv-feedback "+(correct||easy?"adv-good":"adv-bad")}>{correct||easy?"🎉 Làm tốt lắm!":speechSkipped?"Bạn có thể luyện phát âm từ này vào cuối bài.":"❌ Chưa chính xác. Đáp án: "+(activity.type==="match"?"Có cặp nối sai (đường màu đỏ). Nhấn vào từ đã nối để gỡ và nối lại.":activity.answer)}</div>}
 <div className="adv-actions">{activity.type!=="match"&&<button className="adv-primary" disabled={!checked&&!canCheck} onClick={next}>{activity.type==="chat"?"Hoàn thành hội thoại":activity.type==="intro"?"Tiếp theo":checked?"Tiếp tục":"Kiểm tra"} <ArrowRight size={19}/></button>}</div></main><aside className="adv-companion"><div className={"adv-wolf "+(checked?(correct?"adv-wolf-happy":"adv-wolf-try"):hint?"adv-wolf-help":"")}><div className="adv-companion-tag">🐺 ĐỒNG ĐỘI AIVANTA</div><img src={wolf} alt="Sói Aivanta đồng hành"/><div className="adv-bubble">{checked?(correct||easy?"Giỏi quá! Tiếp tục nhé! 🐾":"Không sao! Mình cùng học lại nhé."):hint?"Mình ở đây để giúp bạn!":"Cùng học nào! Bạn làm được mà! 💙"}</div></div></aside></div>}</section>;
}
