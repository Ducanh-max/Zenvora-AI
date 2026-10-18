"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const questions = [
  { q: "What does “confident” mean?", opts: ["Tự tin", "Lo lắng", "Mệt mỏi"], answer: 0, why: "Confident có nghĩa là tự tin, tin tưởng vào bản thân." },
  { q: "Choose the correct sentence.", opts: ["She go to school.", "She goes to school.", "She going school."], answer: 1, why: "Với chủ ngữ She ở hiện tại đơn, động từ go thêm -es." },
  { q: "“Good morning” is used...", opts: ["Khi tạm biệt", "Buổi sáng để chào hỏi", "Khi xin lỗi"], answer: 1, why: "Good morning là lời chào thường dùng vào buổi sáng." }
];

export default function StarterLesson() {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [resultScore, setResultScore] = useState(0);
  const [done, setDone] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("Đang lưu kết quả...");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("zenvora_lessons").select("id").eq("slug", "greetings").maybeSingle()
      .then(({ data }) => setLessonId(data?.id ?? null));
  }, []);

  useEffect(() => {
    if (!done) return;
    let active = true;
    async function saveResult() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Bạn cần đăng nhập để lưu kết quả.");
        const scorePercent = Math.round((resultScore / questions.length) * 100);
        const { error: attemptError } = await supabase.from("zenvora_quiz_attempts").insert({
          user_id: user.id,
          lesson_id: lessonId,
          score: scorePercent,
          total_questions: questions.length,
          correct_answers: resultScore
        });
        if (attemptError) throw attemptError;
        if (lessonId) {
          const { error: progressError } = await supabase.from("zenvora_lesson_progress").upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            score: scorePercent,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id,lesson_id" });
          if (progressError) throw progressError;
        }
        if (active) setSaveMessage("Kết quả đã được lưu vào tài khoản của bạn.");
      } catch (error) {
        if (active) setSaveMessage(error instanceof Error ? error.message : "Chưa thể lưu kết quả.");
      }
    }
    saveResult();
    return () => { active = false; };
  }, [done, resultScore, lessonId]);

  function next() {
    if (choice === null) return;
    const nextScore = score + (choice === questions[index].answer ? 1 : 0);
    setScore(nextScore);
    if (index === questions.length - 1) {
      setResultScore(nextScore);
      setDone(true);
    } else {
      setIndex(i => i + 1);
      setChoice(null);
    }
  }

  if (done) return <main className="quizpage"><section className="quizcard result">
    <div className="eyebrow">HOÀN THÀNH BÀI HỌC</div>
    <h1>Bạn đã hoàn thành! 🎉</h1>
    <p>Kết quả: <b>{resultScore}/{questions.length}</b> câu trả lời đúng.</p>
    <p className="save-result" aria-live="polite">{saveMessage}</p>
    <Link href="/learn" className="btn">Quay lại khóa học</Link>
  </section></main>;

  const q = questions[index];
  return <main className="quizpage">
    <div className="quiztop"><Link href="/learn"><ArrowLeft size={17}/> Khóa học</Link><span>Bài 01 · English Starter</span></div>
    <section className="quizcard">
      <div className="eyebrow">LUYỆN TẬP TƯƠNG TÁC</div>
      <div className="quizprogress"><i style={{ width: ((index + 1) / questions.length * 100) + "%" }}/></div>
      <small>CÂU HỎI {index + 1}/{questions.length}</small>
      <h1>{q.q}</h1>
      <div className="options">{q.opts.map((option, i) => <button key={option} onClick={() => setChoice(i)} className={choice === i ? "selected" : ""}>{String.fromCharCode(65 + i)}. {option}</button>)}</div>
      {choice !== null && <div className={choice === q.answer ? "feedback good" : "feedback bad"}>{choice === q.answer ? <CheckCircle2/> : <XCircle/>}{q.why}</div>}
      <button className="btn nextbtn" disabled={choice === null} onClick={next}>{index === questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}</button>
    </section>
  </main>;
}
