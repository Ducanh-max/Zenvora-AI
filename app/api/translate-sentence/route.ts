import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const cache=new Map<string,string>();
export async function GET(request:NextRequest){
 const sentence=(request.nextUrl.searchParams.get("text")||"").trim();
 if(!sentence||sentence.length>400)return NextResponse.json({translation:null},{status:400});
 const key=sentence.toLowerCase();
 if(cache.has(key))return NextResponse.json({translation:cache.get(key)});
 try{
  const url="https://api.mymemory.translated.net/get?langpair=en%7Cvi&q="+encodeURIComponent(sentence);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  let response:Response;
  try{response=await fetch(url,{signal:controller.signal,next:{revalidate:86400}});}finally{clearTimeout(timer);}
  if(!response.ok)throw new Error("Translation service unavailable");
  const data=await response.json();
  const translation=typeof data?.responseData?.translatedText==="string"?data.responseData.translatedText.trim():"";
  if(data?.responseStatus!==200||!translation||translation.toLowerCase()===sentence.toLowerCase()||/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translation))return NextResponse.json({translation:null});
  if(cache.size>1000)cache.clear();
  cache.set(key,translation);
  return NextResponse.json({translation});
 }catch{return NextResponse.json({translation:null});}
}
