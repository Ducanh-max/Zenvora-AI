import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import {feature,check,ServiceError} from "./learner-services-server";
import {safePushEndpoint,validPushKeys} from "./service-validation";

export async function sendAnnouncement(client:SupabaseClient,id:string){
 const {data:notice,error}=await client.from("aunora_announcements").select("id,title,body,path").eq("id",id).single();check(error);if(!notice)throw new ServiceError(404,"Không tìm thấy thông báo.");
 if(!await feature(client,"notifications_enabled")){await client.from("aunora_announcements").update({push_status:"disabled"}).eq("id",id);return {status:"disabled",sent:0,failed:0};}
 const pub=process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,priv=process.env.WEB_PUSH_PRIVATE_KEY;
 if(!pub||!priv){await client.from("aunora_announcements").update({push_status:"not_configured"}).eq("id",id);return {status:"not_configured",sent:0,failed:0};}
 const {data:jobs,error:jobsError}=await client.rpc("aunora_claim_push",{p_announcement:id});check(jobsError);
 const rows=(jobs??[]) as {subscription_id:string;endpoint:string;p256dh:string;auth:string}[];
 for(let offset=0;offset<rows.length;offset+=5){await Promise.all(rows.slice(offset,offset+5).map(async row=>{
  let status="failed";
  try{
   if(!safePushEndpoint(row.endpoint)||!validPushKeys(row))throw new Error("Invalid subscription");
   await webpush.sendNotification({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},JSON.stringify({id:notice.id,title:notice.title,body:notice.body,path:notice.path}),{TTL:86400,timeout:5000,vapidDetails:{subject:"https://zenvora-ai-alpha.vercel.app",publicKey:pub,privateKey:priv}});
   status="sent";
  }catch(e){const code=(e as {statusCode?:number}).statusCode;if(code===404||code===410){await client.from("aunora_push_subscriptions").delete().eq("id",row.subscription_id);return;}}
  const {error:saveError}=await client.from("aunora_notification_deliveries").update({status,updated_at:new Date().toISOString()}).eq("announcement_id",id).eq("subscription_id",row.subscription_id);check(saveError);
 }));}
 const [sent,failed,total]=await Promise.all([client.from("aunora_notification_deliveries").select("subscription_id",{count:"exact",head:true}).eq("announcement_id",id).eq("status","sent"),client.from("aunora_notification_deliveries").select("subscription_id",{count:"exact",head:true}).eq("announcement_id",id).eq("status","failed"),client.from("aunora_push_subscriptions").select("id",{count:"exact",head:true})]);
 for(const r of [sent,failed,total])check(r.error);
 const status=(sent.count??0)>=(total.count??0)?"sent":"partial";
 const {error:updateError}=await client.from("aunora_announcements").update({push_status:status,sent_count:sent.count??0,failed_count:failed.count??0}).eq("id",id);check(updateError);
 return {status,sent:sent.count??0,failed:failed.count??0,remaining:Math.max(0,(total.count??0)-(sent.count??0))};
}
export async function publishAnnouncement(client:SupabaseClient,userId:string,title:string,message:string,path="/courses"){
 const {data,error}=await client.from("aunora_announcements").insert({created_by:userId,title,body:message,path}).select("id").single();check(error);if(!data)throw new Error("Cannot publish announcement");
 return {id:data.id,...await sendAnnouncement(client,data.id)};
}
