import {NextResponse} from "next/server";
import {session,failure,check} from "@/lib/learner-services-server";
export async function GET(request:Request){try{
 const {client}=await session(true);const params=new URL(request.url).searchParams;const page=Math.max(0,Math.min(10000,Math.trunc(Number(params.get("page"))||0)));const search=(params.get("search")??"").trim().slice(0,80);
 let ids:string[]|undefined;
 if(search){const {data,error}=await client.from("profiles").select("id").ilike("display_name","%"+search.replace(/[%_]/g,"")+"%").limit(100);check(error);ids=(data??[]).map(x=>x.id);}
 const [summary,flags,alerts,announcements]=await Promise.all([client.rpc("aunora_admin_learning_summary"),client.from("aunora_feature_flags").select("key,enabled,updated_at"),client.from("aunora_performance_alerts").select("id,page_path,metric,value,created_at").order("created_at",{ascending:false}).limit(30),client.from("aunora_announcements").select("id,title,body,path,push_status,sent_count,failed_count,created_at").order("created_at",{ascending:false}).limit(10)]);
 for(const r of [summary,flags,alerts,announcements])check(r.error);
 let q=client.from("aunora_lesson_progress").select("user_id,lesson_id,course_id,score,total_questions,completed,completed_at,updated_at",{count:"exact"}).order("updated_at",{ascending:false}).range(page*25,page*25+24);
 if(ids)q=q.in("user_id",ids.length?ids:["00000000-0000-0000-0000-000000000000"]);
 const progress=await q;check(progress.error);
 const recent=await client.from("aunora_learning_activity").select("user_id,lesson_id,course_id,last_seen_at").order("last_seen_at",{ascending:false}).limit(30);check(recent.error);
 const userIds=[...new Set([...(progress.data??[]).map(x=>x.user_id),...(recent.data??[]).map(x=>x.user_id)])];
 const profiles=userIds.length?await client.from("profiles").select("id,display_name").in("id",userIds):{data:[],error:null};check(profiles.error);
 return NextResponse.json({summary:summary.data,flags:flags.data,alerts:alerts.data,announcements:announcements.data,progress:progress.data,total:progress.count??0,activity:recent.data,profiles:profiles.data,page});
 }catch(e){return failure(e);}}

