import {createClient} from "@/lib/supabase/server";
import {getMembership} from "@/lib/membership";
import VocabularyClient from "./vocabulary-client";
export const dynamic="force-dynamic";
export default async function VocabularyPracticePage(){
 const {plan,isAdmin}=await getMembership();
 const db=await createClient();
 const [{data:courses,error:ce},{data:lessons,error:le}]=await Promise.all([
  db.from("zenvora_courses").select("id,slug,title,is_free,sort_order").order("sort_order"),
  db.from("zenvora_lessons").select("course_id,sort_order,content").eq("is_published",true).order("sort_order")
 ]);
 if(ce||le)return <main style={{padding:32}}>Không thể tải từ vựng. Vui lòng thử lại.</main>;
 const visible=(courses||[]).filter(c=>c.is_free||isAdmin||plan!=="free");
 const ids=new Set(visible.map(c=>c.id));
 const words:Record<string,{word:string;meaning:string}[]>={};
 for(const lesson of lessons||[]){
  if(!ids.has(lesson.course_id))continue;
  const content=lesson.content as {vocabulary?:{word?:string;meaning?:string}[]}|null;
  for(const item of content?.vocabulary||[]){
   if(typeof item.word!=="string"||typeof item.meaning!=="string"||!item.word.trim()||!item.meaning.trim())continue;
   (words[lesson.course_id]??=[]).push({word:item.word.trim(),meaning:item.meaning.trim()});
  }
 }
 return <VocabularyClient courses={visible.map(c=>({id:c.id,slug:c.slug,title:c.title,words:words[c.id]||[]}))}/>;
}
