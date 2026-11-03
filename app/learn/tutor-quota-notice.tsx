"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
type Quota={used:number;quota:number;remaining:number;locked:boolean;resetAt:string};
export default function TutorQuotaNotice({onLock}:{onLock?:(locked:boolean)=>void}){
 const [quota,setQuota]=useState<Quota|null>(null),[now,setNow]=useState(Date.now());
 const lockCallback=useRef(onLock);
 useEffect(()=>{lockCallback.current=onLock},[onLock]);
 const [conversation,setConversation]=useState<{title:string;percent:number}|null>(null);
 useEffect(()=>{const read=()=>{try{const raw=localStorage.getItem("aunora_conversation_progress");if(!raw){setConversation(null);return;}const data=JSON.parse(raw);const count=Math.max(0,Math.min(5,Number(data.count)||0));setConversation({title:String(data.title||"Hội thoại với Aivanta"),percent:Math.round(count/5*100)});}catch{setConversation(null)}};read();window.addEventListener("focus",read);window.addEventListener("storage",read);window.addEventListener("aunora-progress-updated",read);return()=>{window.removeEventListener("focus",read);window.removeEventListener("storage",read);window.removeEventListener("aunora-progress-updated",read)}},[]);
 useEffect(()=>{
  let alive=true,busy=false,queued=false;
  let controller:AbortController|null=null;
  const refresh=async()=>{
   if(!alive||document.visibilityState==="hidden"||navigator.onLine===false)return;
   if(busy){queued=true;return;}
   busy=true;
   const request=new AbortController();controller=request;
   try{
    const response=await fetch("/api/tutor/quota",{cache:"no-store",signal:request.signal});
    if(!response.ok)return;
    const data:Quota=await response.json();
    if(alive&&!request.signal.aborted){
     setNow(Date.now());
     setQuota(previous=>previous&&previous.used===data.used&&previous.quota===data.quota&&previous.remaining===data.remaining&&previous.locked===data.locked&&previous.resetAt===data.resetAt?previous:data);
     lockCallback.current?.(data.locked);
    }
   }catch{/* Keep the last known quota during network interruptions. */}
   finally{busy=false;controller=null;if(queued){queued=false;void refresh();}}
  };
  const onVisibility=()=>{if(document.visibilityState==="hidden")controller?.abort();else void refresh();};
  const onRefresh=()=>void refresh();
  void refresh();
  const interval=window.setInterval(onRefresh,30000);
  document.addEventListener("visibilitychange",onVisibility);
  window.addEventListener("focus",onRefresh);
  window.addEventListener("online",onRefresh);
  window.addEventListener("aunora-progress-updated",onRefresh);
  window.addEventListener("aunora-quota-updated",onRefresh);
  return()=>{
   alive=false;controller?.abort();window.clearInterval(interval);
   document.removeEventListener("visibilitychange",onVisibility);
   window.removeEventListener("focus",onRefresh);
   window.removeEventListener("online",onRefresh);
   window.removeEventListener("aunora-progress-updated",onRefresh);
   window.removeEventListener("aunora-quota-updated",onRefresh);
  };
 },[]);
 if(!quota||quota.quota<0)return null;
 const locked=quota.locked && new Date(quota.resetAt).getTime()>now;
 const completed=conversation?.percent===100;
 return <aside style={{padding:16,borderRadius:16,background:locked?"#fff0e9":"#eef6ff",border:"1px solid #cbdcf5",margin:"12px 0",color:"#173c75"}}>
 <strong>🤖 AI Tutor: {Math.min(quota.used,quota.quota)}/{quota.quota} lượt hôm nay</strong>
 {locked?<p style={{margin:"8px 0"}}>Bạn đã hết lượt sử dụng AI Tutor hôm nay.</p>:<p style={{margin:"8px 0"}}>Còn {quota.remaining} lượt AI hôm nay.</p>}
 {conversation&&<div style={{margin:"12px 0",padding:"12px 14px",borderRadius:12,background:"#ffffffbd"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,fontWeight:700,marginBottom:8}}><span>💬 Hội thoại: {conversation.title}</span><span>{conversation.percent}% / 100%</span></div><div role="progressbar" aria-label="Tiến độ hội thoại với Aivanta" aria-valuenow={conversation.percent} aria-valuemin={0} aria-valuemax={100} style={{height:10,borderRadius:10,overflow:"hidden",background:"#dbe5f5"}}><div style={{width:conversation.percent+"%",height:"100%",background:"#2563eb",borderRadius:10}}/></div></div>}
 <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginTop:10}}><Link href="/learn/library" aria-disabled={locked} tabIndex={locked?-1:0} onClick={e=>{if(locked){e.preventDefault();return;}try{const resume=localStorage.getItem("aunora_last_unfinished_lesson");if(resume){sessionStorage.setItem("aunora_active_lesson",resume);localStorage.setItem("aunora_resume_lesson",resume)}}catch{}}} style={{display:"inline-block",padding:"9px 14px",background:locked?"#d7dce5":"#1d965c",color:locked?"#64748b":"white",borderRadius:10,textDecoration:"none",fontWeight:700,cursor:locked?"not-allowed":"pointer",pointerEvents:locked?"none":"auto"}}>{completed?"🔄 Ôn tập lại":"📚 Tiếp tục học"}</Link><Link href="/learn/plans" style={{display:"inline-block",padding:"9px 14px",background:"#2467ed",color:"white",borderRadius:10,textDecoration:"none",fontWeight:700}}>✨ Nâng cấp gói</Link></div>
 </aside>;
}
