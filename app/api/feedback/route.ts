import { NextResponse } from "next/server";
import { session,body,failure,feature,check,ServiceError } from "@/lib/learner-services-server";
import { safeLearnPath } from "@/lib/service-validation";
export async function GET(){try{const {client,user}=await session();const {data,error}=await client.from("aunora_feedback").select("id,category,title,message,status,reply,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(10);check(error);return NextResponse.json({feedback:data});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const {client,user}=await session(); if(!await feature(client,"feedback_enabled")) throw new ServiceError(503,"Tính năng góp ý đang tạm ngưng.");
 const b=await body(request);const title=String(b.title??"").trim(),message=String(b.message??"").trim(),category=String(b.category??"");
 if(title.length<3||title.length>120||message.length<10||message.length>3000||!["lesson_error","bug","suggestion"].includes(category))throw new ServiceError(400,"Kiểm tra tiêu đề, nội dung và loại góp ý.");
 const {data,error}=await client.from("aunora_feedback").insert({user_id:user.id,title,message,category,page_path:safeLearnPath(b.pagePath)}).select("id").single();check(error);return NextResponse.json({id:data?.id},{status:201});
 }catch(e){return failure(e);}}
