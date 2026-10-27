import {start,type Position} from "./chess-engine";
export type LocatedPiece={id:string;piece:string;square:number};
const index=(s:string)=>(8-Number(s[1]))*8+"abcdefgh".indexOf(s[0]);
/** Stable piece identities let the same DOM image slide between squares. */
export function locateChessPieces(position:Position):LocatedPiece[]{
 const board=start().board,ids:(string|null)[]=board.map((p,i)=>p==="."?null:"piece-"+i);
 for(const entry of position.history){
  const m=entry.match(/^([a-h][1-8])–([a-h][1-8])(?:=([QRBN]))?$/);if(!m)break;
  const from=index(m[1]),to=index(m[2]),piece=board[from];if(piece===".")break;
  const white=piece===piece.toUpperCase();
  if(piece.toLowerCase()==="p"&&from%8!==to%8&&board[to]==="."){const taken=to+(white?8:-8);board[taken]=".";ids[taken]=null;}
  if(piece.toLowerCase()==="k"&&Math.abs(to-from)===2){
   const rookFrom=to>from?from+3:from-4,rookTo=to>from?from+1:from-1;
   board[rookTo]=board[rookFrom];ids[rookTo]=ids[rookFrom];board[rookFrom]=".";ids[rookFrom]=null;
  }
  board[to]=m[3]?(white?m[3]:m[3].toLowerCase()):piece;ids[to]=ids[from];board[from]=".";ids[from]=null;
 }
 return position.board.flatMap((piece,square)=>piece==="."?[]:[{piece,square,id:board[square]===piece&&ids[square]?ids[square]!:"snapshot-"+piece+"-"+square}]);
}
