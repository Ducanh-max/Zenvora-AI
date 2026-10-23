"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Quota={used:number;quota:number;remaining:number;locked:boolean;resetAt:string};
export default function TutorQuotaNotice({onLock}:{onLock?:(locked:boolean)=>void}){
 const [quota,setQuota]=useState<Quota|null>(null),[now,setNow]=useState(Date.now());
 useEffect(()=>{let alive=true;const refresh=async()=>{try{const res=await fetch("/api/tutor/quota",{cache:"no-store"});if(!res.ok)return;const data:Quota=await res.json();if(alive){setQuota(data);onLock?.(data.locked)}}catch{}};void refresh();const interval=setInterval(()=>{setNow(Date.now());void refresh()},1000*15);return()=>{alive=false;clearInterval(interval)}},[onLock]);
 if(!quota||quota.quota<0)return null;
 const locked=quota.locked && new Date(quota.resetAt).getTime()>now;
 return <aside style={{padding:16,borderRadius:16,background:locked?"#fff0e9":"#eef6ff",border:"1px solid #cbdcf5",margin:"12px 0",color:"#173c75"}}>
 <strong>🤖 AI Tutor: {Math.min(quota.used,quota.quota)}/{quota.quota} lượt hôm nay</strong>
 {locked?<p style={{margin:"8px 0"}}>Bạn đã hết lượt sử dụng AI Tutor hôm nay.</p>:<p style={{margin:"8px 0"}}>Còn {quota.remaining} lượt AI hôm nay.</p>}
 <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginTop:10}}><Link href="/learn/library" aria-disabled={locked} tabIndex={locked?-1:0} onClick={e=>{if(locked){e.preventDefault();return;}try{const resume=sessionStorage.getItem("aunora_last_unfinished_lesson");if(resume)sessionStorage.setItem("aunora_active_lesson",resume)}catch{}}} style={{display:"inline-block",padding:"9px 14px",background:locked?"#d7dce5":"#1d965c",color:locked?"#64748b":"white",borderRadius:10,textDecoration:"none",fontWeight:700,cursor:locked?"not-allowed":"pointer",pointerEvents:locked?"none":"auto"}}>📚 Tiếp tục học</Link><Link href="/learn/plans" style={{display:"inline-block",padding:"9px 14px",background:"#2467ed",color:"white",borderRadius:10,textDecoration:"none",fontWeight:700}}>✨ Nâng cấp gói</Link></div>
 </aside>;
}
