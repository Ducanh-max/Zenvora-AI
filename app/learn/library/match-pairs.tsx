"use client";
import {useEffect,useLayoutEffect,useRef,useState} from "react";
type Word={word:string;meaning:string};
type Pair={left:number;right:number;correct:boolean};
export default function MatchPairs({words,onChange,locked}:{words:Word[];onChange:(complete:boolean,allCorrect:boolean)=>void;locked:boolean}){
 const pairs=words.slice(0,4);
 const rightOrder=pairs.map((_,i)=>i).reverse();
 const [selected,setSelected]=useState<number|null>(null);
 const [connections,setConnections]=useState<Pair[]>([]);
 const [message,setMessage]=useState("");
 const board=useRef<HTMLDivElement>(null);
 const leftRefs=useRef<(HTMLButtonElement|null)[]>([]);
 const rightRefs=useRef<(HTMLButtonElement|null)[]>([]);
 const [lines,setLines]=useState<{x1:number;y1:number;x2:number;y2:number;correct:boolean}[]>([]);
 const [size,setSize]=useState({width:0,height:0});
 useEffect(()=>{setSelected(null);setConnections([]);setMessage("");onChange(false,false);},[words.map(w=>w.word+"|"+w.meaning).join("~")]);
 useLayoutEffect(()=>{
  const update=()=>{const rect=board.current?.getBoundingClientRect();if(!rect)return;setSize({width:rect.width,height:rect.height});setLines(connections.flatMap(p=>{const l=leftRefs.current[p.left]?.getBoundingClientRect(),r=rightRefs.current[p.right]?.getBoundingClientRect();return l&&r?[{x1:l.right-rect.left,y1:l.top+l.height/2-rect.top,x2:r.left-rect.left,y2:r.top+r.height/2-rect.top,correct:p.correct}]:[];}));};
  update();const obs=new ResizeObserver(update);if(board.current)obs.observe(board.current);window.addEventListener("resize",update);return()=>{obs.disconnect();window.removeEventListener("resize",update);};
 },[connections,words]);
 const leftUsed=(i:number)=>connections.some(p=>p.left===i);
 const rightUsed=(i:number)=>connections.some(p=>p.right===i);
 function chooseRight(i:number){if(locked||selected===null||rightUsed(i))return;const ok=selected===i;const next=[...connections,{left:selected,right:i,correct:ok}];setConnections(next);setSelected(null);setMessage(ok?"✅ Chính xác! Hai từ có cùng nghĩa.":"❌ Chưa đúng! Đường nối màu đỏ. Bạn có thể sửa bằng cách nhấn vào từ đã nối.");onChange(next.length===pairs.length,next.length===pairs.length&&next.every(p=>p.correct));}
 function remove(side:"left"|"right",index:number){if(locked)return;const filtered=connections.filter(p=>side==="left"?p.left!==index:p.right!==index);setConnections(filtered);setSelected(side==="left"?index:null);setMessage("Đã gỡ đường nối. Hãy thử ghép lại nhé!");onChange(false,false);}
 return <div className="adv-match">
 <p className="adv-help">Chọn từ ở cột tiếng Anh, rồi chọn nghĩa ở cột tiếng Việt. <strong>Đường xanh = đúng, đường đỏ = sai.</strong> Nhấn vào từ đã nối để sửa.</p>
 <div className="adv-match-board" ref={board}>
 <svg className="adv-match-lines" viewBox={`0 0 ${Math.max(size.width,1)} ${Math.max(size.height,1)}`} preserveAspectRatio="none" aria-hidden="true">{lines.map((p,i)=><g key={i}><line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.correct?"#19b970":"#ed525b"} strokeWidth="5" strokeLinecap="round"/><circle cx={p.x1} cy={p.y1} r="5" fill={p.correct?"#19b970":"#ed525b"}/><circle cx={p.x2} cy={p.y2} r="5" fill={p.correct?"#19b970":"#ed525b"}/></g>)}</svg>
 <div className="adv-match-col"><h3>🇬🇧 Tiếng Anh</h3>{pairs.map((p,i)=>{const connection=connections.find(c=>c.left===i);return <button ref={el=>{leftRefs.current[i]=el;}} key={i} type="button" disabled={locked} className={connection?(connection.correct?"is-correct":"is-wrong"):selected===i?"is-selected":""} onClick={()=>connection?remove("left",i):setSelected(i)}>{p.word}</button>;})}</div>
 <div className="adv-match-col"><h3>🇻🇳 Tiếng Việt</h3>{rightOrder.map(i=>{const connection=connections.find(c=>c.right===i);return <button ref={el=>{rightRefs.current[i]=el;}} key={i} type="button" disabled={locked} className={connection?(connection.correct?"is-correct":"is-wrong"):""} onClick={()=>connection?remove("right",i):chooseRight(i)}>{pairs[i].meaning}</button>;})}</div>
 </div>
 <p role="status" className="adv-match-status">{message||"Nối đủ các cặp, sau đó nhấn Kiểm tra."}</p>
 <p className="adv-match-count">Đã nối {connections.length}/{pairs.length} cặp · Đúng {connections.filter(c=>c.correct).length}/{pairs.length}</p>
 </div>;
}
