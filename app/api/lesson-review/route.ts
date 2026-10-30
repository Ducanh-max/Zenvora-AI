import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {sampleLessons} from "@/app/learn/library/sample-intro-content";
import {nextReview} from "@/lib/lesson-review";
const ids=new Set(sampleLessons.flatMap(lesson=>lesson.tasks.map(task=>task.id)));
export async function GET(){
 try{
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401});
 const {data,error}=await db.from("aunora_review_items").select("task_id,due_at,streak").eq("user_id",user.id).order("due_at").limit(100);
 if(error)throw error;
 return NextResponse.json({items:data||[]},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Chưa tải được lịch ôn."},{status:500});}
}
export async function POST(request:Request){
 try{
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Yêu cầu không hợp lệ."},{status:403});
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401});
 const body=await request.json(),attempts=body.attempts;
 if(!Array.isArray(attempts)||attempts.length<1||attempts.length>44||attempts.some(a=>!a||!ids.has(a.taskId)||typeof a.correct!=="boolean"||typeof a.assisted!=="boolean")||new Set(attempts.map(a=>a.taskId)).size!==attempts.length)
 return NextResponse.json({error:"Kết quả ôn tập không hợp lệ."},{status:400});
 const {data:previous,error:readError}=await db.from("aunora_review_items").select("task_id,streak,due_at").eq("user_id",user.id).in("task_id",attempts.map(a=>a.taskId));
 if(readError)throw readError;
 const now=Date.now();
 if(body.mode==="review"&&attempts.some(a=>!previous?.some(p=>p.task_id===a.taskId&&Date.parse(p.due_at)<=now)))
 return NextResponse.json({error:"Câu này chưa đến lịch ôn. Hãy tải lại danh sách."},{status:409});
 const rows=attempts.map(a=>{
 const old=previous?.find(p=>p.task_id===a.taskId);
 const next=nextReview(old?.streak||0,a.correct,a.assisted,now);
 // Retrying a lesson save must not postpone an already scheduled review.
 if(body.mode!=="review"&&old&&Date.parse(old.due_at)>now){
 next.streak=Math.min(old.streak,next.streak);
 next.due_at=new Date(Math.min(Date.parse(old.due_at),Date.parse(next.due_at))).toISOString();
 }
 return {user_id:user.id,task_id:a.taskId,...next,last_correct:a.correct,last_assisted:a.assisted,updated_at:new Date(now).toISOString()};
 });
 const {error}=await db.from("aunora_review_items").upsert(rows,{onConflict:"user_id,task_id"});
 if(error)throw error;
 return NextResponse.json({saved:rows.length});
 }catch{return NextResponse.json({error:"Chưa lưu được lịch ôn. Hãy thử lại."},{status:500});}
}
