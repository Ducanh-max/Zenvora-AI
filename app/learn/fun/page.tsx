"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowLeft,RotateCcw,Trophy,Sparkles} from "lucide-react";
type Mode="menu"|"quiz"|"scramble"|"match"|"memory"|"truefalse"|"missing"|"sentence"|"emoji"|"odd";
type Item={en:string;vi:string;emoji:string};
const vocab:Item[]=[
 {en:"apple",vi:"quả táo",emoji:"🍎"},{en:"school",vi:"trường học",emoji:"🏫"},
 {en:"happy",vi:"vui vẻ",emoji:"😊"},{en:"water",vi:"nước",emoji:"💧"},
 {en:"friend",vi:"bạn bè",emoji:"🤝"},{en:"book",vi:"quyển sách",emoji:"📖"},
 {en:"sun",vi:"mặt trời",emoji:"☀️"},{en:"cat",vi:"con mèo",emoji:"🐱"},
 {en:"dog",vi:"con chó",emoji:"🐶"},{en:"house",vi:"ngôi nhà",emoji:"🏠"},
 {en:"flower",vi:"bông hoa",emoji:"🌸"},{en:"car",vi:"xe hơi",emoji:"🚗"}
];
const sentences=[{en:"I love English",vi:"Tôi yêu tiếng Anh"},{en:"She reads books",vi:"Cô ấy đọc sách"},{en:"We go to school",vi:"Chúng tôi đi học"},{en:"The cat is happy",vi:"Con mèo vui vẻ"},{en:"I drink water",vi:"Tôi uống nước"},{en:"This is my friend",vi:"Đây là bạn tôi"}];
const oddSets=[{items:["apple","banana","orange","car"],answer:"car",reason:"car = xe hơi"},{items:["cat","dog","flower","bird"],answer:"flower",reason:"flower = hoa"},{items:["school","house","book","hospital"],answer:"book",reason:"book = sách"},{items:["red","blue","happy","green"],answer:"happy",reason:"happy = vui vẻ"},{items:["run","walk","jump","water"],answer:"water",reason:"water = nước"},{items:["sun","moon","star","friend"],answer:"friend",reason:"friend = bạn bè"}];
const games:{id:Mode;icon:string;vi:string;en:string;descVi:string;descEn:string}[]=[
 {id:"quiz",icon:"🎯",vi:"Đấu trường từ vựng",en:"Vocabulary Arena",descVi:"Chọn nghĩa đúng của từ.",descEn:"Choose the right word."},
 {id:"scramble",icon:"🔤",vi:"Giải mã từ bí mật",en:"Word Scramble",descVi:"Sắp xếp chữ cái thành từ.",descEn:"Unscramble the letters."},
 {id:"match",icon:"🔗",vi:"Ghép cặp từ vựng",en:"Word Match",descVi:"Nối tiếng Anh với nghĩa tiếng Việt.",descEn:"Match words and meanings."},
 {id:"memory",icon:"🧠",vi:"Lật thẻ trí nhớ",en:"Memory Flip",descVi:"Tìm các cặp từ giống nhau.",descEn:"Find matching pairs."},
 {id:"truefalse",icon:"⚡",vi:"Đúng hay Sai",en:"True or False",descVi:"Phán đoán nghĩa từ thật nhanh.",descEn:"Judge each word meaning."},
 {id:"missing",icon:"🧩",vi:"Chữ cái biến mất",en:"Missing Letter",descVi:"Điền chữ cái còn thiếu.",descEn:"Fill in the missing letter."},
 {id:"sentence",icon:"📝",vi:"Xếp câu tiếng Anh",en:"Sentence Builder",descVi:"Ghép các từ thành câu hoàn chỉnh.",descEn:"Build a correct sentence."},
 {id:"emoji",icon:"🎨",vi:"Đoán từ qua Emoji",en:"Emoji Guess",descVi:"Nhìn hình đoán từ tiếng Anh.",descEn:"Guess words from emojis."},
 {id:"odd",icon:"🔍",vi:"Tìm từ khác biệt",en:"Odd One Out",descVi:"Chọn từ không cùng nhóm.",descEn:"Find the word that doesn't belong."}
];
function shuffle<T,>(values:T[]):T[]{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
type Card={id:string;value:string;pair:number};
export default function FunPage(){
 const [lang,setLang]=useState<"vi"|"en">("vi");
 const [mode,setMode]=useState<Mode>("menu");
 const [round,setRound]=useState(0);
 const [score,setScore]=useState(0);
 const [pool,setPool]=useState<Item[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [input,setInput]=useState("");
 const [checked,setChecked]=useState(false);
 const [choices,setChoices]=useState<string[]>([]);
 const [cards,setCards]=useState<Card[]>([]);
 const [flipped,setFlipped]=useState<string[]>([]);
 const [matched,setMatched]=useState<number[]>([]);
 const [pairPick,setPairPick]=useState<{side:"en"|"vi";pair:number}|null>(null);
 const [ordered,setOrdered]=useState<string[]>([]);
 const [tokens,setTokens]=useState<{id:number;word:string}[]>([]);
 const [chosenTokens,setChosenTokens]=useState<number[]>([]);
 useEffect(()=>{try{setLang(localStorage.getItem("aunora_language")==="en"?"en":"vi");}catch{}},[]);
 const vi=lang==="vi";
 const total=mode==="match"||mode==="memory"?6:mode==="sentence"||mode==="odd"?6:8;
 const finished=mode!=="menu"&&(mode==="match"||mode==="memory"?matched.length>=6:round>=total);
 const item=pool[round];
 const sentence=sentences[round];
 const odd=oddSets[round];
 function resetRound(nextRound:number,newPool:Item[],newMode:Mode){
  setSelected(null);setInput("");setChecked(false);setOrdered([]);setChosenTokens([]);
  if(newMode==="sentence"){const pieces=sentences[nextRound]?.en.split(" ")||[];setTokens(shuffle(pieces.map((word,id)=>({id,word}))));}
  else if(newMode==="quiz"||newMode==="emoji"){const answer=newPool[nextRound]?.en;setChoices(shuffle([answer,...shuffle(vocab.filter(v=>v.en!==answer)).slice(0,3).map(v=>v.en)]));}
  else if(newMode==="truefalse"){const correct=nextRound%2===0;setChoices([correct?newPool[nextRound]?.vi:shuffle(vocab.filter(v=>v.en!==newPool[nextRound]?.en))[0].vi]);}
  else if(newMode==="odd"){setChoices(shuffle(oddSets[nextRound]?.items||[]));}
 }
 function start(nextMode:Mode){
  const newPool=shuffle(vocab).slice(0,8);setPool(newPool);setMode(nextMode);setRound(0);setScore(0);setMatched([]);setFlipped([]);setPairPick(null);
  if(nextMode==="match"||nextMode==="memory"){
   const base=shuffle(vocab).slice(0,6);
   setPool(base);
   const a=base.map((v,i)=>({id:"a"+i,value:nextMode==="match"?v.en:v.emoji,pair:i}));
   const b=base.map((v,i)=>({id:"b"+i,value:nextMode==="match"?v.vi:v.emoji,pair:i}));
   setCards(nextMode==="match"?[...shuffle(a),...shuffle(b)]:shuffle([...a,...b]));
  }
  resetRound(0,newPool,nextMode);
 }
 function next(){const r=round+1;setRound(r);resetRound(r,pool,mode);}
 function answer(value:string,correct:string){if(selected!==null)return;setSelected(value);if(value===correct)setScore(s=>s+1);}
 function submit(){if(checked||!input.trim())return;setChecked(true);if(input.trim().toLowerCase()===item?.en)setScore(s=>s+1);}
 function matchCard(card:Card){
  if(matched.includes(card.pair))return;
  if(mode==="match"){
   const side=card.id.startsWith("a")?"en":"vi";
   if(!pairPick){setPairPick({side,pair:card.pair});return;}
   if(pairPick.side===side){setPairPick({side,pair:card.pair});return;}
   if(pairPick.pair===card.pair){setMatched(m=>[...m,card.pair]);setScore(s=>s+1);}
   setPairPick(null);
  }else{
   if(flipped.includes(card.id)||flipped.length>=2)return;
   const nextFlipped=[...flipped,card.id];setFlipped(nextFlipped);
   if(nextFlipped.length===2){const other=cards.find(c=>c.id===nextFlipped[0]);if(other?.pair===card.pair){setMatched(m=>[...m,card.pair]);setScore(s=>s+1);setFlipped([]);}else{setTimeout(()=>setFlipped([]),800);}}
  }
 }
 function selectToken(id:number){if(checked||chosenTokens.includes(id))return;setChosenTokens(x=>[...x,id]);}
 function checkSentence(){if(checked||chosenTokens.length!==tokens.length)return;setChecked(true);const phrase=chosenTokens.map(id=>tokens.find(t=>t.id===id)?.word).join(" ");if(phrase===sentence.en)setScore(s=>s+1);}
 const correct=mode==="odd"?odd?.answer:mode==="sentence"?sentence?.en:mode==="truefalse"?(round%2===0?"true":"false"):item?.en;
 const success=mode==="sentence"?chosenTokens.map(id=>tokens.find(t=>t.id===id)?.word).join(" ")===sentence?.en:mode==="truefalse"?selected===correct:mode==="missing"||mode==="scramble"?input.trim().toLowerCase()===item?.en:selected===correct;
 return <main className="funzone"><div className="funzone-shell">
 <header className="funzone-top"><Link href="/learn"><ArrowLeft size={17}/>{vi?"Về trang học tập":"Back to learning"}</Link><b>🐺 AUNORA FUN ZONE</b></header>
 <section className="funzone-hero"><div><span><Sparkles size={15}/> {vi?"GIẢI TRÍ • HỌC TIẾNG ANH":"FUN • LEARN ENGLISH"}</span><h1>{vi?"Thế giới trò chơi Aivanta":"Aivanta's Game World"}</h1><p>{vi?"9 trò chơi nhỏ để thư giãn, rèn trí nhớ và học tiếng Anh mỗi ngày.":"9 mini-games to relax, train your memory and learn English."}</p></div><div className="funzone-mascot">🐺</div></section>
 {mode==="menu"?<section className="funzone-grid">{games.map(g=><article key={g.id} className="funzone-card"><div className="funzone-icon">{g.icon}</div><h2>{vi?g.vi:g.en}</h2><p>{vi?g.descVi:g.descEn}</p><button onClick={()=>start(g.id)}>{vi?"Chơi ngay":"Play now"} →</button></article>)}</section>:
 <section className="funzone-board">{finished?<div className="funzone-finish"><Trophy size={55}/><h2>{vi?"Hoàn thành thử thách!":"Challenge complete!"}</h2><strong>{score}/{total}</strong><p>{vi?"Aivanta rất vui vì bạn đã cố gắng!":"Aivanta is proud of your effort!"}</p><div className="funzone-actions"><button onClick={()=>start(mode)}><RotateCcw size={17}/>{vi?"Chơi lại":"Play again"}</button><button onClick={()=>setMode("menu")} className="secondary">{vi?"Chọn trò khác":"Other games"}</button></div></div>:
 <>
 <div className="funzone-status"><button onClick={()=>setMode("menu")}>← {vi?"Trò chơi":"Games"}</button><b>{games.find(g=>g.id===mode)?.icon} {vi?games.find(g=>g.id===mode)?.vi:games.find(g=>g.id===mode)?.en}</b><span>⭐ {score}/{total}</span></div>
 <div className="funzone-progress"><div style={{width:`${(mode==="match"||mode==="memory"?matched.length/6:round/total)*100}%`}}/></div>
 {(mode==="match"||mode==="memory")?<><h2 className="funzone-prompt">{vi?(mode==="match"?"Ghép từ với nghĩa tương ứng":"Lật hai thẻ giống nhau"):(mode==="match"?"Match each word to its meaning":"Flip two matching cards")}</h2><div className={mode==="match"?"funzone-pairs":"funzone-memory"}>{cards.map(card=>{const done=matched.includes(card.pair);const active=mode==="match"&&pairPick?.pair===card.pair&&pairPick.side===(card.id.startsWith("a")?"en":"vi");const shown=mode==="match"||done||flipped.includes(card.id);return <button key={card.id} className={`${done?"done":""} ${active?"active":""}`} disabled={done} onClick={()=>matchCard(card)}>{shown?card.value:"❔"}</button>;})}</div></>:
 <>
 <div className="funzone-prompt"><small>{vi?"CÂU":"QUESTION"} {round+1}/{total}</small>
 <h2>{mode==="quiz"?`“${item?.vi}”`:mode==="emoji"?`${item?.emoji} — ${vi?"Đây là gì?":"What is this?"}`:mode==="scramble"?`${vi?"Giải mã":"Unscramble"}: ${item?.vi}`:mode==="missing"?`${vi?"Điền chữ còn thiếu":"Fill the missing letter"}: ${item?.vi}`:mode==="truefalse"?`“${item?.en}” = “${choices[0]}” ?`:mode==="sentence"?`${vi?"Xếp câu":"Build sentence"}: ${sentence?.vi}`:vi?"Từ nào khác nhóm?":"Which word is different?"}</h2>
 {mode==="scramble"&&<div className="funzone-letters">{item?.en.split("").reverse().join(" · ")}</div>}
 {mode==="missing"&&<div className="funzone-letters">{item?.en.replace(/./g,(c,i)=>i===Math.floor(item.en.length/2)?"_":c).toUpperCase()}</div>}
 </div>
 {(mode==="quiz"||mode==="emoji"||mode==="odd"||mode==="truefalse")?<div className="funzone-options">{(mode==="truefalse"?["true","false"]:choices).map(opt=><button key={opt} disabled={selected!==null} className={selected!==null?(opt===correct?"correct":opt===selected?"wrong":""):""} onClick={()=>answer(opt,correct||"")}>{mode==="truefalse"?(opt==="true"?(vi?"✓ Đúng":"✓ True"):(vi?"✕ Sai":"✕ False")):opt}</button>)}</div>:null}
 {(mode==="scramble"||mode==="missing")?<div className="funzone-input"><label htmlFor="fun-answer">{vi?"Nhập từ tiếng Anh":"Type the English word"}</label><input id="fun-answer" value={input} disabled={checked} maxLength={30} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit();}} placeholder={vi?"Đáp án...":"Answer..."}/>{!checked&&<button disabled={!input.trim()} onClick={submit}>{vi?"Kiểm tra":"Check"}</button>}</div>:null}
 {mode==="sentence"?<div className="funzone-sentence"><div className="funzone-selected">{chosenTokens.map(id=><button key={id} disabled={checked} onClick={()=>setChosenTokens(x=>x.filter(v=>v!==id))}>{tokens.find(t=>t.id===id)?.word} ×</button>)}</div><div className="funzone-tokens">{tokens.filter(t=>!chosenTokens.includes(t.id)).map(t=><button key={t.id} onClick={()=>selectToken(t.id)}>{t.word}</button>)}</div>{!checked&&<button className="funzone-submit" disabled={chosenTokens.length!==tokens.length} onClick={checkSentence}>{vi?"Kiểm tra câu":"Check sentence"}</button>}</div>:null}
 {(selected!==null||checked)&&<div className="funzone-feedback"><strong>{success?(vi?"🎉 Chính xác!":"🎉 Correct!"):(vi?"💡 Học thêm một chút nhé!":"💡 Keep learning!")}</strong><p>{vi?"Đáp án đúng":"Correct answer"}: <b>{mode==="sentence"?sentence?.en:mode==="truefalse"?(correct==="true"?(vi?"Đúng":"True"):(vi?"Sai":"False")):mode==="odd"?`${odd?.answer} (${odd?.reason})`:item?.en}</b>{mode!=="sentence"&&mode!=="truefalse"&&mode!=="odd"?` — ${item?.vi}`:""}</p><button onClick={next}>{round===total-1?(vi?"Xem kết quả":"See results"):(vi?"Tiếp theo":"Next")} →</button></div>}
 </>}
 </>}
 </section>}
 <p className="funzone-note">{vi?"Điểm trò chơi chỉ để giải trí, không trừ Năng lượng Sói hoặc thay đổi tiến trình học.":"Game scores are for fun and do not change Wolf Energy or course progress."}</p>
 </div><style>{`
.funzone{min-height:100vh;background:linear-gradient(145deg,#eef5ff,#f8fbff);padding:26px 16px 65px;color:#153a75}.funzone-shell{max-width:1080px;margin:auto}.funzone-top{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:22px;font-size:13px;color:#4270aa}.funzone-top a{display:flex;align-items:center;gap:7px;color:#205cb9;text-decoration:none;font-weight:800}.funzone-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;border-radius:25px;padding:35px 40px;background:linear-gradient(120deg,#122e67,#2469c8);color:white}.funzone-hero span{display:flex;align-items:center;gap:8px;color:#b5dcff;font-size:12px;font-weight:900;letter-spacing:1px}.funzone-hero h1{font-size:clamp(26px,4vw,42px);margin:15px 0}.funzone-hero p{line-height:1.7;color:#d9eaff}.funzone-mascot{font-size:100px}.funzone-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-top:23px}.funzone-card,.funzone-board{background:#fff;border:1px solid #d9e7fb;border-radius:21px;padding:24px;box-shadow:0 10px 28px #174c9010}.funzone-icon{display:grid;place-items:center;width:56px;height:56px;border-radius:16px;background:#eaf3ff;font-size:30px}.funzone-card h2{font-size:20px;margin:18px 0 7px}.funzone-card p{color:#5b779b;line-height:1.6;min-height:48px;font-size:14px}.funzone-card button,.funzone-input button,.funzone-feedback button,.funzone-actions button,.funzone-submit{border:0;border-radius:11px;background:#216be4;color:#fff;padding:12px 19px;min-height:44px;font-size:14px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.funzone-board{margin-top:22px;padding:28px}.funzone-status{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.funzone-status>button{border:0;background:none;color:#396cae;cursor:pointer;font-weight:800}.funzone-progress{height:9px;background:#eaf0fb;border-radius:99px;overflow:hidden;margin:23px 0}.funzone-progress div{height:100%;background:#3b89f2;transition:width .2s}.funzone-prompt{text-align:center;margin:24px 0}.funzone-prompt small{color:#5a82bd;letter-spacing:1px;font-weight:900}.funzone-prompt h2{font-size:clamp(23px,3vw,34px);margin:13px 0}.funzone-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.funzone-options button,.funzone-pairs button,.funzone-memory button,.funzone-tokens button,.funzone-selected button{padding:15px;border:2px solid #d9e6f8;border-radius:13px;background:#f7faff;color:#17457f;font-size:17px;font-weight:800;min-height:57px;cursor:pointer}.funzone-options button.correct,.funzone-pairs button.done,.funzone-memory button.done{background:#e0f8eb;border-color:#18a469;color:#11663f}.funzone-options button.wrong{background:#ffebeb;border-color:#df7070;color:#a82d2d}.funzone-options button:disabled{cursor:default}.funzone-pairs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.funzone-pairs button.active{border-color:#2376e9;background:#e0efff}.funzone-memory{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.funzone-memory button{font-size:30px;min-height:85px}.funzone-input{display:flex;flex-direction:column;gap:12px;max-width:430px;margin:auto}.funzone-input label{font-weight:800}.funzone-input input{padding:14px;border:2px solid #d4e3f8;border-radius:11px;font-size:18px}.funzone-input button:disabled,.funzone-submit:disabled{opacity:.45;cursor:not-allowed}.funzone-letters{color:#216be4;font-weight:900;font-size:26px;letter-spacing:4px;margin-top:20px;overflow-wrap:anywhere}.funzone-sentence{display:grid;gap:15px}.funzone-selected,.funzone-tokens{display:flex;flex-wrap:wrap;gap:9px;min-height:68px;align-items:center}.funzone-selected{border:2px dashed #d9e6f8;border-radius:12px;padding:10px}.funzone-selected button{background:#e0efff}.funzone-submit{justify-self:start}.funzone-feedback{background:#eaf4ff;border-radius:16px;padding:20px;margin-top:23px}.funzone-feedback strong{font-size:19px}.funzone-feedback p{line-height:1.7}.funzone-finish{text-align:center;padding:35px 10px}.funzone-finish svg{color:#d9a21b}.funzone-finish strong{display:block;color:#226ee5;font-size:58px}.funzone-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}.funzone-actions .secondary{background:#e8f0fc;color:#265c9f}.funzone-note{text-align:center;color:#7189a8;font-size:12px;margin-top:22px}@media(max-width:760px){.funzone-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.funzone-mascot{font-size:70px}}@media(max-width:520px){.funzone-grid,.funzone-options{grid-template-columns:1fr}.funzone-hero{padding:23px}.funzone-mascot{font-size:49px}.funzone-card p{min-height:0}.funzone-board{padding:17px}.funzone-memory{gap:6px}.funzone-memory button{min-height:65px;font-size:23px;padding:6px}.funzone-pairs button{font-size:13px;padding:9px}}
`}</style></main>;
}
