import {NextResponse} from "next/server";
import {createClient as adminClient} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/server";
import {legal} from "@/lib/chess-engine";
import {newMatch,chargeClock,playMove,type Difficulty} from "@/lib/chess-match";
import {chooseAi} from "@/lib/chess-ai";
import {signTicket,readTicket,type BotTicket} from "@/lib/chess-ticket";
export const runtime="nodejs";
export const maxDuration=30;
export async function GET(){try{const db=await createClient();const {data,error}=await db.rpc("aunora_chess_leaderboard");if(error)throw error;return NextResponse.json({leaders:data||[]});}catch{return NextResponse.json({error:"Chưa tải được bảng xếp hạng."},{status:503});}}
export async function POST(request:Request){
 try{
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL;if(!key||!url)return NextResponse.json({error:"Máy chủ chưa cấu hình cờ vua. Vui lòng thử lại sau."},{status:503});
  const raw=await request.text();if(raw.length>210000)return NextResponse.json({error:"Yêu cầu quá lớn."},{status:413});const body=JSON.parse(raw);
  const db=await createClient(),{data:{user}}=await db.auth.getUser();let game:BotTicket;
  if(body.action==="start"){
   if(!["easy","medium","hard","expert"].includes(body.difficulty))return NextResponse.json({error:"Cấp độ không hợp lệ."},{status:400});
   game={version:1,id:crypto.randomUUID(),actor:user?.id||null,name:String(user?.user_metadata?.full_name||user?.user_metadata?.name||"Người chơi").slice(0,40),difficulty:body.difficulty as Difficulty,created:Date.now(),match:newMatch()};
  }else{
   try{game=readTicket(body.ticket,key);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Vé trận đấu không hợp lệ."},{status:400});}
   if(game.actor!==(user?.id||null))return NextResponse.json({error:"Tài khoản của ván đấu đã thay đổi. Vui lòng đăng nhập lại."},{status:403});
   if(!["move","timeout","save"].includes(body.action))return NextResponse.json({error:"Hành động không hợp lệ."},{status:400});
   if(!game.match.result){
    game.match=chargeClock(game.match);
    if(!game.match.result&&body.action==="move"){
     if(game.match.position.turn!=="w")return NextResponse.json({error:"Chưa đến lượt bạn."},{status:400});
     const move=legal(game.match.position).find(m=>m.from===body.from&&m.to===body.to&&(m.promotion||"")===(body.promotion||""));if(!move)return NextResponse.json({error:"Nước đi không hợp lệ."},{status:400});
     game.match=playMove(game.match,move);
     if(!game.match.result){const response=chooseAi(game.match.position,game.difficulty);if(response)game.match=playMove(game.match,response);}
    }
   }
  }
  let saved:"saved"|"guest"|"error"|null=null;
  if(game.match.result?.winner==="w"){
   if(!game.actor)saved="guest";
   else{const admin=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const {error}=await admin.from("aunora_chess_bot_results").upsert({game_id:game.id,user_id:game.actor,display_name:game.name,difficulty:game.difficulty,reason:game.match.result.reason},{onConflict:"game_id",ignoreDuplicates:true});saved=error?"error":"saved";}
  }
  return NextResponse.json({match:game.match,ticket:signTicket(game,key),ranked:!!game.actor,saved},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Không thể kết nối trận đấu. Hãy thử lại."},{status:500});}
}
