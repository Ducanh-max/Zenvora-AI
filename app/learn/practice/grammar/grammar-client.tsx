"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,BookOpen,CheckCircle2,RotateCcw,Sparkles,ChevronRight} from "lucide-react";
import "./grammar.css";
type Topic={title:string;rule:string;question:string;answer:string;wrong:string[];explain:string};
function playAnswerSound(ok:boolean){try{const AudioCtx=window.AudioContext;const ctx=new AudioCtx();if(ctx.state==="suspended")void ctx.resume();const notes=ok?[659.25,880,1046.5]:[330,261.63];notes.forEach((hz,i)=>{const osc=ctx.createOscillator();const gain=ctx.createGain();const t=ctx.currentTime+i*.13;osc.type=ok?"sine":"triangle";osc.frequency.setValueAtTime(hz,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(ok?.16:.11,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+.19);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.2)});window.setTimeout(()=>{void ctx.close().catch(()=>{})},1000)}catch{}}
const raw=[
["Hiện tại đơn","Dùng để nói về thói quen, sự thật. Với he/she/it, động từ thường thêm -s/-es.","She ___ to school every day.","goes","go","going","Chủ ngữ She ở hiện tại đơn dùng goes."],
["Hiện tại tiếp diễn","am/is/are + động từ -ing diễn tả việc đang xảy ra.","They ___ football right now.","are playing","play","plays","They đi với are và động từ playing."],
["Quá khứ đơn","Dùng V2/ed cho hành động đã kết thúc trong quá khứ.","I ___ my grandma yesterday.","visited","visit","visiting","Yesterday là dấu hiệu quá khứ đơn: visited."],
["Tương lai đơn","Will + động từ nguyên mẫu dùng cho dự đoán hoặc quyết định.","I ___ call you tomorrow.","will","am","did","Will + call diễn tả hành động tương lai."],
["Mạo từ a / an","Dùng an trước âm nguyên âm; a trước âm phụ âm.","She has ___ umbrella.","an","a","the a","Umbrella bắt đầu bằng âm nguyên âm nên dùng an."],
["Giới từ chỉ thời gian","In cho tháng/năm; on cho ngày; at cho giờ.","My birthday is ___ July.","in","on","at","Tháng July đi với giới từ in."],
["Động từ to be","I am; he/she/it is; you/we/they are.","My friends ___ happy.","are","is","am","Friends là số nhiều nên dùng are."],
["Động từ khuyết thiếu can","Can + động từ nguyên mẫu, không thêm -s.","He can ___ English.","speak","speaks","speaking","Sau can dùng động từ nguyên mẫu speak."],
["Many và much","Many đi với danh từ đếm được; much đi với không đếm được.","How ___ books are there?","many","much","little","Books đếm được số nhiều nên dùng many."],
["Quá khứ của động từ thường","Động từ có quy tắc thường thêm -ed ở quá khứ.","We ___ the museum last week.","visited","visit","visits","Last week cần thì quá khứ: visited."],
["Tính từ sở hữu","My, your, his, her, our, their đứng trước danh từ.","This is ___ bag. (Tôi)","my","me","mine","My đứng trước danh từ bag."],
["So sánh hơn","Tính từ ngắn thường thêm -er + than.","My brother is ___ than me.","taller","tall","tallest","Có than nên dùng so sánh hơn taller."],
["Danh từ đếm được","Danh từ đếm được có dạng số ít và số nhiều.","I need three ___.","apples","apple","an apple","Sau three cần danh từ số nhiều apples."],
["Động từ bất quy tắc","Một số động từ có dạng quá khứ riêng, ví dụ go → went.","She ___ home early yesterday.","went","goed","goes","Quá khứ của go là went."],
["Giới từ chỉ nơi chốn","At thường chỉ điểm; in chỉ bên trong; on chỉ bề mặt.","The keys are ___ the table.","on","in","at","Đồ vật nằm trên bề mặt bàn dùng on."],
["Mạo từ the","The chỉ đối tượng xác định, người nghe đã biết.","Please close ___ door. (Cánh cửa đang nói đến)","the","a","an","Dùng the vì cánh cửa đã xác định."],
["Be going to","Am/is/are going to + V diễn tả dự định.","She ___ going to study tonight.","is","are","am","She đi với is."],
["Must và mustn't","Must: phải; mustn't: không được.","You ___ wear a helmet on a bike.","must","mustn't","can’t to","Must diễn tả yêu cầu cần tuân thủ."],
["Từ để hỏi","Where hỏi nơi chốn; when hỏi thời gian; who hỏi người.","___ do you live?","Where","Who","Why","Where dùng để hỏi nơi ở."],
["Trạng từ tần suất","Always, usually, often, sometimes diễn tả mức độ thường xuyên.","I ___ brush my teeth before bed.","always","yesterday","tomorrow","Always là trạng từ tần suất."],
["Phủ định hiện tại đơn","Don't/doesn't + động từ nguyên mẫu.","He ___ like coffee.","doesn't","don't","isn't","He ở hiện tại đơn dùng doesn't."],
["Câu hỏi hiện tại đơn","Do/Does + chủ ngữ + động từ nguyên mẫu?","___ she play tennis?","Does","Do","Is","She dùng trợ động từ Does."],
["Quá khứ tiếp diễn","Was/were + V-ing diễn tả việc đang xảy ra trong quá khứ.","I ___ reading at 8 p.m. yesterday.","was","am","were","I ở quá khứ tiếp diễn dùng was."],
["Hiện tại hoàn thành","Have/has + V3 diễn tả trải nghiệm hoặc kết quả.","She ___ finished her homework.","has","have","is","She dùng has + V3."],
["Since và for","Since đi với mốc thời gian; for đi với khoảng thời gian.","I've lived here ___ 2020.","since","for","during","2020 là mốc thời gian nên dùng since."],
["So sánh nhất","The + tính từ ngắn -est; hoặc the most + tính từ dài.","This is ___ book in the shop.","the cheapest","cheaper","cheap","So sánh nhất cần the cheapest."],
["Câu điều kiện loại 1","If + hiện tại đơn, will + V cho khả năng có thể xảy ra.","If it rains, I ___ stay home.","will","would","am","Điều kiện loại 1 dùng will ở mệnh đề chính."],
["Câu điều kiện loại 2","If + quá khứ đơn, would + V cho tình huống giả định.","If I had wings, I ___ fly.","would","will","am","Giả định không có thật dùng would."],
["Câu bị động hiện tại","Am/is/are + V3 khi nhấn mạnh đối tượng chịu tác động.","English ___ spoken worldwide.","is","are","be","English là danh từ số ít, dùng is spoken."],
["Câu bị động quá khứ","Was/were + V3 trong quá khứ.","The bridge ___ built in 1990.","was","is","were","In 1990 là quá khứ, bridge số ít: was."],
["Mệnh đề quan hệ who","Who thay cho người trong mệnh đề quan hệ.","The girl ___ won is my friend.","who","which","where","Who dùng để chỉ người."],
["Mệnh đề quan hệ which","Which thay cho vật trong mệnh đề quan hệ.","The book ___ I bought is great.","which","who","where","Book là vật nên dùng which."],
["Gerund – V-ing","Sau enjoy thường dùng động từ thêm -ing.","I enjoy ___ books.","reading","read","to readed","Sau enjoy dùng V-ing: reading."],
["Động từ nguyên mẫu to V","Sau want thường dùng to + động từ nguyên mẫu.","They want ___ English.","to learn","learning","learned","Want + to V: to learn."],
["Câu gián tiếp","Lùi thì khi thuật lại lời nói ở quá khứ (tùy ngữ cảnh).","He said he ___ tired.","was","isn't","are","Lời nói được thuật lại ở quá khứ: was."],
["Câu hỏi đuôi","Mệnh đề khẳng định thường đi với đuôi phủ định.","You are a student, ___?","aren't you","are you","don't you","You are → aren't you."],
["Too và enough","Too + adj: quá; adj + enough: đủ.","The tea is ___ hot to drink.","too","enough","many","Too hot to drink nghĩa là quá nóng để uống."],
["Although và because","Although diễn tả tương phản; because diễn tả nguyên nhân.","___ it rained, we went out.","Although","Because of","So","Although + mệnh đề diễn tả sự tương phản."],
["Used to","Used to + V diễn tả thói quen trong quá khứ.","I ___ play outside as a child.","used to","use to","am used","Used to diễn tả thói quen trước đây."],
["Ôn tập tổng hợp","Chọn dạng động từ đúng theo dấu hiệu thời gian.","Look! The baby ___ sleeping.","is","are","was","Look! báo hiệu hiện tại tiếp diễn; baby số ít dùng is."]
] as const;
const topics:Topic[]=raw.map(([title,rule,question,answer,w1,w2,explain])=>({title,rule,question,answer,wrong:[w1,w2],explain}));
const scramble=(items:string[],seed:number)=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=(seed*17+i*7)%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out};
export default function GrammarClient(){
 const [selected,setSelected]=useState<number|null>(null),[step,setStep]=useState(0),[choice,setChoice]=useState<string|null>(null),[score,setScore]=useState(0),[done,setDone]=useState(false),[history,setHistory]=useState<Record<string,number>>({});
 useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem("aunora-grammar-v1")||"{}"))}catch{}},[]);
 const topic=selected===null?null:topics[selected];
 const open=(n:number)=>{setSelected(n);setStep(0);setChoice(null);setScore(0);setDone(false)};
 const quiz=selected===null?[]:Array.from({length:10},(_,i)=>topics[i===0?selected:(selected+((i*7)%39)+1)%topics.length]);
 const activeQuestion=quiz[step];
 const question=activeQuestion?.question||"";
 const options=activeQuestion?scramble([activeQuestion.answer,...activeQuestion.wrong],(selected||0)+step):[];
 const correct=choice===activeQuestion?.answer;
 function advance(){if(!topic||selected===null)return;if(step===9){setDone(true);const next={...history,[selected]:Math.max(history[selected]||0,score)};setHistory(next);try{localStorage.setItem("aunora-grammar-v1",JSON.stringify(next))}catch{}}else{setStep(1);setChoice(null)}}
 return <main className="gr-app"><header className="gr-top"><Link href="/learn/practice"><ArrowLeft size={19}/> Luyện tập</Link><b>AUNORA <span>· Ngữ pháp</span></b></header><div className="gr-wrap"><section className="gr-hero"><div><span className="gr-tag">✦ GRAMMAR ACADEMY</span><h1>Chinh phục ngữ pháp<br/><em>cùng Aivanta</em></h1><p>40 bài học từ cơ bản đến nâng cao, mỗi bài có 10 câu hỏi gồm câu trọng tâm và ôn tập.</p><div className="gr-hero-tags"><span>📘 40 bài học</span><span>✨ Giải thích dễ hiểu</span><span>🎯 Luyện tập tức thì</span></div></div><img src="/brand/aivanta-mascot.webp.png" alt="Aivanta"/></section>
 {selected===null?<section className="gr-panel"><div className="gr-heading"><div><h2>📚 Lộ trình ngữ pháp</h2><p>Chọn một bài để học kiến thức và luyện tập.</p></div><span>{Object.keys(history).length}/40 bài đã luyện</span></div><div className="gr-grid">{topics.map((t,i)=><button key={i} className="gr-card" onClick={()=>open(i)}><div className="gr-number">{String(i+1).padStart(2,"0")}</div><div><strong>{t.title}</strong><small>{i<10?"Cơ bản":i<25?"Trung cấp":"Nâng cao"} · {history[i]!==undefined?"Đã luyện · "+history[i]+"/10":"Chưa học"}</small></div><ChevronRight size={20}/></button>)}</div></section>:
 <section className="gr-panel gr-lesson"><button className="gr-back" onClick={()=>setSelected(null)}><ArrowLeft size={17}/> Danh sách bài học</button><div className="gr-heading"><div><span className="gr-tag">BÀI {selected+1} / 40</span><h2>{topic?.title}</h2></div><span>✦ Aivanta Academy</span></div><div className="gr-rule"><div>💡</div><div><strong>Ghi nhớ kiến thức</strong><p>{topic?.rule}</p></div></div>{done?<div className="gr-finish"><CheckCircle2 size={60}/><h2>Hoàn thành bài học!</h2><p>Bạn trả lời đúng {score}/10 câu. Tiếp tục luyện tập để ghi nhớ ngữ pháp nhé!</p><div><button className="gr-primary" onClick={()=>open(selected)}><RotateCcw size={17}/> Luyện lại</button><button className="gr-secondary" onClick={()=>selected<39?open(selected+1):setSelected(null)}> {selected<39?"Bài tiếp theo":"Danh sách bài"} <ArrowRight size={17}/></button></div></div>:<div className="gr-question"><div className="gr-progress"><strong>Câu hỏi {step+1}/10</strong><span>{(step+1)*10}%</span></div><div className="gr-track"><i style={{width:(step+1)*10+"%"}}/></div><span className="gr-instruction">{step===0?"Câu hỏi trọng tâm bài học":"Ôn tập ngữ pháp liên quan"}</span><h3>{question}</h3><div className="gr-options">{options.map(o=><button key={o} disabled={choice!==null} onClick={()=>{setChoice(o);playAnswerSound(o===activeQuestion?.answer);if(o===activeQuestion?.answer)setScore(v=>v+1)}} className={choice!==null&&o===activeQuestion?.answer?"right":choice===o?"wrong":""}>{o}{choice!==null&&o===activeQuestion?.answer?" ✓":""}</button>)}</div>{choice!==null&&<div className={correct?"gr-feedback right":"gr-feedback wrong"}><strong>{correct?"🎉 Chính xác!":"💡 Chưa chính xác"}</strong><p>{activeQuestion?.explain}</p><button className="gr-primary" onClick={advance}>{step===9?"Xem kết quả":"Tiếp theo"} <ArrowRight size={17}/></button></div>}</div>}</section>}
 </div></main>
}
