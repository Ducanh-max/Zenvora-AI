import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Vui lòng đăng nhập để sử dụng dịch hội thoại."},{status:401});
  const body=await request.json();
  const messages=body?.messages;
  if(!Array.isArray(messages)||messages.length<1||messages.length>30||messages.some((s:unknown)=>typeof s!=="string"||s.length>800))return NextResponse.json({error:"Dữ liệu hội thoại không hợp lệ."},{status:400});
  const key=process.env.GROQ_API_KEY;
  if(!key)return NextResponse.json({error:"Chưa cấu hình dịch AI."},{status:503});
  const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile",temperature:0,messages:[{role:"system",content:"Translate each English utterance into natural Vietnamese. Return ONLY a valid JSON array of Vietnamese strings in the same order, with exactly the same number of elements. No markdown or explanation."},{role:"user",content:JSON.stringify(messages)}]})});
  if(!res.ok)return NextResponse.json({error:"Dịch AI đang bận, hãy thử lại."},{status:502});
  const data=await res.json();
  const raw=String(data.choices?.[0]?.message?.content||"").trim().replace(/^```(?:json)?\s*/,"").replace(/\s*```$/,"");
  const translated=JSON.parse(raw);
  if(!Array.isArray(translated)||translated.length!==messages.length||translated.some((s:unknown)=>typeof s!=="string"))throw Error("Unexpected translation");
  return NextResponse.json({translations:translated});
 }catch{return NextResponse.json({error:"Không thể dịch hội thoại lúc này."},{status:500})}
}
