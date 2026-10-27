"use client";
import {memo,useDeferredValue,useEffect,useMemo,useRef} from "react";
import {type Position} from "@/lib/chess-engine";
import {describeChessHistory,chessPieceNames,chessPieceSrc} from "@/lib/chess-history";
type Props={position:Position;finished?:boolean;thinking?:boolean;playerSide?:"w"|"b"|null;reviewing?:boolean};
function ChessGameInfo({position,finished=false,thinking=false,playerSide,reviewing=false}:Props){
 const history=useDeferredValue(position.history);
 const {records,captured}=useMemo(()=>describeChessHistory(history),[history]);
 const endRef=useRef<HTMLTableRowElement|null>(null);
 useEffect(()=>{const row=endRef.current,container=row?.closest(".ch-move-scroll");if(row&&container)container.scrollTop=container.scrollHeight;},[records.length]);
 const side=position.turn==="w"?"Trắng":"Đen";
 const status=reviewing?"Đang xem lại · lượt "+side:finished?"Ván đấu đã kết thúc":thinking?"Lượt Đen · Aivanta đang suy nghĩ…":"Lượt "+side+(playerSide?(position.turn===playerSide?" · Đến lượt bạn":" · Đợi đối thủ"):"");
 return <aside className="ch-game-info" aria-label="Thông tin ván cờ">
 <p className={"ch-turn ch-turn-"+position.turn} role="status"><span aria-hidden="true">{position.turn==="w"?"⚪":"⚫"}</span> {status}</p>
 <section className="ch-captures" aria-label="Quân đã ăn">{(["w","b"] as const).map(color=><div key={color}><h2>{color==="w"?"Trắng":"Đen"} đã ăn</h2><div className="ch-captured-pieces">{captured[color].length?captured[color].map((p,i)=><img key={i} src={chessPieceSrc(p)} alt={chessPieceNames[p.toLowerCase()]+(p===p.toUpperCase()?" Trắng":" Đen")} draggable={false}/>):<span className="ch-empty">Chưa ăn quân nào</span>}</div></div>)}</section>
 <section className="ch-move-history"><h2>Lịch sử nước đi</h2><div className="ch-move-scroll" tabIndex={0} aria-label="Danh sách nước đi"><table><thead><tr><th scope="col">Nước</th><th scope="col">Trắng</th><th scope="col">Đen</th></tr></thead><tbody>{Array.from({length:Math.ceil(records.length/2)},(_,i)=><tr key={i} ref={i===Math.ceil(records.length/2)-1?endRef:undefined}><th scope="row">{i+1}.</th>{[i*2,i*2+1].map(ply=><td key={ply} title={records[ply]?.description} className={ply===records.length-1?"ch-latest-move":""}>{records[ply]?<span aria-label={records[ply].description}>{records[ply].notation}</span>:"—"}</td>)}</tr>)}</tbody></table>{!records.length&&<p className="ch-empty">Chưa có nước đi</p>}</div></section>
 </aside>;
}

export default memo(ChessGameInfo);