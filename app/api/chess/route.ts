import {NextResponse} from "next/server";
import {createClient as adminClient} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/server";
import {start,legal,execute,attacked,other,type Position} from "@/lib/chess-engine";
export const runtime="nodejs";
function validPosition(p:unknown):p is Position{
 if(!p||typeof p!=="object")return false;
 const x=p as Position;
 return Array.isArray(x.board)&&x.board.length===64&&x.board.every(v=>typeof v==="string"&&/^[.prnbqkPRNBQK]$/.test(v))&&(x.turn==="w"||x.turn==="b")&&typeof x.castle==="string"&&typeof x.ep==="number"&&Array.isArray(x.history)&&x.history.length<600;
}
export async function POST(request:Request){
 try{
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Chưa cấu hình Supabase service role trên máy chủ."},{status:503});
 const admin=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const body=await request.json();const action=String(body.action||"");const code=action==="create"?Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n%32]).join(""):String(body.code||"").trim().toUpperCase();
 if(!/^[A-Z0-9]{6}$/.test(code))return NextResponse.json({error:"Mã phòng không hợp lệ."},{status:400});
 const name=String(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split("@")[0]||"Người chơi").slice(0,40);
 let position:Position|null=null,version:null|number=null,winner:null|string=null;
 if(action==="create"||action==="start")position=start();
 if(action==="move"){
  const {data:room,error}=await admin.from("aunora_chess_rooms").select("*").eq("code",code).single();
  if(error||!room)return NextResponse.json({error:"Không tìm thấy phòng."},{status:404});
  if(room.status!=="playing"||!validPosition(room.position))return NextResponse.json({error:"Trận chưa bắt đầu hoặc đã kết thúc."},{status:400});
  if((room.position.turn==="w"?room.host_id:room.guest_id)!==user.id)return NextResponse.json({error:"Chưa đến lượt bạn."},{status:403});
  const m=legal(room.position).find(m=>m.from===body.from&&m.to===body.to&&(m.promotion||"")===(body.promotion||""));
  if(!m)return NextResponse.json({error:"Nước đi không hợp lệ."},{status:400});
  position=execute(room.position,m);version=room.version;
  const options=legal(position);
  if(!options.length&&attacked(position,position.board.indexOf(position.turn==="w"?"K":"k"),other(position.turn)))winner=user.id;
 }
 if(!["create","join","start","move","resign","close","timeout"].includes(action))return NextResponse.json({error:"Hành động không hợp lệ."},{status:400});
 const {data,error}=await admin.rpc("aunora_chess_action",{p_action:action,p_code:code,p_actor:user.id,p_name:name,p_position:position,p_version:version,p_winner:winner,p_time_control:action==="create"?Number(body.timeControl||0):0});
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({room:data});
 }catch{return NextResponse.json({error:"Không thể xử lý yêu cầu."},{status:500});}
}
