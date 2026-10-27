import {start,legal,execute,attacked,other,type Position,type Side} from "./chess-engine";
export const chessPieceNames:Record<string,string>={k:"Vua",q:"Hậu",r:"Xe",b:"Tượng",n:"Mã",p:"Tốt"};
const files:Record<string,string>={k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"};
export const chessPieceSrc=(p:string)=>"/chess/pieces/"+(p===p.toUpperCase()?"white":"black")+"-"+files[p.toLowerCase()]+".png";
const index=(s:string)=>(8-Number(s[1]))*8+"abcdefgh".indexOf(s[0]);
const square=(i:number)=>"abcdefgh"[i%8]+(8-Math.floor(i/8));
export type MoveRecord={side:Side;notation:string;description:string;captured:string|null};
export function describeChessHistory(history:readonly string[],initial:Position=start()){
 let position=initial;
 const records:MoveRecord[]=[],captured:{w:string[];b:string[]}={w:[],b:[]};
 for(const entry of history){
  const parsed=entry.match(/^([a-h][1-8])–([a-h][1-8])(?:=([QRBN]))?$/);
  if(!parsed)break;
  const options=legal(position),move=options.find(m=>m.from===index(parsed[1])&&m.to===index(parsed[2])&&m.promotion===(parsed[3]?.toLowerCase()));
  if(!move)break;
  const side=position.turn,piece=position.board[move.from],kind=piece.toLowerCase();
  const taken=move.ep?position.board[move.to+(side==="w"?8:-8)]:position.board[move.to];
  const capture=taken!=="."?taken:null;
  if(capture)captured[side].push(capture);
  let notation="";
  if(move.castle)notation=move.to>move.from?"O-O":"O-O-O";
  else{
   let prefix=kind==="p"?(capture?parsed[1][0]:""):kind.toUpperCase();
   if(kind!=="p"){
    const others=options.filter(m=>m.from!==move.from&&m.to===move.to&&position.board[m.from]===piece);
    if(others.length)prefix+=others.every(m=>m.from%8!==move.from%8)?parsed[1][0]:others.every(m=>Math.floor(m.from/8)!==Math.floor(move.from/8))?parsed[1][1]:parsed[1];
   }
   notation=prefix+(capture?"x":"")+parsed[2]+(move.promotion?"="+move.promotion.toUpperCase():"");
  }
  position=execute(position,move);
  const checked=attacked(position,position.board.indexOf(position.turn==="w"?"K":"k"),other(position.turn));
  if(checked)notation+=legal(position).length?"+":"#";
  records.push({side,notation,captured:capture,description:(side==="w"?"Trắng":"Đen")+": "+chessPieceNames[kind]+" "+parsed[1]+" → "+parsed[2]+(capture?", ăn "+chessPieceNames[capture.toLowerCase()]:"")+(move.ep?" qua đường":"")+(move.promotion?", phong cấp thành "+chessPieceNames[move.promotion]:"")+(checked?", chiếu"+(notation.endsWith("#")?" hết":""):"")});
 }
 return {records,captured};
}
