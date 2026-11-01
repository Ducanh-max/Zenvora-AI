"use client";
import {useEffect,useRef,useState} from "react";
import {sampleLessons,type Task} from "./sample-intro-content";
import {Exercise} from "./sample-intro-lesson";
import ReviewSummary from "./review-summary";
import {formatReviewDate,type ReviewResult} from "@/lib/review-results";
type Item={task_id:string;due_at:string;streak:number};
type Pending=Omit<ReviewResult,"dueAt"|"streak">;
const tasks=sampleLessons.flatMap(lesson=>lesson.tasks);
export default function ScheduledReview({refresh=0}:{refresh?:number}){
 const [items,setItems]=useState<Item[]>([]),[queue,setQueue]=useState<Task[]>([]),[active,setActive]=useState(false),[error,setError]=useState(""),[pending,setPending]=useState<Pending|null>(null),[busy,setBusy]=useState(false),[results,setResults]=useState<ReviewResult[]>([]);
 const saving=useRef(false);
 useEffect(()=>{let cancelled=false;fetch("/api/lesson-review",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(!cancelled){setItems(d.items);setError("");}}).catch(()=>{if(!cancelled)setError("Chưa tải được lịch ôn. Tải lại trang để thử lại.");});return()=>{cancelled=true;};},[refresh]);
 async function save(attempt:Pending){
 if(saving.current)return;saving.current=true;setBusy(true);setError("");setPending(attempt);
 try{
 const r=await fetch("/api/lesson-review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"review",attempts:[{taskId:attempt.taskId,correct:attempt.correct,assisted:attempt.assisted}]})});
 const data=await r.json();if(!r.ok)throw Error(data.error||"Chưa lưu được kết quả ôn.");
 const saved:Item|undefined=data.items?.find((item:Item)=>item.task_id===attempt.taskId);
 if(!saved||!Number.isFinite(Date.parse(saved.due_at)))throw Error("Chưa nhận được lịch ôn đã lưu.");
 setResults(old=>[...old.filter(row=>row.taskId!==attempt.taskId),{...attempt,dueAt:saved.due_at,streak:saved.streak}]);
 setItems(old=>[...old.filter(item=>item.task_id!==attempt.taskId),saved].sort((a,b)=>Date.parse(a.due_at)-Date.parse(b.due_at)));
 setQueue(old=>old.filter(task=>task.id!==attempt.taskId));setPending(null);
 }catch(error){setError(error instanceof Error?error.message:"Chưa lưu được kết quả ôn. Nhấn thử lại.");}finally{saving.current=false;setBusy(false);}
 }
 const scheduled=items.filter(item=>tasks.some(task=>task.id===item.task_id));
 const due=scheduled.filter(item=>Date.parse(item.due_at)<=Date.now());
 if(active)return <section className="si-screen"><header><button type="button" disabled={busy} onClick={()=>{setActive(false);setError("");}}>← Về bài học</button><b>Ôn cách ngày · {queue.length?"còn "+queue.length+" câu":"tổng kết"}</b></header><div className="si-meta">Tự nhớ trước, mở gợi ý khi cần · Câu sai hoặc dùng gợi ý sẽ trở lại sau 1 ngày</div>{busy||pending?<div className="si-finish"><p role="status">{busy?"Đang lưu…":error}</p>{!busy&&<button type="button" onClick={()=>pending&&void save(pending)}>Thử lại</button>}</div>:queue.length?<Exercise key={queue[0].id} assessment task={queue[0]} newWords={[]} onDone={(correct,_response,assisted,evidence)=>{
 const item=items.find(item=>item.task_id===queue[0].id);if(!item)return;
 void save({taskId:queue[0].id,correct:evidence?.firstTryCorrect??correct,assisted:assisted||Boolean(evidence?.typedInsteadOfSpeech),mistakes:evidence?.mistakes??(correct?0:1),inputMode:evidence?.inputMode,typedInsteadOfSpeech:evidence?.typedInsteadOfSpeech,previousDueAt:item.due_at});
 }}/>:<ReviewSummary results={results} onClose={()=>setActive(false)}/>}</section>;
 return <aside className="si-review-card"><h2>Ôn cách ngày</h2>{error?<p role="status">{error}</p>:queue.length?<><p>Còn {queue.length} câu trong lượt đang ôn. Đã lưu {results.length} câu.</p><button type="button" onClick={()=>setActive(true)}>Tiếp tục lượt ôn →</button></>:due.length?<><p>{due.length} câu đã đến lịch ôn.</p><button type="button" onClick={()=>{setQueue(due.flatMap(item=>{const task=tasks.find(task=>task.id===item.task_id);return task?[task]:[];}).slice(0,12));setResults([]);setPending(null);setActive(true);}}>Ôn tối đa 12 câu →</button></>:scheduled.length?<p>Lần ôn tiếp theo: {formatReviewDate(scheduled[0].due_at)}. Lịch giãn dần 1, 3, 7, 14, 30 ngày khi tự làm đúng.</p>:<p>Học xong một bài để bắt đầu lịch ôn riêng của bạn.</p>}
 {!queue.length&&results.length>0&&<button type="button" onClick={()=>setActive(true)}>Xem tổng kết lượt ôn vừa xong</button>}
 {scheduled.length>0&&<details className="si-schedule-list"><summary>Lịch ôn từng câu · {scheduled.length} câu</summary><p>Giờ Việt Nam (UTC+7). Lịch được cập nhật sau mỗi câu đã lưu.</p><ol>{scheduled.map(item=>{const task=tasks.find(task=>task.id===item.task_id);return <li key={item.task_id}><span>{task?.prompt}</span><time dateTime={item.due_at}>{formatReviewDate(item.due_at)}{Date.parse(item.due_at)<=Date.now()?" · Đến hạn":""}</time></li>;})}</ol></details>}</aside>;
}
