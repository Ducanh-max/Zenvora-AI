import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
type ChatMessage={role:"user"|"assistant";content:string};
export async function POST(request:Request){
 try{
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Vui lòng đăng nhập để sử dụng Gia sư AI."},{status:401});
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)return NextResponse.json({error:"Gia sư AI chưa được kết nối. Chủ dự án cần thêm GEMINI_API_KEY trong Environment Variables của Vercel."},{status:503});
  const body=await request.json();
  const messages=(Array.isArray(body.messages)?body.messages:[]).filter((m:any):m is ChatMessage=>(m?.role==="user"||m?.role==="assistant")&&typeof m.content==="string").slice(-16).map((m:ChatMessage)=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content.slice(0,2500)}]}));
  if(!messages.length||messages[messages.length-1].role!=="user")return NextResponse.json({error:"Hãy nhập câu hỏi trước nhé."},{status:400});
  const configuredModel=process.env.GEMINI_MODEL?.trim();
  const model=!configuredModel||configuredModel==="gemini-2.5-flash"?"gemini-3.8-flash":configuredModel;
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:"Bạn là AUNORA AI Tutor, gia sư tiếng Anh thân thiện dành cho học sinh. Trả lời bằng tiếng Việt khi học sinh hỏi tiếng Việt, dùng tiếng Anh đơn giản khi luyện hội thoại. Giải thích ngắn gọn, dễ hiểu, sửa lỗi ngữ pháp và đưa ví dụ. Khuyến khích người học tự suy nghĩ, không làm thay bài kiểm tra đang diễn ra. Khi luyện nói chuyện, hãy hỏi từng câu một và duy trì hội thoại tự nhiên. Không yêu cầu thông tin cá nhân nhạy cảm."}]},contents:messages,generationConfig:{temperature:0.7,maxOutputTokens:700}})});
  const result=await response.json();
  if(!response.ok)return NextResponse.json({error:result?.error?.message||"Không thể kết nối Gia sư AI lúc này."},{status:response.status===429?429:502});
  const reply=result?.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text||"").join("").trim();
  if(!reply)return NextResponse.json({error:"Gia sư AI chưa tạo được câu trả lời. Bạn thử hỏi lại nhé."},{status:502});
  return NextResponse.json({reply});
 }catch{return NextResponse.json({error:"Đã xảy ra lỗi. Vui lòng thử lại sau."},{status:500});}
}