"use client";
import {useEffect,useRef,useState} from "react";
type Word={word:string;meaning:string};
export default function MatchPairs({words,onChange,locked}:{words:Word[];onChange:(complete:boolean,allCorrect:boolean)=>void;locked:boolean}){
 const pairs=words.slice(0,4);
 const [selected,setSelected]=useState<number|null>(null);
 const [solved,setSolved]=useState<number[]>([]);
 const [wrong,setWrong]=useState<{left:number;right:number}|null>(null);
 const [message,setMessage]=useState("Chọn một từ tiếng Anh rồi chọn nghĩa tiếng Việt.");
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const signature=pairs.map(w=>w.word+"|"+w.meaning).join("~");
 useEffect(()=>{setSelected(null);setSolved([]);setWrong(null);setMessage("Chọn một từ tiếng Anh rồi chọn nghĩa tiếng Việt.");onChange(false,false);return()=>{if(timer.current)clearTimeout(timer.current)};},[signature]);
 function chooseRight(i:number){
  if(locked||selected===null||wrong||solved.includes(i))return;
  if(selected===i){
   const next=[...solved,i];setSolved(next);setSelected(null);setMessage("✅ Chính xác!");onChange(next.length===pairs.length,next.length===pairs.length);
   try{const ctx=new AudioContext();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=750;gain.gain.value=.07;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.12);setTimeout(()=>void ctx.close(),350)}catch{}
  }else{
   setWrong({left:selected,right:i});setMessage("❌ Chưa đúng, thử lại nhé!");
   try{const ctx=new AudioContext();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=240;gain.gain.value=.07;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.2);setTimeout(()=>void ctx.close(),400)}catch{}
   timer.current=setTimeout(()=>{setWrong(null);setSelected(null);setMessage("Thử ghép lại cặp vừa rồi nhé!");},700);
  }
 }
 return <div className="adv-match adv-match-tap">
  <p className="adv-help">Chạm vào hai thẻ tương ứng. Đúng sẽ chuyển xanh; sai chuyển đỏ rồi tự cho thử lại.</p>
  <div className="adv-match-board">
   <div className="adv-match-col"><h3>🇬🇧 Tiếng Anh</h3>{pairs.map((p,i)=><button key={i} type="button" disabled={locked||solved.includes(i)||Boolean(wrong)} className={solved.includes(i)?"is-correct":wrong?.left===i?"is-wrong":selected===i?"is-selected":""} onClick={()=>setSelected(i)}>{p.word}{solved.includes(i)?" ✓":""}</button>)}</div>
   <div className="adv-match-col"><h3>🇻🇳 Tiếng Việt</h3>{pairs.map((_,position)=>pairs.length-1-position).map(i=><button key={i} type="button" disabled={locked||solved.includes(i)||Boolean(wrong)} className={solved.includes(i)?"is-correct":wrong?.right===i?"is-wrong":""} onClick={()=>chooseRight(i)}>{pairs[i].meaning}{solved.includes(i)?" ✓":""}</button>)}</div>
  </div>
  <p role="status" aria-live="polite" className="adv-match-status">{message}</p>
  <p className="adv-match-count">Đúng {solved.length}/{pairs.length} cặp</p>
 </div>;
}
