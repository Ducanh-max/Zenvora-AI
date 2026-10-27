"use client";
import Link from "next/link";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {legal,attacked,other,type Move} from "@/lib/chess-engine";
import {newMatch,chargeClock,playMove,resultMessage,type Match,type Difficulty} from "@/lib/chess-match";
import {explainResult,replayPositions} from "@/lib/chess-review";
import {createChessAudio,chessCue} from "@/lib/chess-audio";
import "./chess.css";
import ChessGameInfo from "./game-info";
import {locateChessPieces} from "@/lib/chess-pieces";
import {scheduleChessEnding,type EndingPhase} from "@/lib/chess-ending";
import KingExplosion from "./king-explosion";
const pieceNames:Record<string,string>={k:"Vua",q:"Hậu",r:"Xe",b:"Tượng",n:"Mã",p:"Tốt"};
const pieceFiles:Record<string,string>={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"};
const pieceSrc=(p:string)=>"/chess/pieces/"+(p===p.toUpperCase()?"white":"black")+"-"+pieceFiles[p.toLowerCase()]+".png";
const square=(i:number)=>"abcdefgh"[i%8]+(8-Math.floor(i/8));
const levels:{id:Difficulty;name:string;elo:string;icon:string}[]=[{id:"easy",name:"Dễ",elo:"400–500",icon:"🌱"},{id:"medium",name:"Trung bình",elo:"700–800",icon:"⚔️"},{id:"hard",name:"Khó",elo:"1000+",icon:"🔥"},{id:"expert",name:"Siêu khó",elo:"1500+",icon:"👑"}];
type Saved="saved"|"guest"|"error"|null;
type Reply={match:Match;ticket:string;ranked:boolean;saved:Saved};
type Leader={user_id:string;display_name:string;wins:number};
export default function ChessPage(){
 const [stage,setStage]=useState<"menu"|"setup"|"play">("menu"),[mode,setMode]=useState<"ai"|"local">("ai"),[difficulty,setDifficulty]=useState<Difficulty>("easy");
 const [match,setMatch]=useState<Match>(()=>newMatch()),[selected,setSelected]=useState(-1),[promotion,setPromotion]=useState<Move[]|null>(null),[boardReady,setBoardReady]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState<Saved>(null),[ranked,setRanked]=useState(false),[leaders,setLeaders]=useState<Leader[]>([]);
 const [showExit,setShowExit]=useState(false);
 const [reviewing,setReviewing]=useState(false),[reviewPly,setReviewPly]=useState(0);
 const [endingPhase,setEndingPhase]=useState<EndingPhase>("idle");
 const replayTitleRef=useRef<HTMLHeadingElement|null>(null);
 const audioRef=useRef<ReturnType<typeof createChessAudio>|null>(null),previousSoundMatch=useRef<Match|null>(null);
 const unlockSound=()=>{audioRef.current??=createChessAudio();audioRef.current.unlock();};
 useEffect(()=>()=>{audioRef.current?.dispose();audioRef.current=null;},[]);
 const dialogRef=useRef<HTMLElement|null>(null);
 const ticket=useRef(""),inFlight=useRef(false),pending=useRef<Record<string,unknown>|null>(null),requestId=useRef(0),requestAbort=useRef<AbortController|null>(null);
 useEffect(()=>()=>{requestId.current++;requestAbort.current?.abort();},[]);
 const position=match.position,moves=useMemo(()=>legal(position),[position]);
 const king=position.board.indexOf(position.turn==="w"?"K":"k"),check=attacked(position,king,other(position.turn));
 const finished=!!match.result;
 useEffect(()=>{if(stage!=="play"){previousSoundMatch.current=null;return;}const previous=previousSoundMatch.current;previousSoundMatch.current=match;if(previous){const cue=chessCue(previous,match.result?{...match,result:null}:match,mode==="ai"?"w":undefined);if(cue)audioRef.current?.play(cue);}},[stage,match,mode]);
 const endWinner=match.result?.winner,endReason=match.result?.reason;
 useEffect(()=>{
  if(stage!=="play"||!endReason){setEndingPhase("idle");return;}
  return scheduleChessEnding({winner:endWinner??null,reason:endReason},mode==="ai"?"w":undefined,setEndingPhase,cue=>audioRef.current?.play(cue));
 },[stage,endReason,endWinner,mode]);
 useEffect(()=>{if(reviewing&&finished)replayTitleRef.current?.focus();},[reviewing,finished]);
 const review=useMemo(()=>explainResult(match),[match]);
 const replay=useMemo(()=>finished?replayPositions(position.history):[],[finished,position.history]);
 const boardPosition=finished&&reviewing?(replay[Math.min(reviewPly,replay.length-1)]||position):position;
 const defeatedKing=finished&&!reviewing&&endWinner?position.board.indexOf(endWinner==="w"?"k":"K"):-1;
 const endingBusy=finished&&endingPhase!=="done";
 const boardPieces=useMemo(()=>locateChessPieces(boardPosition),[boardPosition]);
 const boardKing=boardPosition.board.indexOf(boardPosition.turn==="w"?"K":"k"),boardCheck=attacked(boardPosition,boardKing,other(boardPosition.turn));
 const request=useCallback(async(body:Record<string,unknown>)=>{
  if(inFlight.current)return;inFlight.current=true;setBusy(true);setError("");pending.current=body;const id=++requestId.current,controller=new AbortController();requestAbort.current=controller;const timeout=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch("/api/chess/bot",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify(body)});const data=await response.json() as Reply&{error?:string};if(!response.ok)throw Error(data.error||"Không thể kết nối trận đấu.");if(id!==requestId.current)return;
   ticket.current=data.ticket;setMatch({...data.match,turnStarted:Date.now()});setRanked(data.ranked);setSaved(data.saved);setSelected(-1);setPromotion(null);pending.current=null;setStage("play");
  }catch(e){if(id===requestId.current)setError(e instanceof Error&&e.name!=="AbortError"?e.message:"Kết nối chậm. Hãy thử lại.");}
  finally{clearTimeout(timeout);if(id===requestId.current){requestAbort.current=null;inFlight.current=false;setBusy(false);}}
 },[]);
 useEffect(()=>{if(stage==="play")return;let active=true;void fetch("/api/chess/bot",{cache:"no-store"}).then(r=>r.json()).then(data=>{if(active&&Array.isArray(data.leaders))setLeaders(data.leaders);}).catch(()=>{});return()=>{active=false;};},[stage]);
 useEffect(()=>{
  if(stage!=="play"||finished||busy||error)return;
  const remaining=match.clocks[position.turn]-Math.max(0,Date.now()-match.turnStarted);
  const timer=window.setTimeout(()=>{const timed=chargeClock(match);if(!timed.result)return;if(mode==="ai")void request({action:"timeout",ticket:ticket.current});else{setMatch(timed);setPromotion(null);setSelected(-1);}},Math.max(100,remaining+20));
  return()=>window.clearTimeout(timer);
 },[stage,match,mode,finished,busy,error,request]);
 useEffect(()=>{
  if(!promotion&&!error&&!showExit)return;
  const dialog=dialogRef.current;if(!dialog)return;const previous=document.activeElement as HTMLElement|null;
  const controls=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]'));
  controls()[0]?.focus();
  const trap=(event:KeyboardEvent)=>{if(event.key!=="Tab")return;const items=controls();if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};
  dialog.addEventListener("keydown",trap);return()=>{dialog.removeEventListener("keydown",trap);if(previous?.isConnected)previous.focus();};
 },[finished,reviewing,promotion,error,showExit]);
 function leaveGame(target:"menu"|"setup"="setup"){
  // Ignore a late bot response after leaving so it cannot reopen the old game.
  requestId.current++;requestAbort.current?.abort();requestAbort.current=null;inFlight.current=false;pending.current=null;ticket.current="";
  setBusy(false);setError("");setShowExit(false);setPromotion(null);setSelected(-1);setReviewing(false);setMatch(newMatch());setStage(target);
  audioRef.current?.dispose();audioRef.current=null;
 }
 function goBack(){if(match.position.history.length===0||finished)leaveGame();else setShowExit(true);}
 function begin(){setEndingPhase("idle");setShowExit(false);unlockSound();setReviewing(false);setReviewPly(0);setError("");setSaved(null);setSelected(-1);setPromotion(null);if(mode==="ai")void request({action:"start",difficulty});else{setMatch(newMatch());setStage("play");}}
 function commit(move:Move){if(finished||inFlight.current)return;unlockSound();setSelected(-1);setPromotion(null);if(mode==="local"){setMatch(playMove(match,move));return;}
  // Show the human move immediately; only the server decides the bot move and result.
  const optimistic=playMove(match,move);setMatch({...optimistic,result:null});void request({action:"move",ticket:ticket.current,from:move.from,to:move.to,promotion:move.promotion});
 }
 function click(i:number){if(finished||busy||error||promotion||(mode==="ai"&&position.turn==="b"))return;if(i===selected){setSelected(-1);return;}const found=moves.filter(m=>m.from===selected&&m.to===i);if(found.length>1){setPromotion(found);return;}if(found.length===1){commit(found[0]);return;}const p=position.board[i];setSelected(p!=="."&&(position.turn==="w"?p===p.toUpperCase():p===p.toLowerCase())?i:-1);}
 const endingControls=<>{finished&&!reviewing&&<section className="ch-end-dock" aria-label="Kết thúc ván đấu">
 <h2 id="result-title" role="status">{endingPhase==="idle"||endingPhase==="landing"?"Nước cuối đang hoàn tất…":!endWinner?"Hòa cờ!":mode==="ai"?(endWinner==="w"?"Bạn thắng!":"Bạn thua!"):(endWinner==="w"?"Trắng thắng!":"Đen thắng!")}</h2>
 {match.result!.reason==="timeout"&&<p>Đã hết thời gian thi đấu.</p>}
 {mode==="ai"&&endWinner==="w"&&<p role="status">{saved==="saved"?"🏆 Đã tự động lưu chiến thắng lên bảng xếp hạng.":saved==="error"?"Chưa lưu được chiến thắng. Hãy thử lại.":!ranked?"Đăng nhập trước ván tiếp theo để được ghi nhận chiến thắng.":"Đang lưu chiến thắng…"}</p>}
 {saved==="error"&&<button disabled={busy} onClick={()=>void request({action:"save",ticket:ticket.current})}>Thử lưu lại</button>}
 <div className="ch-end-actions"><button disabled={endingBusy} onClick={()=>{setSelected(-1);setReviewPly(replay.length-1);setReviewing(true);}}>Xem lại bàn cờ</button><button disabled={busy||endingBusy} onClick={begin}>Bắt đầu lại ván đấu</button><button disabled={busy||endingBusy} onClick={()=>leaveGame()}>Chọn cấp độ</button></div>
 {review&&!(mode==="ai"&&endWinner==="b")&&<details className="ch-end-details"><summary>Chi tiết ván đấu</summary><section className="ch-review" aria-labelledby="review-title"><h2 id="review-title">{!endWinner?"Vì sao hòa cờ?":mode==="ai"?"Vì sao bạn thắng?":"Vì sao "+(endWinner==="w"?"Trắng":"Đen")+" thắng?"}</h2><p>{review.summary}</p>{review.lastMove&&<p><strong>Nước đi gần nhất:</strong> {review.lastMove}</p>}<ul>{review.facts.map((fact,i)=><li key={i}>{fact}</li>)}</ul><p>{review.tip}</p></section></details>}
 </section>}</>;
 const board=<div className={"ch-board-art"+(boardReady?" ch-board-art-ready":"")}><img className="ch-board-artwork" src="/chess/boards/royal-board.png?v=6cfb8926" alt="" aria-hidden="true" draggable={false} onLoad={()=>setBoardReady(true)} onError={()=>setBoardReady(false)}/><div className="ch-board" role="grid" aria-label="Bàn cờ vua" aria-busy={busy}>{boardPosition.board.map((p,i)=><button key={i} type="button" role="gridcell" aria-label={square(i)+" "+(p==="."?"trống":pieceNames[p.toLowerCase()]+(p===p.toUpperCase()?" Trắng":" Đen"))+(boardCheck&&i===boardKing?" đang bị chiếu":"")} onClick={()=>click(i)} className={((Math.floor(i/8)+i%8)%2===0?"ch-light":"ch-dark")+(selected===i?" ch-selected":"")+(selected>=0&&moves.some(m=>m.from===selected&&m.to===i)?" ch-target":"")+(boardCheck&&i===boardKing?" ch-check":"")}>
 {i%8===0&&<small className="ch-rank">{8-Math.floor(i/8)}</small>}{Math.floor(i/8)===7&&<small className="ch-file">{"abcdefgh"[i%8]}</small>}</button>)}<div className="ch-piece-layer" aria-hidden="true">{boardPieces.map(({id,piece,square:i})=><span key={id} data-piece-id={id} className={"ch-moving-piece"+(boardCheck&&i===boardKing?" ch-checked-piece":"")+(i===defeatedKing&&endingPhase==="burst"?" ch-king-exploding":"")+(i===defeatedKing&&endingPhase==="done"?" ch-king-gone":"")} style={{transform:`translate(${(i%8)*100}%,${Math.floor(i/8)*100}%)`}}><img src={pieceSrc(piece)} alt="" draggable={false} className="ch-piece-image"/>{i===defeatedKing&&endingPhase==="burst"&&<KingExplosion/>}</span>)}</div></div></div>;
 return <main className={"ch-page"+(stage==="play"?" ch-playing":"")}>
 {stage!=="play"?<div className="ch-lobby"><Link className="ch-back" href="/learn/fun">← Góc giải trí</Link><header><span>AUNORA · CHESS ARENA</span><h1>Đấu trường Cờ Vua</h1><p>Chọn thử thách. Tập trung vào từng nước cờ.</p></header>
 {stage==="menu"?<section className="ch-card"><h2>Chọn chế độ</h2><div className="ch-modes"><button onClick={()=>{setMode("ai");setStage("setup");}}>🐺 <strong>Đấu với Aivanta</strong><span>4 cấp độ · 20 phút mỗi bên</span></button><button onClick={()=>{setMode("local");setStage("setup");}}>👥 <strong>Hai người cùng máy</strong><span>20 phút mỗi bên</span></button><Link href="/learn/fun/chess/rooms">🌐 <strong>Đấu với bạn bè</strong><span>Tạo hoặc tham gia phòng</span></Link></div></section>:<section className="ch-card"><button className="ch-back-button" onClick={()=>leaveGame("menu")}>← Chọn chế độ</button><h2>{mode==="ai"?"Chọn cấp độ Aivanta":"Hai người cùng máy"}</h2>{mode==="ai"&&<><div className="ch-levels" role="group" aria-label="Cấp độ bot">{levels.map(level=><button key={level.id} disabled={busy} aria-pressed={difficulty===level.id} className={difficulty===level.id?"active":""} onClick={()=>setDifficulty(level.id)}><span>{level.icon}</span><strong>{level.name}</strong><small>Elo mục tiêu {level.elo}</small></button>)}</div><p className="ch-subtle">Bạn cầm quân Trắng. Elo là mức mục tiêu, chưa được hiệu chuẩn bằng thi đấu xếp hạng.</p></>}
 <p className="ch-time">⏱ 20 phút mỗi bên</p><p>Đồng hồ bắt đầu khi bạn bấm nút bên dưới. Trong ván hiển thị bàn cờ, lượt đi và lịch sử nước đi.</p>{mode==="ai"&&<p className="ch-subtle">Đăng nhập trước khi chơi để tự lưu trận thắng vào bảng xếp hạng.</p>}<button className="ch-primary" disabled={busy} onClick={begin}>{busy?"Đang chuẩn bị…":"▶ Bắt đầu chơi"}</button>{error&&<p role="alert" className="ch-error">{error}</p>}</section>}
 <section className="ch-card"><h2>🏆 Bảng xếp hạng Cờ Vua</h2><p className="ch-subtle">Tổng số trận thắng khi đấu Aivanta và đấu trực tuyến.</p>{leaders.length?<ol className="ch-leaders">{leaders.map(player=><li key={player.user_id}><span>{player.display_name}</span><strong>{player.wins} thắng</strong></li>)}</ol>:<p>Chưa có dữ liệu xếp hạng.</p>}</section></div>:<>
 <header className="ch-play-header"><button type="button" className="ch-game-back" onClick={goBack}>← Quay lại</button></header>
 <div className="ch-game-layout"><section className={"ch-arena"+(finished&&reviewing?" ch-arena-review":"")}>{board}</section><div className="ch-game-sidebar">{endingControls}<ChessGameInfo position={boardPosition} finished={finished} reviewing={reviewing} thinking={busy&&stage==="play"&&mode==="ai"&&!finished} playerSide={mode==="ai"?"w":null}/></div></div>
 {finished&&reviewing&&<section className="ch-replay" aria-label="Xem lại ván đấu"><h2 ref={replayTitleRef} tabIndex={-1}>Xem lại bàn cờ</h2><p aria-live="polite">{reviewPly===0?"Thế cờ ban đầu":reviewPly===replay.length-1?"Thế cờ cuối ván":"Sau nước đi "+reviewPly} · {reviewPly} / {replay.length-1}{reviewPly>0?" · "+position.history[reviewPly-1]:""}</p><div className="ch-replay-controls"><button aria-label="Về đầu ván" disabled={reviewPly===0} onClick={()=>setReviewPly(0)}>⏮</button><button aria-label="Nước trước" disabled={reviewPly===0} onClick={()=>setReviewPly(n=>Math.max(0,n-1))}>←</button><button aria-label="Nước tiếp theo" disabled={reviewPly>=replay.length-1} onClick={()=>setReviewPly(n=>Math.min(replay.length-1,n+1))}>→</button><button aria-label="Về cuối ván" disabled={reviewPly>=replay.length-1} onClick={()=>setReviewPly(replay.length-1)}>⏭</button><button onClick={()=>setReviewing(false)}>Kết thúc xem lại</button></div></section>}<p className="ch-sr" aria-live="polite">{finished?(endingPhase==="idle"||endingPhase==="landing"?"Nước cuối đang hoàn tất":resultMessage(match.result!)):check?`Vua ${position.turn==="w"?"Trắng":"Đen"} bị chiếu`:busy?"Aivanta đang suy nghĩ":`Lượt ${position.turn==="w"?"Trắng":"Đen"}`}</p>
 {showExit&&!finished&&!error&&<div className="ch-overlay"><section ref={dialogRef} className="ch-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-title"><h2 id="exit-title">Bạn có chắc muốn dừng trận đấu lại không?</h2><div className="ch-result-actions"><button className="ch-primary" onClick={()=>setShowExit(false)}>Tiếp tục chơi</button><button onClick={()=>leaveGame()}>Thoát</button></div></section></div>}
 {promotion&&!finished&&<div className="ch-overlay"><section ref={dialogRef} className="ch-dialog" role="dialog" aria-modal="true" aria-labelledby="promotion-title"><h2 id="promotion-title">Phong cấp quân Tốt</h2><div className="ch-promotions">{promotion.map(move=><button key={move.promotion} onClick={()=>commit(move)} aria-label={"Phong cấp thành "+pieceNames[move.promotion!]}><img src={pieceSrc(position.turn==="w"?move.promotion!.toUpperCase():move.promotion!)} alt=""/>{pieceNames[move.promotion!]}</button>)}</div><button onClick={()=>setPromotion(null)}>Hủy chọn</button></section></div>}
 {error&&<div className="ch-overlay"><section ref={dialogRef} className="ch-dialog" role="alertdialog" aria-modal="true" aria-labelledby="connection-title"><h2 id="connection-title">Kết nối bị gián đoạn</h2><p>{error}</p><button className="ch-primary" disabled={busy} onClick={()=>{if(pending.current)void request(pending.current);}}>Thử lại</button><button onClick={()=>{setError("");setStage("setup");}}>Chọn cấp độ</button></section></div>}
 </>}
 </main>;
}