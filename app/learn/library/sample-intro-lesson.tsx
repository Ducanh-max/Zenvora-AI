"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {sampleLessons,vocabulary,type Task} from "./sample-intro-content";
import "./sample-intro.css";
const norm=(s:string)=>s.toLowerCase().replace(/[.,!?]/g,"").replace(/’/g,"'").replace(/\s+/g," ").trim();
function shuffle<T,>(items:T[]):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function mix(tasks:Task[]){const pool=shuffle(tasks),out:Task[]=[];while(pool.length){let i=pool.findIndex(t=>t.kind!==out[out.length-1]?.kind);if(i<0)i=0;out.push(pool.splice(i,1)[0]);}return out;}
function say(text:string,slow=false){if(!("speechSynthesis"in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=slow?.65:.85;window.speechSynthesis.speak(u);}
function Gloss({text,words}:{text:string;words:string[]}){
 const entries=vocabulary.filter(w=>words.includes(w.en)).sort((a,b)=>b.en.length-a.en.length);
 const [tip,setTip]=useState<{en:string;vi:string;left:number;top:number}|null>(null);
 const tooltipId=useId();
 useEffect(()=>{const close=()=>setTip(null);window.addEventListener("scroll",close,true);window.addEventListener("resize",close);window.addEventListener("dragstart",close,true);return()=>{window.removeEventListener("scroll",close,true);window.removeEventListener("resize",close);window.removeEventListener("dragstart",close,true);};},[]);
 function show(target:HTMLElement,en:string,vi:string){const rect=target.getBoundingClientRect();const width=Math.min(240,window.innerWidth-24);setTip({en,vi,left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:Math.max(12,rect.bottom+90>window.innerHeight?rect.top-80:rect.bottom+8)});}
 if(!entries.length)return <>{text}</>;
 return <>{text.split(new RegExp("(\\b(?:"+entries.map(w=>w.en).join("|")+")\\b)","gi")).map((p,i)=>{const v=entries.find(w=>norm(w.en)===norm(p));return v?<span className="si-gloss" key={i}><span tabIndex={0} role="button" aria-label={p+" — "+v.vi} aria-describedby={tip?.en===p?tooltipId:undefined} onMouseEnter={event=>show(event.currentTarget,p,v.vi)} onMouseLeave={()=>setTip(null)} onFocus={event=>show(event.currentTarget,p,v.vi)} onClick={event=>{show(event.currentTarget,p,v.vi);}} onKeyDown={event=>{if(event.key==="Escape"){setTip(null);return;}if(event.key==="Enter"||event.key===" "){event.preventDefault();show(event.currentTarget,p,v.vi);event.currentTarget.closest("button")?.click();}}} onBlur={()=>setTip(null)}>{p}</span></span>:<span key={i}>{p}</span>;})}{tip&&createPortal(<span id={tooltipId} role="tooltip" className="si-floating-meaning" style={{left:tip.left,top:tip.top}}><b>{tip.en}</b><span>{tip.vi}</span></span>,document.body)}</>;
}
const conversationHelp:Record<string,{vi:string;answers:{en:string;vi:string}[]}>={
 "Hello! What is your name?":{vi:"Xin chào! Bạn tên là gì?",answers:[{en:"Hello! My name is Linh.",vi:"Xin chào! Tên tôi là Linh."},{en:"Hi, I am Nam.",vi:"Chào bạn, tôi là Nam."}]},
 "Nice to meet you! How do you greet a new friend?":{vi:"Rất vui được gặp bạn! Bạn chào một người bạn mới như thế nào?",answers:[{en:"Hello! Nice to meet you.",vi:"Xin chào! Rất vui được gặp bạn."},{en:"Hi! My name is Mai. What is your name?",vi:"Chào bạn! Tên tôi là Mai. Bạn tên là gì?"}]},
 "You can invent your details. How old are you?":{vi:"Bạn có thể dùng thông tin tưởng tượng. Bạn bao nhiêu tuổi?",answers:[{en:"I am twelve years old.",vi:"Tôi mười hai tuổi."},{en:"I am thirteen years old.",vi:"Tôi mười ba tuổi."}]},
 "Where are you from? You can choose an imaginary country.":{vi:"Bạn đến từ đâu? Bạn có thể chọn một quốc gia tưởng tượng.",answers:[{en:"I am from Vietnam.",vi:"Tôi đến từ Việt Nam."},{en:"I am from Japan.",vi:"Tôi đến từ Nhật Bản."}]},
 "What do you like doing in your free time?":{vi:"Bạn thích làm gì trong thời gian rảnh?",answers:[{en:"I like reading books.",vi:"Tôi thích đọc sách."},{en:"I like playing football.",vi:"Tôi thích chơi bóng đá."}]},
 "Tell your new friend one thing about yourself.":{vi:"Hãy kể cho người bạn mới một điều về bản thân bạn.",answers:[{en:"I am a student and I like music.",vi:"Tôi là học sinh và tôi thích âm nhạc."},{en:"My name is Linh and I live in Hanoi.",vi:"Tên tôi là Linh và tôi sống ở Hà Nội."}]}
};
function PairBoard({task,newWords,onComplete}:{task:Task;newWords:string[];onComplete:()=>void}){
 const pairs=task.pairs||[];
 const [left,setLeft]=useState<number|null>(null),[solved,setSolved]=useState<number[]>([]),[message,setMessage]=useState("");
 const right=useMemo(()=>shuffle(pairs.map((_,i)=>i)),[task.id]);
 return <div><p className="si-tip">{task.kind==="audioMatch"?"Mỗi ô loa đọc một từ. Nghe rồi chọn nghĩa ở cột phải.":"Chọn từ tiếng Anh rồi chọn nghĩa tiếng Việt."}</p><div className="si-pairs"><div><h3>{task.kind==="audioMatch"?"Âm thanh":"Tiếng Anh"}</h3>{pairs.map((p,i)=><button type="button" aria-label={task.kind==="audioMatch"?"Nghe ô "+(i+1):p.en} disabled={solved.includes(i)} className={(left===i?"selected ":"")+(solved.includes(i)?"solved":"")} key={p.en} onClick={()=>{setLeft(i);if(task.kind==="audioMatch")say(p.en);}}>{task.kind==="audioMatch"?"🔊 Ô "+(i+1):<Gloss text={p.en} words={newWords}/>}{solved.includes(i)?" ✓":""}</button>)}</div><div><h3>Nghĩa tiếng Việt</h3>{right.map(i=><button type="button" key={pairs[i].en} disabled={solved.includes(i)} className={solved.includes(i)?"solved":""} onClick={()=>{if(left===null){setMessage("Chọn ô bên trái trước nhé.");return;}if(left===i){const next=[...solved,i];setSolved(next);setLeft(null);setMessage("✓ "+pairs[i].en+" — "+pairs[i].vi);if(next.length===pairs.length)onComplete();}else setMessage("Chưa đúng. Nghe hoặc đọc lại ô đang chọn nhé.");}}>{pairs[i].vi}{solved.includes(i)?" ✓":""}</button>)}</div></div><p role="status">{message||"Đã nối "+solved.length+"/"+pairs.length+" cặp"}</p></div>;
}
function Exercise({task,newWords,onDone}:{task:Task;newWords:string[];onDone:(correct:boolean)=>void}){
 const [answer,setAnswer]=useState(""),[tiles,setTiles]=useState<number[]>([]),[checked,setChecked]=useState(false),[paired,setPaired]=useState(false),[listening,setListening]=useState(false),[error,setError]=useState("");
 const draggedTile=useRef<number|null>(null),suppressClickUntil=useRef(0);
 const [dragging,setDragging]=useState<number|null>(null);
 function moveTile(id:number,targetId?:number,after=false){
  if(checked)return;
  setTiles(previous=>{
   if(id===targetId)return previous;
   const next=previous.filter(value=>value!==id);
   const target=targetId===undefined?-1:next.indexOf(targetId);
   next.splice(target<0?next.length:target+(after?1:0),0,id);
   return next;
  });
 }
 function startDrag(event:React.DragEvent<HTMLButtonElement>,id:number){
  if(checked){event.preventDefault();return;}
  draggedTile.current=id;setDragging(id);suppressClickUntil.current=Number.POSITIVE_INFINITY;
  event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",String(id));
 }
 function endDrag(){draggedTile.current=null;setDragging(null);suppressClickUntil.current=Date.now()+250;}
 function allowDrop(event:React.DragEvent<HTMLElement>){if(!checked&&draggedTile.current!==null){event.preventDefault();event.dataTransfer.dropEffect="move";}}
 function dropTile(event:React.DragEvent<HTMLElement>,targetId?:number){
  if(checked||draggedTile.current===null)return;
  event.preventDefault();event.stopPropagation();
  const rect=event.currentTarget.getBoundingClientRect();
  moveTile(draggedTile.current,targetId,targetId!==undefined&&event.clientX>rect.left+rect.width/2);
  endDrag();
 }
 const recognition=useRef<{stop:()=>void}|null>(null);
 useEffect(()=>()=>{recognition.current?.stop();window.speechSynthesis?.cancel();},[]);
 const bank=useMemo(()=>{const a=shuffle(task.answer.split(/\s+/).map((word,id)=>({word,id})));if(a.length>1&&a.map(t=>t.word).join(" ")===task.answer)a.push(a.shift()!);return a;},[task.id]);
 const options=useMemo(()=>shuffle(task.options||[]),[task.id]);
 const isTiles=task.kind==="order"||task.kind==="listenOrder",isPairs=task.kind==="match"||task.kind==="audioMatch";
 const response=isTiles?tiles.map(id=>bank.find(t=>t.id===id)?.word||"").join(" "):answer;
 const correct=isPairs?paired:norm(response)===norm(task.answer);
 const canCheck=isPairs?paired:isTiles?tiles.length===bank.length:Boolean(answer.trim());
 const english=task.kind==="translate"&&task.answer===task.vi?task.prompt.match(/“([^”]+)”/)?.[1]||task.answer:task.answer;
 function record(){
  const R=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!R){setError("Trình duyệt chưa hỗ trợ micro. Bạn có thể nhập nội dung bên dưới.");return;}
  try{const r=new R();recognition.current=r;r.lang="en-US";r.interimResults=false;r.onresult=(e:any)=>{setAnswer(e.results[0][0].transcript);setListening(false);};r.onerror=()=>{setError("Chưa nghe rõ. Hãy thử lại hoặc nhập câu.");setListening(false);};r.onend=()=>setListening(false);setListening(true);r.start();}catch{setError("Không mở được micro. Bạn có thể nhập câu.");setListening(false);}
 }
 return <><div className="si-body"><h1><Gloss text={task.prompt} words={newWords}/></h1>{newWords.length>0&&<p className="si-tip">Từ màu hồng là từ mới · Rê chuột hoặc chạm để xem nghĩa</p>}
 {task.context&&<div className="si-context"><Gloss text={task.context} words={newWords}/></div>}
 {(task.kind==="listenOrder"||task.kind==="speak")&&<div className="si-audio">{task.kind==="speak"&&<p className="si-spoken"><Gloss text={task.answer} words={newWords}/></p>}<button type="button" onClick={()=>say(task.answer)}>🔊 {task.kind==="speak"?"Nghe mẫu":"Nghe câu"}</button><button type="button" onClick={()=>say(task.answer,true)}>🐢 Nghe chậm</button></div>}
 {isTiles&&<><p className="si-tip">Bấm bất kỳ chỗ nào trên thẻ hoặc kéo thả để ghép câu. Kéo các từ trong câu để đổi vị trí; kéo về khay để bỏ từ.</p><div className={"si-answer"+(dragging!==null?" si-drop-active":"")} aria-label="Câu trả lời, có thể kéo thả các từ" onDragOver={allowDrop} onDrop={event=>dropTile(event)}>{tiles.length?tiles.map((id,index)=><button type="button" draggable={!checked} disabled={checked} key={id} className={dragging===id?"si-dragging":""} onDragStart={event=>startDrag(event,id)} onDragEnd={endDrag} onDragOver={allowDrop} onDrop={event=>dropTile(event,id)} onKeyDown={event=>{if(!checked&&event.altKey&&(event.key==="ArrowLeft"||event.key==="ArrowRight")){event.preventDefault();const target=tiles[index+(event.key==="ArrowLeft"?-1:1)];if(target!==undefined)moveTile(id,target,event.key==="ArrowRight");}}} onClick={()=>{if(!checked&&Date.now()>suppressClickUntil.current)setTiles(a=>a.filter(v=>v!==id));}}><Gloss text={bank.find(t=>t.id===id)?.word||""} words={newWords}/></button>):<span>Chọn hoặc kéo các từ vào đây để ghép câu</span>}</div><div className={"si-bank"+(dragging!==null?" si-drop-active":"")} aria-label="Khay từ" onDragOver={allowDrop} onDrop={event=>{if(!checked&&draggedTile.current!==null){event.preventDefault();event.stopPropagation();const id=draggedTile.current;setTiles(previous=>previous.filter(value=>value!==id));endDrag();}}}>{bank.map(t=><div className="si-tile" key={t.id}><button type="button" draggable={!checked&&!tiles.includes(t.id)} disabled={checked||tiles.includes(t.id)} onDragStart={event=>startDrag(event,t.id)} onDragEnd={endDrag} onClick={()=>{if(!checked&&Date.now()>suppressClickUntil.current)moveTile(t.id);}}><Gloss text={t.word} words={newWords}/></button></div>)}</div></>}
 {options.length>0&&<div className="si-options">{options.map(o=><div className="si-option" key={o}><button type="button" disabled={checked} className={answer===o?"selected":""} onClick={()=>setAnswer(o)}><Gloss text={o} words={newWords}/></button>{newWords.includes(o.toLowerCase())&&<span className="si-tile-meaning">{vocabulary.find(w=>w.en===o.toLowerCase())?.vi}</span>}</div>)}</div>}
 {isPairs&&<PairBoard task={task} newWords={newWords} onComplete={()=>setPaired(true)}/>}
 {task.kind==="speak"&&<div className="si-record"><button type="button" disabled={checked||listening} onClick={record}>🎙️ {listening?"Đang nghe…":"Chạm để đọc lại"}</button><label>Đã nghe / nhập nếu không dùng được micro<input value={answer} disabled={checked} onChange={e=>setAnswer(e.target.value)} placeholder={task.answer.split(/\s+/).length>1?"Nhập cả câu tiếng Anh":"Nhập từ tiếng Anh"}/></label>{error&&<p role="alert">{error}</p>}</div>}
 </div><div className="si-bottom">{checked&&<div role="status" className={"si-feedback "+(correct?"good":"bad")}><strong>{correct?"✓ Chính xác!":"Chưa chính xác — cùng xem lại"}</strong>{isPairs?<p>{task.pairs?.map(p=>p.en+" — "+p.vi).join(" · ")}</p>:<><p><b>{task.kind==="dialogue"?"Từ cần điền":"Đáp án"}:</b> {task.answer}</p><p><b>{task.contextVi?"Nghĩa hội thoại":"Nghĩa tiếng Việt"}:</b> {task.contextVi||task.vi}</p></>}<p>{task.note}</p>{!isPairs&&<button type="button" onClick={()=>say(english)}>🔊 Nghe lại {english.split(/\s+/).length>1?"cả câu":"từ"}</button>}</div>}<button type="button" className="si-primary" disabled={!checked&&!canCheck} onClick={()=>checked?onDone(correct):setChecked(true)}>{checked?"Tiếp tục →":"Kiểm tra"}</button></div></>;
}
function Aivanta({questions,title,onTurn,onDone}:{questions:string[];title:string;onTurn:()=>void;onDone:()=>void}){
 const [index,setIndex]=useState(0),[answer,setAnswer]=useState(""),[reply,setReply]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [showTranslation,setShowTranslation]=useState(true),[showHints,setShowHints]=useState(false),[replyTranslation,setReplyTranslation]=useState(""),[translating,setTranslating]=useState(false);
 const help=conversationHelp[questions[index]];
 async function translateReply(){if(!reply||translating)return;setTranslating(true);setError("");try{const response=await fetch("/api/speaking/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[reply]})});const data=await response.json();if(!response.ok||typeof data.translations?.[0]!=="string")throw Error(data.error||"Chưa dịch được phản hồi.");setReplyTranslation(data.translations[0]);}catch(error){setError(error instanceof Error?error.message:"Chưa dịch được phản hồi.");}finally{setTranslating(false);}}
 async function send(){if(!answer.trim()||busy)return;setBusy(true);setError("");try{const r=await fetch("/api/tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"intro_sample_feedback",lesson:{title},messages:[{role:"assistant",content:questions[index]},{role:"user",content:answer}]})});const d=await r.json();if(!r.ok)throw Error(d.error||"Chưa kết nối được Aivanta.");setReply(String(d.reply||""));}catch(e){setError(e instanceof Error?e.message:"Chưa kết nối được Aivanta.");}finally{setBusy(false);}}
 return <><div className="si-body"><div className="si-ai"><img src="/brand/wolf-face/aivanta-face.png" alt="Aivanta"/><h1>Giới thiệu mình với Aivanta</h1><p>Câu hỏi {index+1}/2 · Có thể dùng thông tin tưởng tượng.</p><div className="si-context">{questions[index]}<button type="button" aria-label="Nghe câu hỏi" onClick={()=>say(questions[index])}>🔊</button></div><div className="si-ai-tools"><button type="button" aria-pressed={showTranslation} onClick={()=>setShowTranslation(value=>!value)}>{showTranslation?"Ẩn nghĩa câu hỏi":"Dịch câu hỏi"}</button><button type="button" aria-expanded={showHints} onClick={()=>setShowHints(value=>!value)}>{showHints?"Ẩn gợi ý":"💡 Gợi ý trả lời"}</button></div>{showTranslation&&help&&<p className="si-question-translation"><b>Nghĩa tiếng Việt:</b> {help.vi}</p>}{showHints&&help&&<div className="si-answer-hints"><p>Bạn có thể tham khảo và sửa thông tin cho phù hợp:</p>{help.answers.map(item=><div key={item.en}><strong>{item.en}</strong><p>{item.vi}</p><button type="button" disabled={Boolean(reply)||busy} onClick={()=>setAnswer(item.en)}>Dùng câu này</button></div>)}</div>}<label>Câu trả lời bằng tiếng Anh<textarea value={answer} disabled={Boolean(reply)||busy} maxLength={500} onChange={e=>setAnswer(e.target.value)}/></label>{reply&&<div role="status" className="si-feedback good"><p>{reply}</p><button type="button" disabled={translating} onClick={()=>void translateReply()}>{translating?"Đang dịch…":"Dịch phản hồi của Aivanta"}</button>{replyTranslation&&<p><b>Bản dịch:</b> {replyTranslation}</p>}</div>}{error&&<p role="alert">{error}</p>}</div></div><div className="si-bottom"><button type="button" className="si-primary" disabled={busy||(!reply&&!answer.trim())} onClick={()=>{if(!reply){void send();return;}if(index===1){onDone();return;}setIndex(1);onTurn();setAnswer("");setReply("");setReplyTranslation("");setShowHints(false);}}>{busy?"Aivanta đang phản hồi…":reply?(index===1?"Hoàn thành bài học":"Câu hỏi thứ hai →"):"Gửi cho Aivanta"}</button></div></>;
}
export default function SampleIntroLesson({lessonIndex,onExit,onFinish}:{lessonIndex:number;onExit:()=>void;onFinish:(score:number,total:number)=>Promise<void>}){
 const lesson=sampleLessons[lessonIndex];
 const [deck,setDeck]=useState<Task[]>([]),[step,setStep]=useState(0),[score,setScore]=useState(0),[aiDone,setAiDone]=useState(false),[aiTurn,setAiTurn]=useState(0),[saving,setSaving]=useState(false),[error,setError]=useState(""),[exit,setExit]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{setDeck(mix(lesson.tasks));setStep(0);setScore(0);setAiDone(false);setAiTurn(0);},[lessonIndex]);
 useEffect(()=>{if(exit&&!dialog.current?.open)dialog.current?.showModal();if(!exit&&dialog.current?.open)dialog.current.close();},[exit]);
 const total=12,finished=deck.length>0&&step>=deck.length&&(!lesson.questions.length||aiDone),chat=deck.length>0&&step>=deck.length&&!finished;
 return <section className="si-screen"><header><button type="button" aria-label="Thoát bài học" onClick={()=>setExit(true)}>←</button><div className="si-track"><i style={{width:(finished?100:(step+aiTurn)/total*100)+"%"}}/></div><b>{Math.min(step+aiTurn+1,total)}/{total}</b></header><div className="si-meta">GIỚI THIỆU BẢN THÂN · BÀI {lessonIndex+1}/4 · {lesson.title}</div>
 {!deck.length?<p>Đang chuẩn bị bài học…</p>:finished?<div className="si-finish"><h1>🎉 Bạn đã hoàn thành!</h1><p>{score}/{deck.length} hoạt động trả lời đúng{lesson.questions.length?" · Đã trò chuyện 2 câu với Aivanta":""}.</p><p>{lessonIndex===3?"Bạn đã ôn đủ các dạng câu hỏi của chủ đề Giới thiệu bản thân.":"Hãy tiếp tục bài kế tiếp để mở rộng phần giới thiệu của mình."}</p><button type="button" className="si-primary" disabled={saving} onClick={async()=>{setSaving(true);setError("");try{await onFinish(score+(lesson.questions.length?2:0),total);}catch{setError("Chưa lưu được kết quả. Nhấn để thử lại.");}finally{setSaving(false);}}}>{saving?"Đang lưu…":"Lưu kết quả và về danh sách"}</button>{error&&<p role="alert">{error}</p>}</div>:chat?<Aivanta questions={lesson.questions} title={"Giới thiệu bản thân — "+lesson.title} onTurn={()=>setAiTurn(1)} onDone={()=>setAiDone(true)}/>:<Exercise key={deck[step].id} task={deck[step]} newWords={lesson.newWords} onDone={correct=>{if(correct)setScore(v=>v+1);setStep(v=>v+1);}}/>}
 <dialog ref={dialog} className="si-exit" aria-labelledby="si-exit-title" onCancel={e=>{e.preventDefault();setExit(false);}} onClose={()=>setExit(false)}><h2 id="si-exit-title">Bạn có chắc chắn muốn thoát bài học không?</h2><p>Bài đang học dở sẽ bắt đầu lại từ đầu khi bạn vào lại.</p><button type="button" autoFocus className="si-primary" onClick={()=>setExit(false)}>Tiếp tục học</button><button type="button" onClick={onExit}>Thoát bài học</button></dialog>
 </section>;
}
