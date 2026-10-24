"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Lightbulb,Volume2,Mic,CheckCircle2,RotateCcw} from "lucide-react";
import GuidedLessonTutor from "./guided-lesson-tutor";
import MatchPairs from "./match-pairs";
type Word={word:string;meaning:string;example:string;pronunciation?:string};
type ExampleTranslation={english:string;vietnamese:string};
type Dialogue={speaker:string;english:string;vietnamese?:string};
type Activity={type:"intro"|"picture"|"choice"|"listen"|"fill"|"order"|"match"|"speak"|"chat"|"read";word?:Word;question:string;answer:string;options?:string[];sentence?:string};
const wolf="/brand/aivanta-mascot.webp.png";
function say(t:string,rate=.85){if(typeof window!=="undefined"&&"speechSynthesis"in window){window.speechSynthesis.cancel();const s=new SpeechSynthesisUtterance(t);s.lang="en-US";s.rate=rate;window.speechSynthesis.speak(s);}}
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
function visualFor(word:string,meaning:string){
 const key=word.toLowerCase().trim().replace(/[.!?]+$/,"");
 const numbers:Record<string,string>={zero:"0",one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10",eleven:"11",twelve:"12",thirteen:"13",fourteen:"14",fifteen:"15",sixteen:"16",seventeen:"17",eighteen:"18",nineteen:"19",twenty:"20",thirty:"30",forty:"40",fifty:"50",hundred:"100"};
 if(numbers[key]!==undefined)return numbers[key];
 if(/^\\d+$/.test(key))return key;
 // Match the actual vocabulary word, never substrings of unrelated words or its translated description.
 const icons:Record<string,string>={
 country:"🌍",nation:"🌍",world:"🌎",earth:"🌎",vietnam:"🇻🇳",japan:"🇯🇵",korea:"🇰🇷",china:"🇨🇳",france:"🇫🇷",england:"🏴",america:"🇺🇸",usa:"🇺🇸",
 age:"🔢",birthday:"🎂",old:"👴",young:"🧒",year:"📅",years:"📅",name:"🏷️",number:"🔢",today:"📅",tomorrow:"🌅",yesterday:"🕰️",morning:"🌄",afternoon:"🌤️",evening:"🌇",night:"🌙",time:"⏰",day:"☀️",week:"🗓️",month:"📆",date:"📅",
 person:"🧍",people:"👥",man:"👨",woman:"👩",boy:"👦",girl:"👧",child:"🧒",children:"👧",adult:"🧑",family:"👨‍👩‍👧‍👦",brother:"👦",sister:"👧",mother:"👩",father:"👨",grandmother:"👵",grandfather:"👴",baby:"👶",uncle:"👨",aunt:"👩",son:"👦",daughter:"👧",friend:"🧑‍🤝‍🧑",
 classmate:"🧑‍🤝‍🧑",neighbor:"🏘️",neighbour:"🏘️",board:"🟩",blackboard:"🟩",whiteboard:"⬜",desk:"🪑",notebook:"📓",worksheet:"📄",classroom:"🏫",eraser:"🧽",ruler:"📏",backpack:"🎒",bag:"🎒",pencil:"✏️",pen:"🖊️",table:"🪵",chair:"🪑",teacher:"👩‍🏫",student:"🧑‍🎓",school:"🏫",book:"📚",phone:"📱",computer:"💻",music:"🎵",
 rice:"🍚",bread:"🍞",egg:"🥚",orange:"🍊",coffee:"☕",tea:"🍵",milk:"🥛",water:"💧",apple:"🍎",banana:"🍌",food:"🍱",cake:"🎂",
 blue:"🔵",red:"🔴",green:"🟢",yellow:"🟡",black:"⚫",white:"⚪",pink:"🩷",
 cat:"🐱",dog:"🐶",car:"🚗",plane:"✈️",airplane:"✈️",house:"🏠",home:"🏠",sun:"☀️",moon:"🌙",fine:"🙂",great:"😄",okay:"👌",ok:"👌",good:"👍",excellent:"🌟",wonderful:"🤩",amazing:"🤩",fantastic:"🎉",awesome:"🔥",well:"🙂",bad:"👎",terrible:"😞",tired:"😴",hungry:"🍽️",thirsty:"🥤",busy:"📋",bored:"🥱",excited:"🤩",nervous:"😰",angry:"😠",scared:"😨",sick:"🤒",healthy:"💪",hello:"👋",hi:"👋",meet:"🤝",meeting:"🤝",greet:"👋",greeting:"👋",goodbye:"👋",bye:"👋",welcome:"🙌",introduce:"🗣️",introduction:"🗣️",nice:"😊",please:"🙏",thanks:"🙏",thank:"🙏",sorry:"😔",yes:"✅",no:"❌",happy:"😊",sad:"😢",love:"❤️",
 hand:"✋",eye:"👁️",ear:"👂",nose:"👃",mouth:"👄",head:"🧑",foot:"🦶",feet:"🦶",run:"🏃",walk:"🚶",sleep:"😴",read:"📖",write:"✍️",listen:"👂",speak:"🗣️"
 };
 return icons[key]||"";
}
function visualElement(word:string,meaning:string){
 const key=word.toLowerCase().trim().replace(/[.!?]+$/,"");
 const flags:Record<string,{code:string;label:string}>={
 vietnam:{code:"vn",label:"Việt Nam"},vietnamese:{code:"vn",label:"Việt Nam"},
 japan:{code:"jp",label:"Nhật Bản"},japanese:{code:"jp",label:"Nhật Bản"},
 korea:{code:"kr",label:"Hàn Quốc"},korean:{code:"kr",label:"Hàn Quốc"},"south korea":{code:"kr",label:"Hàn Quốc"},
 china:{code:"cn",label:"Trung Quốc"},chinese:{code:"cn",label:"Trung Quốc"},
 france:{code:"fr",label:"Pháp"},french:{code:"fr",label:"Pháp"},
 germany:{code:"de",label:"Đức"},german:{code:"de",label:"Đức"},
 england:{code:"gb-eng",label:"Anh"},britain:{code:"gb",label:"Vương quốc Anh"},"united kingdom":{code:"gb",label:"Vương quốc Anh"},
 usa:{code:"us",label:"Hoa Kỳ"},america:{code:"us",label:"Hoa Kỳ"},"united states":{code:"us",label:"Hoa Kỳ"}
 };
 const flag=flags[key];
 return flag?<img src={"https://flagcdn.com/w80/"+flag.code+".png"} alt={"Quốc kỳ "+flag.label} style={{width:78,height:52,objectFit:"contain",display:"inline-block",verticalAlign:"middle"}}/>:(visualFor(word,meaning)||"");
}
function sentenceTranslation(sentence:string,dialogue?:Dialogue[]){const clean=sentence.trim().replace(/[.!?]+$/,"").toLowerCase();const exact=dialogue?.find(d=>d.english.trim().replace(/[.!?]+$/,"").toLowerCase()===clean&&d.vietnamese?.trim());if(exact?.vietnamese)return exact.vietnamese;const countries:Record<string,string>={"vietnam":"Việt Nam","viet nam":"Việt Nam","japan":"Nhật Bản","korea":"Hàn Quốc","south korea":"Hàn Quốc","china":"Trung Quốc","france":"Pháp","england":"Anh","america":"Mỹ","the usa":"Mỹ"};const from=clean.match(/^(?:i'm|i am) from (.+)$/);if(from&&countries[from[1]])return "Tôi đến từ "+countries[from[1]]+".";const templates:Record<string,string>={"hello":"Xin chào.","hi":"Chào bạn.","thank you":"Cảm ơn bạn.","nice to meet you":"Rất vui được gặp bạn.","how are you":"Bạn khỏe không?","what is your name":"Bạn tên là gì?","my name is":"Tên tôi là"};if(templates[clean])return templates[clean];
 const relationship=clean.match(/^(he|she|this|that) is (my|your|his|her|our|their) (.+)$/);
 if(relationship){
  const subjects:Record<string,string>={he:"Anh ấy",she:"Cô ấy",this:"Đây",that:"Đó"};
  const possessives:Record<string,string>={my:"của tôi",your:"của bạn",his:"của anh ấy",her:"của cô ấy",our:"của chúng tôi",their:"của họ"};
  const people:Record<string,string>={classmate:"bạn cùng lớp",friend:"bạn",teacher:"giáo viên",student:"học sinh",brother:"anh/em trai",sister:"chị/em gái",father:"bố",mother:"mẹ",dad:"bố",mom:"mẹ",grandfather:"ông",grandmother:"bà",neighbor:"hàng xóm",neighbour:"hàng xóm",cousin:"anh/chị/em họ",uncle:"chú/bác/cậu",aunt:"cô/dì/bác",son:"con trai",daughter:"con gái"};
  const person=people[relationship[3]];
  if(person)return subjects[relationship[1]]+(relationship[1]==="this"||relationship[1]==="that"?" là ":" là ")+person+" "+possessives[relationship[2]]+".";
 }
 const introductions:Record<string,string>={
  "he is my classmate":"Anh ấy là bạn cùng lớp của tôi.",
  "she is my classmate":"Cô ấy là bạn cùng lớp của tôi.",
  "he is my friend":"Anh ấy là bạn của tôi.",
  "she is my friend":"Cô ấy là bạn của tôi.",
  "this is my friend":"Đây là bạn của tôi.",
  "this is my family":"Đây là gia đình của tôi.",
  "i love my family":"Tôi yêu gia đình của mình.",
  "i have a brother":"Tôi có một người anh/em trai.",
  "i have a sister":"Tôi có một người chị/em gái.",
  "i am a student":"Tôi là học sinh.",
  "i'm a student":"Tôi là học sinh."
 };
 if(introductions[clean])return introductions[clean];const name=clean.match(/^my name is (.+)$/);if(name)return "Tên tôi là "+sentence.trim().replace(/[.!?]+$/,"").slice(11)+".";return null;}
function sourceSentenceTranslation(sentence:string,lesson:{dialogue?:Dialogue[];examples?:ExampleTranslation[]}){
 const normalized=(value:string)=>value.toLowerCase().trim().replace(/[.!?]+$/,"").replace(/\\s+/g," ");
 const found=[...(lesson.examples||[]),...(lesson.dialogue||[])].find(item=>normalized(item.english)===normalized(sentence)&&item.vietnamese?.trim());
 return found?.vietnamese?.trim()||sentenceTranslation(sentence,lesson.dialogue);
}
function norm(t:string){return t.toLowerCase().replace(/[.,!?]/g,"").replace(/\s+/g," ").trim();}
export default function AdventureLesson({lesson,onExit,onFinish}:{lesson:{id:string;title:string;words:Word[];dialogue?:Dialogue[];examples?:ExampleTranslation[];goal?:string;review?:boolean;test?:boolean};onExit:()=>void;onFinish:(correct:number,total:number)=>Promise<void>}){
 const activities=useMemo<Activity[]>(()=>{
  const words=lesson.words.filter(w=>w.word&&w.meaning).slice(0,lesson.review||lesson.test?10:5);if(!words.length)return[];
  const a:Activity[]=[];
  const choicesFor=(w:Word,field:"meaning"|"word")=>{
    const values=[w[field],...words.filter(x=>x.word!==w.word&&x[field]!==w[field]).map(x=>x[field])];
    return [...new Set(values)].slice(0,4).sort((x,y)=>x.localeCompare(y));
  };
  if(lesson.review||lesson.test){
    // Review mixes both source lessons; tests assess more items without introductory cards.
    const mixed:Word[]=[];
    const midpoint=Math.ceil(words.length/2);
    for(let i=0;i<midpoint;i++){if(words[i])mixed.push(words[i]);if(words[midpoint+i])mixed.push(words[midpoint+i]);}
    const practice=mixed.slice(0,10);
    const questionCount=lesson.test?4:3;
    practice.slice(0,questionCount).forEach(w=>a.push({type:"choice",word:w,question:"Chọn nghĩa đúng",answer:w.meaning,options:choicesFor(w,"meaning")}));
    practice.slice(questionCount,questionCount+3).forEach(w=>a.push({type:"listen",word:w,question:"Nghe và chọn từ đúng",answer:w.word,options:choicesFor(w,"word")}));
    a.push({type:"match",question:"Nối từ Anh – Việt của cả hai bài",answer:"",options:practice.slice(0,4).flatMap(w=>[w.word,w.meaning])});
    const examples=[...new Map(practice.filter(w=>w.example?.trim().split(/\\s+/).length>=3).map(w=>[norm(w.example),w])).values()];
    examples.slice(0,lesson.test?3:2).forEach(w=>a.push({type:"order",word:w,question:"Sắp xếp từ thành câu tiếng Anh",answer:w.example.replace(/[.!?]+$/,"")}));
    practice.slice(6).forEach(w=>a.push({type:"choice",word:w,question:"Vận dụng từ vựng đã học",answer:w.meaning,options:choicesFor(w,"meaning")}));
    practice.slice(0,lesson.test?3:2).forEach(w=>a.push({type:"speak",word:w,question:"Phát âm từ đã học",answer:w.word}));
    return a;
  }
  // Fifteen short, varied activities, followed by the Aivanta conversation.
  if(!lesson.test)words.slice(0,3).forEach(w=>a.push({type:"intro",word:w,question:"Khám phá từ mới qua thẻ và âm thanh",answer:w.word}));
  words.slice(0,2).forEach((w,i)=>{const pictureOptions=choicesFor(w,"word");const pictureIcons=pictureOptions.map(option=>visualFor(option,words.find(item=>item.word===option)?.meaning||""));const validPicture=i===0&&pictureOptions.length>=3&&pictureIcons.every(icon=>icon!=="")&&new Set(pictureIcons).size===pictureIcons.length;a.push({type:validPicture?"picture":"choice",word:w,question:validPicture?"Chọn hình đúng với từ tiếng Anh":"Aivanta hỏi: Từ này có nghĩa là gì?",answer:validPicture?w.word:w.meaning,options:validPicture?pictureOptions:choicesFor(w,"meaning")});});
  words.slice(2,4).forEach(w=>a.push({type:"listen",word:w,question:"Nghe Aivanta đọc rồi chọn từ tương ứng",answer:w.word,options:choicesFor(w,"word")}));
  [...new Map(words.filter(w=>w.example?.trim().split(/\s+/).length>=3).map(w=>[norm(w.example),w])).values()].slice(0,1).forEach(w=>a.push({type:"order",word:w,question:"Ghép các mảnh từ thành câu tiếng Anh",answer:w.example.replace(/[.!?]+$/,"")}));
  a.push({type:"match",question:"Nối các cặp từ Anh – Việt",answer:"",options:words.slice(0,4).flatMap(w=>[w.word,w.meaning])});
  words.slice(3,5).filter(w=>!a.some(item=>item.type==="order"&&norm(item.answer)===norm(w.example||""))).forEach(w=>{
    const example=w.example||"";
    const index=example.toLowerCase().indexOf(w.word.toLowerCase());
    if(index<0)return; // Avoid asking for a word absent from the displayed sentence.
    a.push({type:"fill",word:w,question:"Nghe câu và nhập lại toàn bộ bằng tiếng Anh",answer:example.trim(),sentence:example.trim()});
  });
  // Do not fabricate multiple-choice conversation answers from vocabulary examples.
  // The guided Aivanta conversation at the end handles contextual responses.
  words.slice(0,2).forEach(w=>a.push({type:"speak",word:w,question:"Nghe và đọc lại",answer:w.word}));
  if(!lesson.test)a.push({type:"chat",question:"Trò chuyện thực tế với Aivanta",answer:""});
  // Hội thoại với Aivanta là hoạt động cuối cùng; không lặp lại câu hỏi đã làm.
  return a;
 },[lesson]);
 const [dictationMode,setDictationMode]=useState<"tiles"|"keyboard">("keyboard");const [dictationIds,setDictationIds]=useState<number[]>([]);const [reviewQueue,setReviewQueue]=useState<number[]>([]),[reviewIndex,setReviewIndex]=useState(0),[reviewMode,setReviewMode]=useState(false),[speechSkipped,setSpeechSkipped]=useState(false);const [matchComplete,setMatchComplete]=useState(false),[matchCorrect,setMatchCorrect]=useState(false);const [chatCompleted,setChatCompleted]=useState(false);const [step,setStep]=useState(0),[selected,setSelected]=useState(""),[checked,setChecked]=useState(false),[hint,setHint]=useState(false),[matched,setMatched]=useState<string[]>([]),[first,setFirst]=useState(""),[tokens,setTokens]=useState<string[]>([]),[recognized,setRecognized]=useState(""),[listening,setListening]=useState(false),[right,setRight]=useState(0),[saving,setSaving]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  let savedStep=0;let savedChat=false;
  try{const raw=localStorage.getItem("aunora_lesson_step_"+lesson.id);if(raw){const state=JSON.parse(raw);savedStep=Math.max(0,Math.min(activities.length,Number(state.step)||0));savedChat=Boolean(state.chatCompleted);}}catch{}
  setStep(savedStep);setSelected("");setChecked(false);setHint(false);setMatched([]);setFirst("");setMatchComplete(false);setMatchCorrect(false);setTokens([]);setDictationIds([]);setDictationMode("keyboard");setRecognized("");setRight(0);setReviewQueue([]);setReviewIndex(0);setReviewMode(false);setSpeechSkipped(false);setChatCompleted(savedChat);
 },[lesson.id,activities.length]);
 useEffect(()=>{try{localStorage.setItem("aunora_lesson_step_"+lesson.id,JSON.stringify({step,chatCompleted,total:activities.length,title:lesson.title}));}catch{}},[lesson.id,step,chatCompleted]);
 const sceneInfo:Record<string,{icon:string;name:string;mission:string}>={intro:{icon:"✨",name:"KHÁM PHÁ",mission:"Mở thẻ bí mật và nghe từ mới"},picture:{icon:"🖼️",name:"CHỌN HÌNH",mission:"Quan sát các hình và chọn đáp án"},choice:{icon:"🎯",name:"THỬ THÁCH",mission:"Chọn chiếc thẻ đúng để vượt ải"},listen:{icon:"🎧",name:"TRẠM ÂM THANH",mission:"Nghe tín hiệu và giải mã từ"},order:{icon:"🧩",name:"XƯỞNG GHÉP CÂU",mission:"Thu thập mảnh ghép để tạo câu"},match:{icon:"🔗",name:"CẦU KẾT NỐI",mission:"Nối hai thế giới Anh – Việt"},fill:{icon:"🎧",name:"NGHE VÀ VIẾT",mission:"Hoàn thành câu tiếng Anh"},read:{icon:"💬",name:"GẶP GỠ NHÂN VẬT",mission:"Chọn lời đáp phù hợp với câu chuyện"},speak:{icon:"🎤",name:"LUYỆN PHÁT ÂM",mission:"Nghe Aivanta đọc mẫu và nói theo"},chat:{icon:"🐺",name:"HỘI THOẠI AIVANTA",mission:"Cùng Aivanta trò chuyện thực tế"}};
 const activityIndex=reviewMode?reviewQueue[reviewIndex]:step;
 const activity=activities[activityIndex];
 const [translatedSentence,setTranslatedSentence]=useState<{english:string;vietnamese:string|null;loading:boolean}|null>(null);
 const translationCache=useRef(new Map<string,string>());
const finished=reviewMode?reviewIndex>=reviewQueue.length:step>=activities.length&&reviewQueue.length===0;
 const reviewPrompt=step>=activities.length&&!reviewMode&&reviewQueue.length>0;
 const orderWords=(activity?.answer||"").split(" ").filter(Boolean);
 const options=activity?.type==="order"?orderWords.map((w,i)=>({id:i,word:w})).sort((a,b)=>((a.id*7+3)%Math.max(orderWords.length,1))-((b.id*7+3)%Math.max(orderWords.length,1))):[];
 const dictationPool=useMemo(()=>{if(activity?.type!=="fill")return [] as {id:number;word:string}[];const correctWords=activity.answer.trim().replace(/[.!?]+$/,"").split(/\s+/).filter(Boolean);const used=new Set(correctWords.map(w=>w.toLowerCase().replace(/[^a-z']/g,"")));const distractors=[...lesson.words.flatMap(w=>[w.word,...(w.example||"").split(/\s+/)]),"ball","same","next","please","where","they","good","book","school","tomorrow","friend"].map(w=>w.replace(/^[^a-zA-Z]+|[^a-zA-Z']+$/g,"")).filter(w=>w&&!used.has(w.toLowerCase())&&/^[a-zA-Z']+$/.test(w));const unique=[...new Set(distractors.map(w=>w.toLowerCase()))].slice(0,3);const tiles=[...correctWords,...unique].map((word,id)=>({id,word}));let seed=Array.from(activity.answer).reduce((a,c)=>a*31+c.charCodeAt(0),17)>>>0;for(let i=tiles.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}return tiles;},[activity?.type,activity?.answer,lesson.words]);
 const dictationAnswer=dictationMode==="keyboard"?selected:dictationIds.map(id=>dictationPool.find(t=>t.id===id)?.word||"").join(" ");
 const correct=activity?.type==="fill"?norm(dictationAnswer)===norm(activity.answer):activity?.type==="speak"&&speechSkipped?false:activity?.type==="order"?norm(tokens.join(" "))===norm(activity.answer):activity?.type==="speak"?norm(recognized)===norm(activity.answer):activity?.type==="match"?matchCorrect:norm(selected)===norm(activity?.answer||"");
 const translationTarget=checked&&activity?.type==="order"&&correct?activity.answer:null;
 useEffect(()=>{
  if(!translationTarget)return;
  const local=sourceSentenceTranslation(translationTarget,lesson);
  if(local){setTranslatedSentence({english:translationTarget,vietnamese:local,loading:false});return;}
  const cached=translationCache.current.get(translationTarget);
  if(cached){setTranslatedSentence({english:translationTarget,vietnamese:cached,loading:false});return;}
  const controller=new AbortController();
  setTranslatedSentence({english:translationTarget,vietnamese:null,loading:true});
  fetch("/api/translate-sentence?text="+encodeURIComponent(translationTarget),{signal:controller.signal})
   .then(r=>r.ok?r.json():{translation:null})
   .then(data=>{if(controller.signal.aborted)return;const value=typeof data.translation==="string"?data.translation:null;if(value)translationCache.current.set(translationTarget,value);setTranslatedSentence({english:translationTarget,vietnamese:value,loading:false});})
   .catch(()=>{if(!controller.signal.aborted)setTranslatedSentence({english:translationTarget,vietnamese:null,loading:false});});
  return ()=>controller.abort();
 },[translationTarget,lesson]);

 const easy=activity?.type==="intro"||activity?.type==="chat";
 const canCheck=activity?.type==="chat"?chatCompleted:easy||activity?.type==="match"?activity?.type==="match"?matchComplete:true:activity?.type==="order"?tokens.length===orderWords.length:activity?.type==="fill"?(dictationMode==="keyboard"?!!selected.trim():dictationIds.length>0):activity?.type==="speak"?!!recognized||speechSkipped:!!selected;
 function resetAnswer(){setSelected("");setChecked(false);setHint(false);setMatched([]);setFirst("");setMatchComplete(false);setMatchCorrect(false);setTokens([]);setDictationIds([]);setRecognized("");setSpeechSkipped(false);setError("");}
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
 {activity.type==="intro"&&<div className="adv-word adv-picture-card"><div className="adv-picture-illustration" aria-hidden="true">{visualElement(activity.word?.word||"",activity.word?.meaning||"")||"📖"}</div><button onClick={()=>say(activity.word?.word||"")}><Volume2 size={26}/></button><h2>{activity.word?.word}</h2><strong>{activity.word?.meaning}</strong><small>Nhấn loa để nghe phát âm.</small></div>}
 {(activity.type==="choice"||activity.type==="picture"||activity.type==="listen"||activity.type==="read")&&<>{activity.type==="listen"&&<button className="adv-audio" onClick={()=>say(activity.answer)}><Volume2 size={27}/> Nghe phát âm</button>}{(activity.type==="choice"||activity.type==="picture")&&<div className="adv-character-prompt"><img src={wolf} alt="Aivanta"/><div className="adv-character-speech">{activity.word?.word}</div></div>}{activity.type==="read"&&<div className="adv-character-prompt"><img src={wolf} alt="Aivanta"/><div className="adv-character-speech">{activity.sentence}</div></div>}<div className={"adv-choices "+(activity.type==="read"?"adv-choices-dialogue ":"")+(activity.type==="listen"||activity.type==="picture"?"adv-choices-listen":"")}>{activity.options?.map((o,i)=><button disabled={checked} className={selected===o?"adv-selected":""} onClick={()=>setSelected(o)} key={i}><span>{activity.type==="listen"||activity.type==="picture"?(visualElement(o,lesson.words.find(w=>w.word===o)?.meaning||"")||"🔤"):String.fromCharCode(65+i)}</span>{o}</button>)}</div></>}
 {activity.type==="fill"&&<div className="adv-dictation"><div className="adv-dictation-top"><strong>🎧 Nghe và viết lại câu</strong><div className="adv-dictation-modes" role="group" aria-label="Chế độ trả lời"><button type="button" className={dictationMode==="tiles"?"is-active":""} disabled={checked} onClick={()=>{setDictationMode("tiles");setSelected("");}}>🧩 Ghép từ</button><button type="button" className={dictationMode==="keyboard"?"is-active":""} disabled={checked} onClick={()=>{setDictationMode("keyboard");setDictationIds([]);}}>⌨️ Nhấn phím</button></div></div><div className="adv-dictation-audio"><button type="button" aria-label="Nghe câu tiếng Anh" title="Nghe tốc độ bình thường" onClick={()=>say(activity.answer)}><Volume2 size={32}/></button><button type="button" aria-label="Nghe chậm" title="Nghe chậm" onClick={()=>say(activity.answer,.58)}><span aria-hidden="true">🐢</span></button></div>{dictationMode==="tiles"?<><div className="adv-dictation-answer" aria-label="Câu đang ghép">{dictationIds.length?dictationIds.map((id,i)=>{const tile=dictationPool.find(t=>t.id===id);return <button key={id} type="button" disabled={checked} onClick={()=>setDictationIds(prev=>prev.filter((_,j)=>j!==i))}>{tile?.word}</button>}):<span>Chọn các từ bên dưới để ghép câu bạn nghe được</span>}</div><div className="adv-dictation-pool">{dictationPool.map(tile=><button type="button" key={tile.id} disabled={checked||dictationIds.includes(tile.id)} onClick={()=>setDictationIds(prev=>[...prev,tile.id])}>{tile.word}</button>)}</div></>:<input autoComplete="off" autoCapitalize="off" spellCheck={false} value={selected} disabled={checked} onChange={e=>setSelected(e.target.value)} placeholder="Nhập câu tiếng Anh bạn nghe được..."/>}</div>}
 {activity.type==="order"&&<><div className="adv-workshop-title">🧩 KHU VỰC LẮP GHÉP</div><div className="adv-order-answer adv-animated-tiles">{tokens.length?tokens.map((w,i)=><button key={i} onClick={()=>!checked&&setTokens(t=>t.filter((_,j)=>j!==i))}>{w}</button>):"Chạm vào các từ bên dưới để tạo câu"}</div><div className="adv-order-pool">{options.map(o=><button key={o.id} disabled={checked||tokens.filter(x=>x===o.word).length>=orderWords.filter(x=>x===o.word).length} onClick={()=>setTokens(t=>[...t,o.word])}>{o.word}</button>)}</div></>}
 {activity.type==="match"&&<MatchPairs words={(activity.options?.length?Array.from({length:Math.floor(activity.options.length/2)},(_,i)=>({word:activity.options![i*2],meaning:activity.options![i*2+1],example:""})):lesson.words.filter(w=>w.word&&w.meaning).slice(0,4))} locked={checked&&matchCorrect} onChange={(complete,allCorrect)=>{setMatchComplete(complete);setMatchCorrect(allCorrect);}}/>}
 {activity.type==="speak"&&<div className="adv-speak-studio"><div className="adv-speak-intro"><h2>Nghe và đọc lại</h2><p>Nghe mẫu, sau đó chạm micro để đọc theo</p></div><div className="adv-speak-character"><img src={wolf} alt="Aivanta đọc mẫu"/><div className="adv-speak-bubble"><strong>{activity.answer}</strong>{activity.word?.pronunciation&&<span>{activity.word.pronunciation}</span>}<button type="button" aria-label="Nghe Aivanta đọc mẫu" onClick={()=>say(activity.answer)}><Volume2 size={28}/></button></div></div><span className="adv-speak-sample">Nghe mẫu</span><button type="button" className={"adv-speak-micro"+(listening?" is-listening":"")} onClick={listen} disabled={listening||checked} aria-label={listening?"Đang nghe giọng nói":"Chạm để đọc lại"}><Mic size={68}/></button><strong className="adv-speak-micro-label">{listening?"Đang nghe bạn nói...":"Chạm để đọc lại"}</strong><div className={"adv-speak-wave"+(listening?" is-active":"")} aria-hidden="true">{Array.from({length:19},(_,i)=><i key={i} style={{height:(9+(i*13%34))+"px"}}/>)}</div>{recognized&&<p className="adv-speak-heard">Đã nghe: <strong>{recognized}</strong></p>}{!checked&&<button type="button" className="adv-skip-speech" onClick={skipSpeaking}>Tạm thời không nói được →</button>}{error&&<small role="alert">{error}</small>}{error&&<input className="adv-speak-fallback" value={recognized} onChange={e=>setRecognized(e.target.value)} placeholder="Hoặc nhập từ tiếng Anh tại đây"/>}</div>}
 {activity.type==="chat"&&<GuidedLessonTutor key={lesson.id} words={lesson.words} title={lesson.title} onComplete={()=>setChatCompleted(true)}/>}
 
 {checked&&activity.type==="order"&&correct&&<div className="adv-translation" role="status"><strong>🇻🇳 Nghĩa tiếng Việt:</strong> {translatedSentence?.english===activity.answer?(translatedSentence.loading?"Đang dịch câu…":translatedSentence.vietnamese||"Chưa thể dịch câu này, hãy thử lại sau."):"Đang dịch câu…"}<button type="button" onClick={()=>say(activity.answer)}><Volume2 size={17}/> Nghe lại câu</button></div>}
 {checked&&<div role="status" className={"adv-feedback "+(correct||easy?"adv-good":"adv-bad")}>{correct||easy?"🎉 Làm tốt lắm!":speechSkipped?"Bạn có thể luyện phát âm từ này vào cuối bài.":"❌ Chưa chính xác. Đáp án: "+(activity.type==="match"?"Có cặp nối sai (đường màu đỏ). Nhấn vào từ đã nối để gỡ và nối lại.":activity.answer)}</div>}
 <div className="adv-actions">{activity.type!=="match"&&<button className="adv-primary" disabled={!checked&&!canCheck} onClick={next}>{activity.type==="chat"?"Hoàn thành hội thoại":activity.type==="intro"?"Tiếp theo":checked?"Tiếp tục":"Kiểm tra"} <ArrowRight size={19}/></button>}</div></main><aside className="adv-companion"><div className={"adv-wolf "+(checked?(correct?"adv-wolf-happy":"adv-wolf-try"):hint?"adv-wolf-help":"")}><div className="adv-companion-tag">🐺 ĐỒNG ĐỘI AIVANTA</div><img src={wolf} alt="Sói Aivanta đồng hành"/><div className="adv-bubble">{checked?(correct||easy?"Giỏi quá! Tiếp tục nhé! 🐾":"Không sao! Mình cùng học lại nhé."):hint?"Mình ở đây để giúp bạn!":"Cùng học nào! Bạn làm được mà! 💙"}</div></div></aside></div>}</section>;
}
