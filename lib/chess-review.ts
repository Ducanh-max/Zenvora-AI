import {attacked,other,type Position,type Side} from "./chess-engine";
import {positionKey,type Match} from "./chess-match";
const names:Record<string,string>={k:"Vua",q:"Hậu",r:"Xe",b:"Tượng",n:"Mã",p:"Tốt"};
const sideName=(side:Side)=>side==="w"?"Trắng":"Đen";
const square=(i:number)=>"abcdefgh"[i%8]+(8-Math.floor(i/8));
const index=(s:string)=>(8-Number(s[1]))*8+"abcdefgh".indexOf(s[0]);
function threats(p:Position,target:number,by:Side){
 return p.board.flatMap((piece,from)=>{
  if(piece==="."||(piece===piece.toUpperCase()?"w":"b")!==by)return [];
  const dr=Math.floor(target/8)-Math.floor(from/8),dc=target%8-from%8,type=piece.toLowerCase();
  let hits=false;
  if(type==="p")hits=dr===(by==="w"?-1:1)&&Math.abs(dc)===1;
  else if(type==="n")hits=Math.abs(dr)*Math.abs(dc)===2;
  else if(type==="k")hits=Math.max(Math.abs(dr),Math.abs(dc))===1;
  else{
   const diagonal=Math.abs(dr)===Math.abs(dc)&&dr!==0,straight=(dr===0)!==(dc===0);
   if((type==="b"&&diagonal)||(type==="r"&&straight)||(type==="q"&&(diagonal||straight))){
    hits=true;const sr=Math.sign(dr),sc=Math.sign(dc);
    for(let r=Math.floor(from/8)+sr,c=from%8+sc;r!==Math.floor(target/8)||c!==target%8;r+=sr,c+=sc)if(p.board[r*8+c]!=="."){hits=false;break;}
   }
  }
  return hits?[`${names[type]} ${sideName(by)} tại ${square(from)}`]:[];
 });
}
export type ResultReview={summary:string;facts:string[];lastMove:string|null;tip:string};
export function explainResult(match:Match):ResultReview|null{
 const result=match.result;if(!result)return null;
 const p=match.position,king=p.board.indexOf(p.turn==="w"?"K":"k"),last=p.history.at(-1);
 const notation=last?.match(/^([a-h][1-8])–([a-h][1-8])(?:=([QRBN]))?$/);
 const lastPiece=notation?p.board[index(notation[2])]:".";
 const lastMove=notation&&lastPiece!=="."?`${names[lastPiece.toLowerCase()]} ${lastPiece===lastPiece.toUpperCase()?"Trắng":"Đen"}: ${notation[1]} → ${notation[2]}${notation[3]?" (phong cấp)":""}`:last||null;
 const facts:string[]=[];let summary="",tip="";
 if(result.reason==="checkmate"){
  const winner=sideName(result.winner!),loser=sideName(p.turn),attackers=threats(p,king,other(p.turn));
  summary=`${winner} thắng vì đã chiếu hết Vua ${loser}, không phải vì bắt được Vua.`;
  facts.push(`Vua ${loser} ở ${square(king)} đang bị ${attackers.join(" và ")} tấn công.`);
  facts.push(`${loser} không còn nước đi hợp lệ nào để thoát chiếu: không thể đưa Vua tới ô an toàn, bắt quân đang chiếu hoặc chặn được đòn chiếu.`);
  if(attackers.length>1)facts.push("Đây là chiếu đôi. Muốn thoát, Vua phải tự di chuyển tới ô an toàn; trong thế cờ này không có ô như vậy.");
  tip="Bài học: trước mỗi nước đi, kiểm tra các đòn tấn công vào Vua và các ô thoát. Khi bị chiếu, hãy xét di chuyển Vua, bắt quân chiếu hoặc chặn đường chiếu nếu có thể. Đây là giải thích thế cờ cuối, không phải đánh giá mọi nước đi trước đó.";
 }else if(result.reason==="timeout"){
  const expired=sideName(p.turn);facts.push(`Đồng hồ của ${expired} đã về 0:00 trước khi hoàn thành nước đi tiếp theo.`);
  if(result.winner){summary=`${sideName(result.winner)} thắng vì ${expired} hết thời gian.`;facts.push("Ván kết thúc do hết giờ, không phải do chiếu hết; bên thắng vẫn có quân để có khả năng chiếu hết.");}
  else{summary=`Ván hòa dù ${expired} hết giờ, vì bên còn lại không có khả năng chiếu hết trong thế cờ này.`;facts.push("Hết giờ không tạo ra chiến thắng khi bên còn lại không thể chiếu hết.");}
  tip="Bài học: phân bố thời gian cho cả ván 20 phút, tránh dành quá lâu cho một nước và ưu tiên xử lý ngay các tình huống bị chiếu.";
 }else if(result.reason==="stalemate"){
  summary=`Ván hòa vì ${sideName(p.turn)} hết nước đi hợp lệ nhưng Vua không bị chiếu.`;
  facts.push(`Đến lượt ${sideName(p.turn)} nhưng không quân nào có thể đi hợp lệ.`, `Vua ${sideName(p.turn)} ở ${square(king)} ${attacked(p,king,other(p.turn))?"đang":"không"} bị tấn công. Không bị chiếu là điểm khác với chiếu hết.`);
  tip="Bài học: khi đang hơn quân, đừng khóa hết nước đi của đối thủ nếu chưa chiếu Vua; hãy tạo một đòn chiếu hết hợp lệ.";
 }else if(result.reason==="material"){
  summary="Ván hòa vì số quân còn lại không thể tạo ra thế chiếu hết.";
  facts.push("Ứng dụng nhận diện thế cờ không đủ quân chiếu hết, chẳng hạn Vua đấu Vua, Vua và một Tượng/Mã đấu Vua, hoặc chỉ còn các Tượng cùng màu ô.");
  tip="Bài học: hơn một quân nhẹ không phải lúc nào cũng đủ để thắng. Khi không bên nào có thể chiếu hết, ván đấu hòa.";
 }else if(result.reason==="repetition"){
  const count=match.keys.filter(key=>key===positionKey(p)).length;
  summary="Ván hòa do cùng một thế cờ lặp lại ba lần.";
  facts.push(`Thế cờ hiện tại đã xuất hiện ${count} lần, với cùng bên đến lượt và cùng quyền nhập thành, bắt Tốt qua đường nếu có.`,"Các lần xuất hiện không cần liên tiếp. Ứng dụng tự kết thúc hòa khi nhận diện lần thứ ba.");
  tip="Bài học: nếu muốn tiếp tục tìm chiến thắng, hãy đổi kế hoạch để tránh quay lại cùng một thế cờ.";
 }else{
  summary="Ván hòa theo luật 50 nước của ứng dụng.";
  facts.push("Hai bên đã đi ít nhất 50 nước mỗi bên liên tiếp mà không bắt quân và không di chuyển Tốt.","Một nước bắt quân hoặc một nước đi Tốt sẽ đặt lại bộ đếm. Ứng dụng tự kết thúc hòa khi đạt ngưỡng này.");
  tip="Bài học: cần tạo tiến triển thực sự, thay vì chỉ di chuyển quân qua lại mà không thay đổi thế cờ.";
 }
 return {summary,facts,lastMove,tip};
}
