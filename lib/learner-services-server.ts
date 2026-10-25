import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlagKey } from "./service-validation";
export class ServiceError extends Error { constructor(public status:number,message:string){super(message);} }
export async function session(admin=false) {
 const client=await createClient(); const {data:{user},error}=await client.auth.getUser();
 if(error || !user) throw new ServiceError(401,"Vui lòng đăng nhập.");
 if(admin && user.app_metadata?.role!=="admin") throw new ServiceError(403,"Bạn không có quyền quản trị.");
 return {client,user};
}
export async function feature(client:SupabaseClient,key:FlagKey) {
 const {data,error}=await client.from("aunora_feature_flags").select("enabled").eq("key",key).single();
 if(error) throw new ServiceError(503,"Chưa tải được cấu hình tính năng. Vui lòng thử lại.");
 return data.enabled===true;
}
export async function body(request:Request):Promise<Record<string,unknown>> {
 const origin=request.headers.get("origin"); if(origin && origin!==new URL(request.url).origin) throw new ServiceError(403,"Nguồn yêu cầu không hợp lệ.");
 const text=await request.text(); if(text.length>12000) throw new ServiceError(413,"Nội dung quá dài.");
 try { const result=JSON.parse(text); if(!result || typeof result!=="object" || Array.isArray(result)) throw new Error(); return result; } catch { throw new ServiceError(400,"Dữ liệu không hợp lệ."); }
}
export function failure(error:unknown) { if(error instanceof ServiceError) return NextResponse.json({error:error.message},{status:error.status}); console.error("AUNORA service:",error); return NextResponse.json({error:"Chưa thực hiện được. Vui lòng thử lại."},{status:500}); }
export function check(error:{message:string;code?:string}|null) { if(error) { if(error.code==="P0001") throw new ServiceError(429,error.message); throw new Error(error.message); } }

