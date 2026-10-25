import {NextResponse} from "next/server";
import {session,body,failure,check,ServiceError} from "@/lib/learner-services-server";
import {poorMetric,safeLearnPath} from "@/lib/service-validation";
export async function POST(request:Request){try{const {client,user}=await session();const b=await body(request);if(!poorMetric(b.name,b.value))throw new ServiceError(400,"Không có chỉ số chậm hợp lệ.");const {error}=await client.from("aunora_performance_alerts").insert({user_id:user.id,page_path:safeLearnPath(b.path),metric:b.name,value:b.value});if(error?.code!=="23505")check(error);return NextResponse.json({ok:true});}catch(e){return failure(e);}}
