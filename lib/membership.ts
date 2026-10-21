import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";

export type Plan="free"|"explorer"|"achiever"|"mastery";
export const planNames:Record<Plan,string>={free:"Aunora Sprout",explorer:"Aunora Explorer",achiever:"Aunora Achiever",mastery:"Aunora Mastery"};

// Admin gift RPC stores legacy IDs (starter/pro/premium). Translate them to
// dashboard route IDs rather than treating every paid membership as free.
function normalizePlan(value:unknown):Plan{
 switch(value){
  case "starter":case "explorer":return "explorer";
  case "pro":case "achiever":return "achiever";
  case "premium":case "mastery":return "mastery";
  default:return "free";
 }
}

export async function getMembership(){
 const db=await createClient();
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)redirect("/login");
 const {data,error:membershipError}=await db.from("aunora_memberships").select("plan,expires_at").eq("user_id",user.id).maybeSingle();
 if(membershipError)throw new Error("Không thể xác minh gói đăng ký. Vui lòng thử lại.");
 const expired=Boolean(data?.expires_at&&new Date(data.expires_at).getTime()<=Date.now());
 const plan=expired?"free":normalizePlan(data?.plan);
 return {plan,user,isAdmin:user.app_metadata?.role==="admin"};
}
