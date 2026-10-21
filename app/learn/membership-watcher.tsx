"use client";
import {useEffect} from "react";
import {usePathname,useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
type Plan="free"|"explorer"|"achiever"|"mastery";
function normalized(v:unknown):Plan{if(v==="starter"||v==="explorer")return "explorer";if(v==="pro"||v==="achiever")return "achiever";if(v==="premium"||v==="mastery")return "mastery";return "free";}
export default function MembershipWatcher(){
 const pathname=usePathname(),router=useRouter();
 useEffect(()=>{
  const db=createClient();
  let alive=true,busy=false,known:Plan|null=null;
  const current=pathname==="/learn"?"free":pathname==="/learn/free"?"free":pathname==="/learn/explorer"?"explorer":pathname==="/learn/achiever"?"achiever":pathname==="/learn/mastery"?"mastery":null;
  async function check(){
   if(!alive||busy||document.visibilityState==="hidden")return;
   busy=true;
   try{
    const {data:{user}}=await db.auth.getUser();
    if(!user)return;
    const {data,error}=await db.from("aunora_memberships").select("plan,expires_at").eq("user_id",user.id).maybeSingle();
    if(error)return;
    const plan=data?.expires_at&&new Date(data.expires_at).getTime()<=Date.now()?"free":normalized(data?.plan);
    const changed=known!==null&&known!==plan;
    known=plan;
    if((current!==null&&current!==plan)||changed){
      const {data:{user:latest}}=await db.auth.getUser();
      if(latest?.app_metadata?.role==="admin"&&current!==null&&current!==plan&&!changed)return;
      window.location.replace(plan==="free"?"/learn":"/learn/"+plan);
    }
   }finally{busy=false;}
  }
  void check();
  const timer=window.setInterval(()=>void check(),4000);
  const onFocus=()=>void check();
  window.addEventListener("focus",onFocus);
  document.addEventListener("visibilitychange",onFocus);
  const channel=db.channel("membership-watch-"+Math.random().toString(36).slice(2)).on("postgres_changes",{event:"*",schema:"public",table:"aunora_memberships"},()=>void check()).subscribe();
  return()=>{alive=false;clearInterval(timer);window.removeEventListener("focus",onFocus);document.removeEventListener("visibilitychange",onFocus);void db.removeChannel(channel)};
 },[pathname,router]);
 return null;
}
