import {redirect} from "next/navigation";
import {getMembership} from "@/lib/membership";
import ExplorerDashboard from "./explorer-dashboard";
export default async function Page(){
 const {plan,isAdmin,user}=await getMembership();
 if(plan!=="explorer"&&!isAdmin)redirect("/learn/"+plan);
 const name=String(user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split("@")[0]||"Bạn");
 return <ExplorerDashboard name={name} avatarUrl={String(user.user_metadata?.avatar_url||user.user_metadata?.picture||"")} adminPreview={Boolean(isAdmin&&plan!=="explorer")}/>;
}
