import {legal,execute,attacked,other,type Position,type Move} from "./chess-engine";
import type {Difficulty} from "./chess-match";
const values:Record<string,number>={p:100,n:320,b:335,r:500,q:900,k:0};
const limits={easy:{depth:2,ms:180},medium:{depth:3,ms:450},hard:{depth:4,ms:1200},expert:{depth:7,ms:3000}};
function evaluate(p:Position){let score=0;const material=p.board.reduce((n,x)=>n+(values[x.toLowerCase()]||0),0);for(let i=0;i<64;i++){const piece=p.board[i];if(piece===".")continue;const black=piece===piece.toLowerCase(),type=piece.toLowerCase(),rank=black?Math.floor(i/8):7-Math.floor(i/8),center=7-Math.abs(i%8-3.5)-Math.abs(Math.floor(i/8)-3.5);let bonus=center*(type==="n"?12:type==="b"?7:3);if(type==="p")bonus+=rank*9;if(type==="k")bonus=material>2400?-center*12:center*12;score+=(black?1:-1)*(values[type]+bonus);}return score;}
function order(p:Position,moves:Move[],preferred?:Move){const priority=(m:Move)=>(m.from===preferred?.from&&m.to===preferred?.to?100000:0)+(m.promotion?900:0)+(m.ep?100:0)+(p.board[m.to]!=="."?10*values[p.board[m.to].toLowerCase()]-(values[p.board[m.from].toLowerCase()]||0):0)+(m.castle?50:0);return moves.sort((a,b)=>priority(b)-priority(a));}
export function chooseAi(p:Position,difficulty:Difficulty):Move|null{
 const moves=legal(p);if(!moves.length)return null;
 const config=limits[difficulty],deadline=Date.now()+config.ms;let nodes=0,best=moves[0];const timeout=Symbol("search deadline");const table=new Map<string,{depth:number;score:number}>();
 function search(s:Position,depth:number,alpha:number,beta:number,ply:number,quiet=3):number{
  if((++nodes&63)===0&&Date.now()>=deadline)throw timeout;
  const options=legal(s),check=attacked(s,s.board.indexOf(s.turn==="w"?"K":"k"),other(s.turn));if(!options.length)return check?(s.turn==="b"?-100000+ply:100000-ply):0;
  const key=s.board.join("")+s.turn+s.castle+s.ep;const cached=table.get(key);if(depth>0&&cached&&cached.depth>=depth)return cached.score;
  const maximize=s.turn==="b";let score=maximize?-Infinity:Infinity;const originalAlpha=alpha,originalBeta=beta;
  if(depth<=0){const stand=evaluate(s);if(quiet<=0)return stand;if(!check){score=stand;if(maximize){if(score>=beta)return score;alpha=Math.max(alpha,score);}else{if(score<=alpha)return score;beta=Math.min(beta,score);}}}
  for(const move of order(s,options)){
   if(depth<=0&&!check&&s.board[move.to]==="."&&!move.ep&&!move.promotion)continue;
   const value=search(execute(s,move),depth-1,alpha,beta,ply+1,depth<=0?quiet-1:quiet);
   score=maximize?Math.max(score,value):Math.min(score,value);if(maximize)alpha=Math.max(alpha,score);else beta=Math.min(beta,score);if(alpha>=beta)break;
  }
  // Cache exact values only; cutoff bounds cannot be reused as exact scores.
  if(depth>0&&score>originalAlpha&&score<originalBeta)table.set(key,{depth,score});return score;
 }
 for(let depth=1;depth<=config.depth;depth++){
  try{const scored=order(p,[...moves],best).map(m=>({m,score:search(execute(p,m),depth-1,-Infinity,Infinity,1)})).sort((a,b)=>p.turn==="b"?b.score-a.score:a.score-b.score);best=scored[0].m;if(difficulty==="easy"||difficulty==="medium"){const margin=difficulty==="easy"?180:45,pool=scored.filter(x=>Math.abs(x.score-scored[0].score)<=margin);best=pool[Math.floor(Math.random()*Math.min(pool.length,difficulty==="easy"?6:2))].m;}if(Math.abs(scored[0].score)>90000||Date.now()>=deadline)break;}catch(e){if(e!==timeout)throw e;break;}
 }
 return best;
}
