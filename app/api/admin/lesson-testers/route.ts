import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createClient as createAdmin} from "@supabase/supabase-js";
export const runtime="nodejs";
async function authorizedAdmin(){
 const db=await createClient();const {data:{user},error}=await db.auth.getUser();
 if(error||!user)return {error:NextResponse.json({error:"Vui lòng đăng nhập."},{status:401})};
 if(user.app_metadata?.role!=="admin")return {error:NextResponse.json({error:"Chỉ admin được quản lý quyền thử nghiệm."},{status:403})};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {error:NextResponse.json({error:"Chưa cấu hình dịch vụ quản trị."},{status:503})};
 return {admin:createAdmin(url,key,{auth:{autoRefreshToken:false,persistSession:false}})};
}
export async function GET(){
 const access=await authorizedAdmin();if(access.error)return access.error;
 const testerIds:string[]=[],adminIds:string[]=[];
 for(let page=1;;page++){
  const {data,error}=await access.admin!.auth.admin.listUsers({page,perPage:1000});
  if(error)return NextResponse.json({error:"Chưa tải được quyền thử nghiệm."},{status:503});
  for(const user of data.users){if(user.app_metadata?.lesson_testing===true)testerIds.push(user.id);if(user.app_metadata?.role==="admin")adminIds.push(user.id);}
  if(data.users.length<1000)break;
 }
 return NextResponse.json({testerIds,adminIds},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Yêu cầu không hợp lệ."},{status:403});
 const access=await authorizedAdmin();if(access.error)return access.error;
 let body;try{body=await request.json();}catch{return NextResponse.json({error:"Dữ liệu không hợp lệ."},{status:400});}
 if(typeof body.userId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.userId)||typeof body.enabled!=="boolean")return NextResponse.json({error:"Tài khoản hoặc quyền không hợp lệ."},{status:400});
 const {data,error}=await access.admin!.auth.admin.getUserById(body.userId);
 if(error||!data.user)return NextResponse.json({error:"Không tìm thấy tài khoản."},{status:404});
 if(data.user.app_metadata?.role==="admin")return NextResponse.json({error:"Admin luôn có quyền xem câu trước."},{status:400});
 const result=await access.admin!.auth.admin.updateUserById(body.userId,{app_metadata:{...data.user.app_metadata,lesson_testing:body.enabled}});
 if(result.error)return NextResponse.json({error:"Chưa lưu được quyền thử nghiệm."},{status:503});
 return NextResponse.json({userId:body.userId,enabled:result.data.user.app_metadata?.lesson_testing===true});
}
