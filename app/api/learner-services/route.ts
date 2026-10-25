import {NextResponse} from "next/server";
import {session,failure,check} from "@/lib/learner-services-server";
export async function GET(){try{const {client}=await session();const [f,n]=await Promise.all([client.from("aunora_feature_flags").select("key,enabled"),client.from("aunora_announcements").select("id,title,body,path,created_at").order("created_at",{ascending:false}).limit(10)]);check(f.error);check(n.error);return NextResponse.json({flags:Object.fromEntries((f.data??[]).map(x=>[x.key,x.enabled])),announcements:n.data??[]});}catch(e){return failure(e);}}
