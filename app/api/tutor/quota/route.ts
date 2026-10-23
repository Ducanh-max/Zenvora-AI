import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createClient as createAdmin} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export async function GET(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Đăng nhập để xem hạn mức."},{status:401});
 const resetAt=new Date();resetAt.setUTCHours(24,0,0,0);
 if(user.app_metadata?.role==="admin")return NextResponse.json({used:0,quota:-1,remaining:-1,resetAt:resetAt.toISOString(),locked:false});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Chưa cấu hình hạn mức."},{status:503});
 const admin=createAdmin(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const today=new Date().toISOString().slice(0,10);
 const [{data:usage,error:usageError},{data:ent,error:entError},{data:credits,error:creditsError}]=await Promise.all([
 admin.from("aunora_daily_usage").select("tutor_requests").eq("user_id",user.id).eq("usage_date",today).maybeSingle(),
 admin.from("aunora_user_entitlements").select("plan_id,active_until").eq("user_id",user.id).maybeSingle(),
 admin.from("aunora_tutor_credits").select("balance").eq("user_id",user.id).maybeSingle()
 ]);
 if(usageError||entError||creditsError)return NextResponse.json({error:"Không đọc được hạn mức."},{status:503});
 const plan=ent&&(!ent.active_until||new Date(ent.active_until)>new Date())?ent.plan_id:"starter";
 const quota=plan==="starter"?20:plan==="plus"?30:plan==="pro"?60:-1;
 const used=usage?.tutor_requests||0;
 const bonus=credits?.balance||0;
 const remaining=quota<0?-1:Math.max(0,quota-used)+bonus;
 return NextResponse.json({used,quota,remaining,bonus,locked:quota>=0&&remaining===0,resetAt:resetAt.toISOString()});
}
