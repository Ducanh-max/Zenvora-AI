import {redirect} from "next/navigation";
import {getMembership} from "@/lib/membership";
import PaidDashboard from "../paid-dashboard";
export default async function Page(){
 const {plan,isAdmin}=await getMembership();
 if(plan!=="achiever"&&!isAdmin)redirect("/learn/"+plan);
 return <PaidDashboard tier="achiever" adminPreview={isAdmin&&plan!=="achiever"}/>;
}
