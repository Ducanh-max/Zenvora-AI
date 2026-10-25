import {NextResponse} from "next/server";
import {session,body,failure,check,ServiceError} from "@/lib/learner-services-server";
import {FLAG_KEYS} from "@/lib/service-validation";
export async function PATCH(request:Request){try{const {client}=await session(true);const b=await body(request);if(!FLAG_KEYS.includes(b.key as typeof FLAG_KEYS[number])||typeof b.enabled!=="boolean")throw new ServiceError(400,"Cấu hình không hợp lệ.");const {error}=await client.from("aunora_feature_flags").update({enabled:b.enabled,updated_at:new Date().toISOString()}).eq("key",b.key);check(error);return NextResponse.json({ok:true});}catch(e){return failure(e);}}
