import {redirect} from "next/navigation";
import {getMembership} from "@/lib/membership";
import PaidDashboard from "../paid-dashboard";
export default async function Page(){
 const {plan,isAdmin}=await getMembership();
 if(plan!=="mastery"&&!isAdmin)redirect("/learn/"+plan);
 return <PaidDashboard tier="mastery" adminPreview={isAdmin&&plan!=="mastery"}/>;
}
