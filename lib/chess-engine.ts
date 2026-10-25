export type Side="w"|"b";
export type Position={board:string[];turn:Side;castle:string;ep:number;history:string[]};
export type Move={from:number;to:number;promotion?:string;castle?:boolean;ep?:boolean};
const symbols:Record<string,string>={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
const initial="rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR";
export const start=():Position=>({board:initial.split(""),turn:"w",castle:"KQkq",ep:-1,history:[]});
const color=(p:string):Side|null=>p==="."?null:p===p.toUpperCase()?"w":"b";
export const other=(c:Side):Side=>c==="w"?"b":"w";
const inside=(r:number,c:number)=>r>=0&&r<8&&c>=0&&c<8;
const square=(i:number)=>"abcdefgh"[i%8]+(8-Math.floor(i/8));
export function attacked(s:Position,i:number,by:Side){
 const b=s.board,r=Math.floor(i/8),c=i%8;
 for(const dc of [-1,1]){const pr=r+(by==="w"?1:-1),pc=c+dc;if(inside(pr,pc)&&b[pr*8+pc]===(by==="w"?"P":"p"))return true;}
 for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){const nr=r+dr,nc=c+dc;if(inside(nr,nc)&&b[nr*8+nc]===(by==="w"?"N":"n"))return true;}
 for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]){
  let nr=r+dr,nc=c+dc,d=1;
  while(inside(nr,nc)){const p=b[nr*8+nc];if(p!=="."){if(color(p)===by){const t=p.toLowerCase();if((d===1&&t==="k")||((dr===0||dc===0)&&(t==="r"||t==="q"))||((dr!==0&&dc!==0)&&(t==="b"||t==="q")))return true;}break;}nr+=dr;nc+=dc;d++;}
 }
 return false;
}
export function execute(s:Position,m:Move):Position{
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
export function legal(s:Position):Move[]{
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
