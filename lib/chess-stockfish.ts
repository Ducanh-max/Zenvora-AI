import {spawn} from "node:child_process";
import {join} from "node:path";
import {cwd,execPath} from "node:process";
import {legal,type Position,type Move} from "./chess-engine";
import type {Difficulty} from "./chess-match";

export const STOCKFISH_LIMITS={
 easy:{ms:80,depth:1,skill:0,elo:null},
 medium:{ms:120,depth:3,skill:2,elo:null},
 hard:{ms:220,depth:12,skill:20,elo:1320},
 expert:{ms:400,depth:16,skill:20,elo:1600}
} as const;
export function stockfishFen(position:Position){
 const ranks=Array.from({length:8},(_,r)=>{
  let text="",empty=0;
  for(const p of position.board.slice(r*8,r*8+8)){if(p===".")empty++;else{if(empty)text+=empty;empty=0;text+=p;}}
  return text+(empty||"");
 });
 const ep=position.ep>=0?"abcdefgh"[position.ep%8]+(8-Math.floor(position.ep/8)):"-";
 return ranks.join("/")+" "+position.turn+" "+(position.castle||"-")+" "+ep+" 0 "+(Math.floor(position.history.length/2)+1);
}
/** Run WASM in a separate Node process, never on the page or request's JS thread. */
export async function chooseStockfishMove(position:Position,difficulty:Difficulty,signal?:AbortSignal):Promise<Move|null>{
 const options=legal(position);if(!options.length)return null;
 const config=STOCKFISH_LIMITS[difficulty];
 if(!config)throw Error("Cấp độ không hợp lệ.");
 if(signal?.aborted)throw Error("Yêu cầu đã hủy.");
 return new Promise((resolve,reject)=>{
  const child=spawn(execPath,[join(cwd(),"vendor/stockfish/stockfish-19-lite-single.js")],{stdio:["pipe","pipe","pipe"],windowsHide:true});
  let done=false,buffer="",phase="uci";
  const timer=setTimeout(()=>finish(Error("Bot khởi động chậm. Vui lòng thử lại.")),4500);
  const abort=()=>finish(Error("Yêu cầu đã hủy."));
  function finish(error?:Error,move?:Move){
   if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener("abort",abort);child.kill();
   if(error)reject(error);else resolve(move||null);
  }
  function send(command:string){if(!done)child.stdin.write(command+"\n");}
  child.on("error",()=>finish(Error("Chưa khởi động được Stockfish. Vui lòng thử lại.")));
  child.stdin.on("error",()=>finish(Error("Kết nối bot bị gián đoạn.")));
  child.on("exit",()=>{if(!done)finish(Error("Bot đã ngắt kết nối. Vui lòng thử lại."));});
  // Drain stderr without retaining engine diagnostics or allocating an unbounded buffer.
  child.stderr.resume();
  child.stdout.setEncoding("utf8");
  child.stdout.on("data",(chunk:string)=>{
   buffer+=chunk;
   if(buffer.length>65536)return finish(Error("Phản hồi bot không hợp lệ."));
   let newline:number;
   while((newline=buffer.indexOf("\n"))>=0){
    const line=buffer.slice(0,newline).trim();buffer=buffer.slice(newline+1);
    if(line==="uciok"&&phase==="uci"){
     phase="ready";send("setoption name Hash value 16");send("setoption name Skill Level value "+config.skill);
     send("setoption name UCI_LimitStrength value "+(config.elo!==null));
     if(config.elo!==null)send("setoption name UCI_Elo value "+config.elo);
     send("isready");
    }else if(line==="readyok"&&phase==="ready"){
     phase="search";send("position fen "+stockfishFen(position));send("go depth "+config.depth+" movetime "+config.ms);
    }else if(line.startsWith("bestmove ")&&phase==="search"){
     const match=line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?(?:\s|$)/);
     if(!match)return finish(Error("Bot trả về nước đi không hợp lệ."));
     const index=(s:string)=>(8-Number(s[1]))*8+"abcdefgh".indexOf(s[0]);
     const move=options.find(m=>m.from===index(match[1])&&m.to===index(match[2])&&m.promotion===match[3]);
     if(!move)return finish(Error("Bot trả về nước đi không hợp lệ."));
     finish(undefined,move);
    }
   }
  });
  signal?.addEventListener("abort",abort,{once:true});
  if(signal?.aborted)abort();else send("uci");
 });
}
