"use client";
import Link from "next/link";
export default function ResumeLesson({slug,course}:{slug:string;course:string}){return <Link href={`/learn/library?course=${encodeURIComponent(course)}`} onClick={()=>{try{sessionStorage.setItem('aunora_active_lesson',JSON.stringify({slug,course}));}catch{}}}>Tiếp tục bài học →</Link>;}
