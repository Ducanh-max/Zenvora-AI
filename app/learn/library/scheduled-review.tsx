"use client";
import {useEffect,useState} from "react";
import {sampleLessons,type Task} from "./sample-intro-content";
import {Exercise} from "./sample-intro-lesson";
type Item={task_id:string;due_at:string;streak:number};
export default function ScheduledReview({refresh=0}:{refresh?:number}){
 const [items,setItems]=useState<Item[]>([]),[queue,setQueue]=useState<Task[]>([]),[active,setActive]=useState(false),[error,setError]=useState(""),[pending,setPending]=useState<{taskId:string;correct:boolean;assisted:boolean}|null>(null),[busy,setBusy]=useState(false);
 useEffect(()=>{let cancelled=false;fetch("/api/lesson-review",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(!cancelled){setItems(d.items);setError("");}}).catch(()=>{if(!cancelled)setError("Chưa tải được lịch ôn. Tải lại trang để thử lại.");});return()=>{cancelled=true;};},[refresh]);
 async function save(attempt:{taskId:string;correct:boolean;assisted:boolean}){
 if(busy)return;setBusy(true);setError("");setPending(attempt);
 try{const r=await fetch("/api/lesson-review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"review",attempts:[attempt]})});if(!r.ok)throw Error();setQueue(q=>q.slice(1));setItems(old=>old.filter(i=>i.task_id!==attempt.taskId));setPending(null);}catch{setError("Chưa lưu được kết quả ôn. Nhấn thử lại.");}finally{setBusy(false);}
 }
 const due=items.filter(item=>Date.parse(item.due_at)<=Date.now());
 if(active)return <section className="si-screen"><header><button type="button" onClick={()=>{setActive(false);setPending(null);setError("");}}>← Về bài học</button><b>Ôn cách ngày · còn {queue.length} câu</b></header><div className="si-meta">Tự nhớ trước, mở gợi ý khi cần · Câu sai hoặc dùng gợi ý sẽ trở lại sau 1 ngày</div>{busy||pending?<div className="si-finish"><p>{busy?"Đang lưu…":error}</p>{!busy&&<button type="button" onClick={()=>pending&&void save(pending)}>Thử lại</button>}</div>:queue.length?<Exercise key={queue[0].id} assessment task={queue[0]} newWords={[]} onDone={(correct,_response,assisted,evidence)=>void save({taskId:queue[0].id,correct:evidence?.firstTryCorrect??correct,assisted})}/>:<div className="si-finish"><h1>Đã hoàn thành lượt ôn</h1><p>Lần ôn tiếp theo đã được lưu theo từng câu. Câu tự làm đúng sẽ dần cách xa hơn.</p><button type="button" className="si-primary" onClick={()=>setActive(false)}>Về danh sách bài học</button></div>}</section>;
 return <aside className="si-review-card"><h2>Ôn cách ngày</h2>{error?<p role="status">{error}</p>:due.length?<><p>{due.length} câu đã đến lịch ôn.</p><button type="button" onClick={()=>{const tasks=sampleLessons.flatMap(l=>l.tasks);setQueue(due.flatMap(i=>{const task=tasks.find(t=>t.id===i.task_id);return task?[task]:[];}).slice(0,12));setActive(true);}}>Ôn tối đa 12 câu →</button></>:items.length?<p>Lần ôn tiếp theo: {new Date(items[0].due_at).toLocaleDateString("vi-VN")}. Lịch giãn dần 1, 3, 7, 14, 30 ngày khi tự làm đúng.</p>:<p>Học xong một bài để bắt đầu lịch ôn riêng của bạn.</p>}</aside>;
}
