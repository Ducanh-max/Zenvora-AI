import {sampleLessons} from "./sample-intro-content";
import {formatReviewDate,summarizeReview,type ReviewResult} from "@/lib/review-results";
const tasks=sampleLessons.flatMap(lesson=>lesson.tasks);
export default function ReviewSummary({results,onClose}:{results:ReviewResult[];onClose:()=>void}){
 const stats=summarizeReview(results);
 return <><div className="si-body si-review-summary"><h1>Tổng kết lượt ôn · {stats.total} câu</h1><div className="si-review-stats">
 <p><strong>{stats.selfCorrect}</strong><span>Tự đúng lần đầu</span></p>
 <p><strong>{stats.hadErrors}</strong><span>Câu từng làm sai</span></p>
 <p><strong>{stats.assisted}</strong><span>Câu dùng trợ giúp</span></p>
 </div><p>Đã ghi nhận {stats.wrongAttempts} lượt sai, gồm cả chọn sai trên bảng nối. Câu từng sai và dùng trợ giúp có thể nằm trong cả hai nhóm.</p>
 {stats.typed>0&&<p>{stats.typed} câu chuyển sang luyện viết thay micro. Các câu này không được tính là kết quả luyện nói hay điểm phát âm.</p>}
 <p>Lịch dưới đây là ngày giờ đã lưu cho từng câu, theo giờ Việt Nam (UTC+7).</p>
 <div className="si-review-table-wrap"><table className="si-review-table"><caption>Kết quả và lịch ôn từng câu</caption><thead><tr><th scope="col">Câu</th><th scope="col">Kết quả</th><th scope="col">Lịch trước</th><th scope="col">Ôn tiếp theo</th></tr></thead><tbody>{results.map(result=>{
 const task=tasks.find(t=>t.id===result.taskId);
 return <tr key={result.taskId}><th scope="row">{task?.prompt||result.taskId}{task?.answer&&<small>{task.answer}</small>}{task?.pairs&&<small>{task.pairs.map(pair=>pair.en).join(" · ")}</small>}</th>
 <td>{!result.correct||result.mistakes>0?<span>Từng sai {Math.max(result.mistakes,1)} lượt</span>:result.assisted||result.typedInsteadOfSpeech?<span>Đúng có trợ giúp</span>:<span>Tự đúng lần đầu</span>}
 {(result.assisted||result.typedInsteadOfSpeech)&&<small>Đã dùng trợ giúp</small>}{result.typedInsteadOfSpeech||result.inputMode==="typed"?<small>Luyện viết thay micro · chưa chấm phát âm</small>:result.inputMode==="speech"?<small>Đối chiếu lời nhận dạng qua micro · chưa chấm phát âm</small>:null}</td>
 <td><time dateTime={result.previousDueAt}>{formatReviewDate(result.previousDueAt)}</time></td><td><time dateTime={result.dueAt}>{formatReviewDate(result.dueAt)}</time><small>{!result.correct||result.assisted||result.typedInsteadOfSpeech?"Ôn sớm sau 1 ngày":"Tự nhớ đúng, lịch được giãn dần"}</small></td></tr>;
 })}</tbody></table></div></div><div className="si-bottom"><button type="button" className="si-primary" onClick={onClose}>Về danh sách bài học</button></div></>;
}
