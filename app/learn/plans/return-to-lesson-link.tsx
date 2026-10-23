"use client";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";
export default function ReturnToLessonLink(){
 return <Link href="/learn/library" className="ap-back" onClick={()=>{try{sessionStorage.setItem("aunora_returning_to_lesson","1")}catch{}}}><ArrowLeft size={18}/> Trở lại bài học</Link>;
}
