import {NextResponse} from "next/server";
import {session,body,failure,ServiceError} from "@/lib/learner-services-server";
import {publishAnnouncement,sendAnnouncement} from "@/lib/web-push-server";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(request:Request){try{const {client,user}=await session(true);const b=await body(request);if(typeof b.retryId==="string"&&/^[0-9a-f-]{36}$/i.test(b.retryId))return NextResponse.json(await sendAnnouncement(client,b.retryId));const title=String(b.title??"").trim(),message=String(b.body??"").trim(),path=String(b.path??"/courses");if(title.length<3||title.length>120||message.length<3||message.length>500||!["/courses","/learn","/learn/library"].includes(path))throw new ServiceError(400,"Kiểm tra nội dung thông báo.");return NextResponse.json(await publishAnnouncement(client,user.id,title,message,path));}catch(e){return failure(e);}}
