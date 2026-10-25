"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
type Side="w"|"b";
type Position={board:string[];turn:Side;castle:string;ep:number;history:string[]};
type Move={from:number;to:number;promotion?:string;castle?:boolean;ep?:boolean};
const symbols:Record<string,string>={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
const initial="rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR";
const start=():Position=>({board:initial.split(""),turn:"w",castle:"KQkq",ep:-1,history:[]});
const color=(p:string):Side|null=>p==="."?null:p===p.toUpperCase()?"w":"b";
const other=(c:Side):Side=>c==="w"?"b":"w";
const inside=(r:number,c:number)=>r>=0&&r<8&&c>=0&&c<8;
const square=(i:number)=>"abcdefgh"[i%8]+(8-Math.floor(i/8));
function attacked(s:Position,i:number,by:Side){
 const b=s.board,r=Math.floor(i/8),c=i%8;
 for(const dc of [-1,1]){const pr=r+(by==="w"?1:-1),pc=c+dc;if(inside(pr,pc)&&b[pr*8+pc]===(by==="w"?"P":"p"))return true;}
 for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){const nr=r+dr,nc=c+dc;if(inside(nr,nc)&&b[nr*8+nc]===(by==="w"?"N":"n"))return true;}
 for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]){
  let nr=r+dr,nc=c+dc,d=1;
  while(inside(nr,nc)){const p=b[nr*8+nc];if(p!=="."){if(color(p)===by){const t=p.toLowerCase();if((d===1&&t==="k")||((dr===0||dc===0)&&(t==="r"||t==="q"))||((dr!==0&&dc!==0)&&(t==="b"||t==="q")))return true;}break;}nr+=dr;nc+=dc;d++;}
 }
 return false;
}
function execute(s:Position,m:Move):Position{
 const b=[...s.board],p=b[m.from],target=b[m.to];b[m.from]=".";b[m.to]=m.promotion?(s.turn==="w"?m.promotion.toUpperCase():m.promotion):p;
 if(m.ep)b[m.to+(s.turn==="w"?8:-8)]=".";
 if(m.castle){const rookFrom=m.to>m.from?m.from+3:m.from-4,rookTo=m.to>m.from?m.from+1:m.from-1;b[rookTo]=b[rookFrom];b[rookFrom]=".";}
 let castle=s.castle;
 if(p==="K")castle=castle.replace(/[KQ]/g,"");
 if(p==="k")castle=castle.replace(/[kq]/g,"");
 for(const [idx,right] of [[63,"K"],[56,"Q"],[7,"k"],[0,"q"]] as [number,string][])if(m.from===idx||m.to===idx)castle=castle.replace(right,"");
 const ep=p.toLowerCase()==="p"&&Math.abs(m.to-m.from)===16?(m.from+m.to)/2:-1;
 return {board:b,turn:other(s.turn),castle,ep,history:[...s.history,square(m.from)+"–"+square(m.to)+(m.promotion?"="+m.promotion.toUpperCase():"")]};
}
function legal(s:Position):Move[]{
 const b=s.board,out:Move[]=[],turn=s.turn,opp=other(turn);
 const add=(from:number,to:number,extra:Partial<Move>={})=>{if(b[to].toLowerCase()==="k")return;if(b[from].toLowerCase()==="p"&&(to<8||to>=56)){for(const promotion of ["q","r","b","n"])out.push({from,to,...extra,promotion});}else out.push({from,to,...extra});};
 for(let i=0;i<64;i++){const p=b[i];if(color(p)!==turn)continue;const r=Math.floor(i/8),c=i%8,t=p.toLowerCase();
  if(t==="p"){const d=turn==="w"?-1:1,nr=r+d;if(inside(nr,c)){const to=nr*8+c;if(b[to]==="."){add(i,to);if(r===(turn==="w"?6:1)&&b[(r+2*d)*8+c]===".")add(i,(r+2*d)*8+c);}for(const dc of [-1,1]){const nc=c+dc;if(!inside(nr,nc))continue;const dest=nr*8+nc;if(color(b[dest])===opp)add(i,dest);else if(dest===s.ep&&b[dest]===".")add(i,dest,{ep:true});}}}
  else if(t==="n"){for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){const nr=r+dr,nc=c+dc;if(inside(nr,nc)&&color(b[nr*8+nc])!==turn)add(i,nr*8+nc);}}
  else{const dirs=t==="b"?[[-1,-1],[-1,1],[1,-1],[1,1]]:t==="r"?[[-1,0],[1,0],[0,-1],[0,1]]:[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
   for(const [dr,dc] of dirs){let nr=r+dr,nc=c+dc;while(inside(nr,nc)){const to=nr*8+nc;if(color(b[to])===turn)break;add(i,to);if(b[to]!=="."||t==="k")break;nr+=dr;nc+=dc;}}
   if(t==="k"&&!attacked(s,i,opp)){const rights=turn==="w"?[["K",63,61,62],["Q",56,59,58]]:[["k",7,5,6],["q",0,3,2]];for(const [right,rook,mid,dest] of rights as [string,number,number,number][])if(s.castle.includes(right)&&b[rook]===(turn==="w"?"R":"r")&&b[mid]==="."&&b[dest]==="."&&(dest>i||b[i-3]===".")&&!attacked(s,mid,opp)&&!attacked(s,dest,opp))add(i,dest,{castle:true});}
  }
 }
 return out.filter(m=>{const next=execute(s,m),king=next.board.indexOf(turn==="w"?"K":"k");return king>=0&&!attacked(next,king,opp);});
}
const values:Record<string,number>={p:100,n:315,b:330,r:500,q:900,k:20000};
function evaluate(s:Position){let score=0;for(let i=0;i<64;i++){const p=s.board[i];if(p===".")continue;const sign=color(p)==="b"?1:-1;const center=3.5-Math.abs(i%8-3.5)+3.5-Math.abs(Math.floor(i/8)-3.5);score+=sign*(values[p.toLowerCase()]+center*(p.toLowerCase()==="p"?3:5));}return score;}
function search(s:Position,depth:number,alpha:number,beta:number):number{
 const moves=legal(s);if(!moves.length)return attacked(s,s.board.indexOf(s.turn==="w"?"K":"k"),other(s.turn))?(s.turn==="b"?-100000-depth:100000+depth):0;
 if(depth===0)return quiesce(s,alpha,beta,3);
 const ordered=moves.sort((a,b)=>((s.board[b.to]==="."?0:values[s.board[b.to].toLowerCase()])-(s.board[a.to]==="."?0:values[s.board[a.to].toLowerCase()])));
 if(s.turn==="b"){let best=-Infinity;for(const m of ordered){best=Math.max(best,search(execute(s,m),depth-1,alpha,beta));alpha=Math.max(alpha,best);if(alpha>=beta)break;}return best;}
 let best=Infinity;for(const m of ordered){best=Math.min(best,search(execute(s,m),depth-1,alpha,beta));beta=Math.min(beta,best);if(alpha>=beta)break;}return best;
}
function quiesce(s:Position,alpha:number,beta:number,depth:number):number{
 const moves=legal(s),king=s.board.indexOf(s.turn==="w"?"K":"k"),check=attacked(s,king,other(s.turn));
 if(!moves.length)return check?(s.turn==="b"?-100000:100000):0;
 const stand=evaluate(s);
 if(depth<=0)return stand;
 if(s.turn==="b"){let best=check?-Infinity:stand;if(best>=beta)return best;alpha=Math.max(alpha,best);for(const m of moves){if(!check&&s.board[m.to]==="."&&!m.promotion&&!m.ep)continue;best=Math.max(best,quiesce(execute(s,m),alpha,beta,depth-1));alpha=Math.max(alpha,best);if(alpha>=beta)break;}return best;}
 let best=check?Infinity:stand;if(best<=alpha)return best;beta=Math.min(beta,best);for(const m of moves){if(!check&&s.board[m.to]==="."&&!m.promotion&&!m.ep)continue;best=Math.min(best,quiesce(execute(s,m),alpha,beta,depth-1));beta=Math.min(beta,best);if(alpha>=beta)break;}return best;
}
function chooseAi(s:Position,difficulty:"easy"|"medium"|"hard"){
 const moves=legal(s);if(!moves.length)return null;
 const depth=difficulty==="hard"?4:difficulty==="medium"?3:2;
 const scored=moves.map(m=>({m,score:search(execute(s,m),depth-1,-Infinity,Infinity)})).sort((a,b)=>b.score-a.score);
 if(difficulty==="hard")return scored[0].m;
 const pool=scored.filter(x=>x.score>=scored[0].score-(difficulty==="easy"?200:65));
 return pool[Math.floor(Math.random()*Math.min(pool.length,difficulty==="easy"?8:3))].m;
}
export default function ChessPage(){
 const [game,setGame]=useState<Position>(start),[selected,setSelected]=useState(-1),[promotion,setPromotion]=useState<Move[]|null>(null),[difficulty,setDifficulty]=useState<"easy"|"medium"|"hard">("easy"),[mode,setMode]=useState<"ai"|"local">("ai");
 const moves=useMemo(()=>legal(game),[game]);const king=game.board.indexOf(game.turn==="w"?"K":"k");const check=king>=0&&attacked(game,king,other(game.turn));const finished=moves.length===0;
 const commit=(m:Move)=>{setGame(execute(game,m));setSelected(-1);setPromotion(null);};
 useEffect(()=>{if(mode!=="ai"||game.turn!=="b"||finished)return;const timer=window.setTimeout(()=>{const move=chooseAi(game,difficulty);if(move)setGame(execute(game,move));},350);return()=>window.clearTimeout(timer);},[game,mode,difficulty,finished]);
 const click=(i:number)=>{if(finished||promotion||(mode==="ai"&&game.turn==="b"))return;if(color(game.board[i])===game.turn){setSelected(selected===i?-1:i);return;}const found=moves.filter(m=>m.from===selected&&m.to===i);if(found.length>1)setPromotion(found);else if(found.length===1)commit(found[0]);};
 const reset=()=>{setGame(start());setSelected(-1);setPromotion(null);};

 return <main className="ch-page"><div className="ch-wrap"><Link className="ch-back" href="/learn/fun">← Trở về Góc giải trí</Link><div className="ch-head"><div><span>♟ AUNORA • CHESS ARENA</span><h1>Đấu trường Cờ Vua</h1><p>Đấu với Aivanta ở ba cấp độ hoặc chơi hai người tại chỗ. Không thể đi lại nước cờ.</p></div><img src="/brand/wolf-face/aivanta-face.png" alt="Aivanta"/></div><div className="ch-modes"><button className={mode==="ai"?"active":""} onClick={()=>{setMode("ai");reset();}}>🐺 Đấu với Aivanta</button><button className={mode==="local"?"active":""} onClick={()=>{setMode("local");reset();}}>👥 Hai người tại chỗ</button>{mode==="ai"&&<label>Độ khó: <select value={difficulty} onChange={e=>{setDifficulty(e.target.value as "easy"|"medium"|"hard");reset();}}><option value="easy">Dễ · mục tiêu 400–500 Elo</option><option value="medium">Trung bình · mục tiêu 700–800 Elo</option><option value="hard">Khó · mục tiêu 1000+ Elo</option></select></label>}</div><div className="ch-layout"><section className="ch-board-wrap"><div className="ch-board" role="grid" aria-label="Bàn cờ vua">{game.board.map((p,i)=><button key={i} type="button" role="gridcell" aria-label={square(i)+" "+(p==="."?"trống":p)} onClick={()=>click(i)} className={((Math.floor(i/8)+i%8)%2===0?"ch-light":"ch-dark")+(selected===i?" ch-selected":"")+(selected>=0&&moves.some(m=>m.from===selected&&m.to===i)?" ch-target":"")}><span className={"ch-piece "+(color(p)==="w"?"ch-white":"ch-black")}>{symbols[p]||""}</span>{i%8===0&&<small className="ch-rank">{8-Math.floor(i/8)}</small>}{Math.floor(i/8)===7&&<small className="ch-file">{"abcdefgh"[i%8]}</small>}</button>)}</div>{promotion&&<div className="ch-promo"><strong>Chọn quân phong cấp:</strong>{promotion.map(m=><button key={m.promotion} onClick={()=>commit(m)}>{symbols[game.turn==="w"?m.promotion!.toUpperCase():m.promotion!]}</button>)}</div>}</section><aside className="ch-panel"><h2>{finished?(check?"♚ Chiếu hết!":"🤝 Hòa cờ!"):check?"⚠️ Đang bị chiếu":game.turn==="w"?"⚪ Lượt quân Trắng":"⚫ Lượt quân Đen"}</h2><p>{finished?(check?(game.turn==="w"?"Đen":"Trắng")+" thắng!":"Không còn nước đi hợp lệ."):"Chọn một quân cờ, sau đó chọn ô được đánh dấu để di chuyển."}</p><div className="ch-actions"><button onClick={reset}>↻ Ván mới</button></div><h3>📜 Lịch sử nước đi</h3><div className="ch-history">{game.history.length?game.history.map((h,i)=><span key={i}>{i%2===0?Math.floor(i/2)+1+". ":""}{h}</span>):<p>Chưa có nước đi nào.</p>}</div><p className="ch-note">Elo là mức độ mục tiêu, chưa được hiệu chuẩn bằng các trận đấu xếp hạng. Phòng trực tuyến đang được phát triển.</p></aside></div></div><style>{`
.ch-modes{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:20px}.ch-modes button,.ch-modes select{padding:11px 15px;border:1px solid #b5c9e8;border-radius:12px;background:white;color:#183d79;font-weight:700}.ch-modes button.active{background:#2167d9;color:white}.ch-modes label{font-weight:700}.ch-page{min-height:100vh;background:linear-gradient(145deg,#edf5ff,#f9fbff 65%,#e9efff);padding:28px 16px;color:#14366a}.ch-wrap{max-width:1120px;margin:auto}.ch-back{display:inline-block;margin-bottom:22px;color:#3467a9;text-decoration:none;font-weight:800}.ch-head{background:linear-gradient(115deg,#102e72,#3179d7);color:white;border-radius:24px;padding:22px 30px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.ch-head span{font-size:12px;letter-spacing:2px;font-weight:800}.ch-head h1{font-size:clamp(26px,4vw,40px);margin:8px 0}.ch-head p{max-width:680px;line-height:1.6}.ch-head img{width:110px;height:110px;object-fit:contain}.ch-layout{display:grid;grid-template-columns:minmax(0,650px) minmax(240px,1fr);gap:24px}.ch-board-wrap{min-width:0}.ch-board{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));aspect-ratio:1;border:10px solid #173e83;border-radius:14px;overflow:hidden;box-shadow:0 15px 30px #173e8330}.ch-board button{position:relative;display:grid;place-items:center;border:0;padding:0;min-width:0;cursor:pointer;aspect-ratio:1}.ch-light{background:#e9f1ff}.ch-dark{background:#739bd3}.ch-board button.ch-selected{background:#f8cf6c}.ch-board button.ch-target:after{content:"";position:absolute;width:26%;height:26%;border-radius:50%;background:#2b9c60a8;pointer-events:none}.ch-board button span{font-family:"Segoe UI Symbol","DejaVu Sans",serif;font-size:clamp(24px,5vw,58px);line-height:1;z-index:1}.ch-piece{filter:drop-shadow(0 3px 2px #0a254a77);transition:transform .15s ease;font-weight:900}.ch-white{color:#fffdf0;-webkit-text-stroke:1.3px #223a5e;text-shadow:0 2px 0 #7e94af,0 3px 2px #102949}.ch-black{color:#182d50;-webkit-text-stroke:.8px #e6f2ff;text-shadow:0 2px 0 #07182d,0 3px 2px #07182d}.ch-board button:active .ch-piece{transform:scale(.92)}.ch-rank,.ch-file{position:absolute;font-size:10px;font-weight:900;color:#173e83}.ch-rank{top:2px;left:3px}.ch-file{bottom:2px;right:3px}.ch-panel{background:white;border:1px solid #dbe6fb;border-radius:22px;padding:24px;box-shadow:0 12px 30px #174a9012}.ch-panel h2{margin-top:0}.ch-panel p{line-height:1.6;color:#58749a}.ch-actions{display:flex;gap:10px}.ch-actions button,.ch-promo button{border:0;border-radius:12px;background:#246ce7;color:white;font-weight:800;padding:12px 16px;cursor:pointer}.ch-actions button:disabled{opacity:.4;cursor:not-allowed}.ch-history{display:flex;flex-wrap:wrap;gap:8px;max-height:240px;overflow:auto}.ch-history span{background:#eef4ff;border-radius:8px;padding:6px 9px;font-size:13px}.ch-note{font-size:12px;margin-top:24px}.ch-promo{margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.ch-promo button{font-size:25px}@media(max-width:790px){.ch-layout{grid-template-columns:1fr}.ch-head img{width:76px;height:76px}.ch-head{padding:18px}.ch-board{border-width:5px}.ch-board button span{font-size:clamp(24px,9vw,54px)}}
`}</style></main>;
}
