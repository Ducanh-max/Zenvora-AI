import {redirect} from "next/navigation";
import {getMembership} from "@/lib/membership";
import Dashboard from "./dashboard";
export default async function LearnIndex(){const {plan}=await getMembership();if(plan!=="free")redirect("/learn/"+plan);return <Dashboard/>;}
