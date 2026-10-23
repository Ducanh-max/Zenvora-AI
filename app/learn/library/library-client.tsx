"use client";

import Link from "next/link";
import LessonTutor from "./lesson-tutor";
import LessonPractice from "./lesson-practice";
import AdventureLesson from "./adventure-lesson";
import "./course-design.css";
import "./adventure-lesson.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, RotateCcw, Trophy, Volume2, XCircle } from "lucide-react";

type Vocabulary = { word: string; meaning: string; pronunciation?: string; example: string };
type Example = { english: string; vietnamese: string };
type Question = { q: string; options: string[]; answer: number; explain: string; translation?: string; optionExplains?: string[] };
export type LibraryCourse = { id: string; slug: string; title: string; level: string; description: string; is_free: boolean; sort_order: number };
export type LibraryLesson = { id: string; course_id: string; slug: string; title: string; summary: string; sort_order: number; content: { vocabulary?: Vocabulary[]; examples?: Example[]; questions?: Question[]; lesson_goal?: string; grammar?: {title?:string;explanation?:string;examples?:Example[]}; dialogue?:{speaker:string;english:string;vietnamese?:string}[] } };
type Progress = { lesson_id: string; completed: boolean; score: number; total_questions: number };

function buildQuestionBank(lesson: LibraryLesson): Question[] {
  const base = Array.isArray(lesson.content?.questions) ? lesson.content.questions : [];
  return base
    .filter(question =>
      Array.isArray(question.options) &&
      (question.options.length === 3 || question.options.length === 4) &&
      question.options.every(option => typeof option === "string" && option.trim().length > 0) &&
      new Set(question.options.map(option => option.trim().toLowerCase())).size === question.options.length &&
      Number.isInteger(question.answer) &&
      question.answer >= 0 &&
      question.answer < question.options.length
    )
    .map(question => {
      // "All of the above" depends on the other choices, so keep it in D.
      const hasAllAbove = question.options.length === 4 && question.options[3].trim().toLowerCase() === "all of the above";
      if (hasAllAbove) return question;
      const order = question.options.map((_, index) => index);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return {
        ...question,
        options: order.map(index => question.options[index]),
        answer: order.indexOf(question.answer),
        optionExplains: question.optionExplains
          ? order.map(index => question.optionExplains?.[index] || "")
          : undefined,
      };
    })
    .sort(() => Math.random() - 0.5);
}

export default function LibraryClient({ courses, lessons, progress, quizSize, initialCourseSlug }: { courses: LibraryCourse[]; lessons: LibraryLesson[]; progress: Progress[]; quizSize: number; initialCourseSlug?: string }) {
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(() => courses.some(course => course.slug === initialCourseSlug) ? initialCourseSlug! : null);
  const [isEnglish, setIsEnglish] = useState(false);
  useEffect(() => {
    const readLanguage = () => {
      const htmlLanguage = document.documentElement.lang.toLowerCase();
      if (htmlLanguage.startsWith("en")) { setIsEnglish(true); return; }
      if (htmlLanguage.startsWith("vi")) { setIsEnglish(false); return; }
      try {
        const languageEntry = Object.entries(localStorage).find(([key]) => /language|locale|lang/i.test(key));
        const value = String(languageEntry?.[1] || "").toLowerCase();
        setIsEnglish(value === "en" || value.startsWith("english") || value.startsWith("en-"));
      } catch { setIsEnglish(false); }
    };
    readLanguage();
    window.addEventListener("storage", readLanguage);
    return () => window.removeEventListener("storage", readLanguage);
  }, []);
  const [selected, setSelected] = useState<LibraryLesson | null>(null);
  const [enteringLesson, setEnteringLesson] = useState<LibraryLesson | null>(null);
  useEffect(()=>{try{const saved=sessionStorage.getItem("aunora_active_lesson");if(!saved)return;const item=JSON.parse(saved) as {slug:string;course:string};const found=lessons.find(l=>l.slug===item.slug&&courses.some(c=>c.id===l.course_id&&c.slug===item.course));if(found){setSelectedCourseSlug(item.course);setSelected(found);sessionStorage.removeItem("aunora_active_lesson");}}catch{}},[lessons,courses]);
  useEffect(()=>{if(selected){try{sessionStorage.setItem("aunora_active_lesson",JSON.stringify({slug:selected.slug,course:selectedCourseSlug}));}catch{}}},[selected,selectedCourseSlug]);
  function openLesson(lesson: LibraryLesson) {
    setEnteringLesson(lesson);
    window.setTimeout(() => { setSelected(lesson); setMode("learn"); setEnteringLesson(null); }, 550);
  }
  const [mode, setMode] = useState<"learn" | "quiz" | "result">("learn");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(progress.filter(p => p.completed).map(p => p.lesson_id));
  const questions = useMemo(() => selected ? buildQuestionBank(selected).slice(0, quizSize) : [], [selected, quizSize]);
  const question = questions[questionIndex];

  function startQuiz() { setMode("quiz"); setQuestionIndex(0); setChoice(null); setAnswered(false); setScore(0); setNotice(""); }
  function submitAnswer() {
    if (choice === null || answered || !question) return;
    setAnswered(true);
    if (choice === question.answer) setScore(value => value + 1);
  }
  function nextQuestion() {
    if (questionIndex < questions.length - 1) { setQuestionIndex(value => value + 1); setChoice(null); setAnswered(false); }
    else setMode("result");
  }
  async function saveProgress(): Promise<boolean> {
    if (!selected) return false;
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/lesson-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: selected.slug, courseId: selectedCourseSlug || "english-starter", score, totalQuestions: questions.length }) });
      if (!response.ok) throw new Error("Không thể đồng bộ tiến độ. Hãy thử lại.");
      setDone(previous => previous.includes(selected.slug) ? previous : [...previous, selected.slug]);
      setNotice("Đã lưu kết quả học tập của bạn.");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu kết quả.");
      return false;
    } finally { setSaving(false); }
  }
  function resetLesson() { try{sessionStorage.removeItem("aunora_active_lesson")}catch{} setSelected(null); setMode("learn"); setNotice(""); }

  const activeCourse = courses.find(course => course.slug === selectedCourseSlug) || null;
  const courseLessons = activeCourse ? lessons.filter(lesson => lesson.course_id === activeCourse.id).sort((a, b) => a.sort_order - b.sort_order) : [];
  const currentLessonIndex = selected ? courseLessons.findIndex(lesson => lesson.id === selected.id) : -1;
  const nextLesson = currentLessonIndex >= 0 ? courseLessons[currentLessonIndex + 1] || null : null;
  function goToNextLesson() {
    if (!nextLesson) return;
    setSelected(nextLesson);
    setMode("learn");
    setQuestionIndex(0);
    setChoice(null);
    setAnswered(false);
    setScore(0);
    setNotice("");
  }
  async function saveAndGoNext() {
    if (!nextLesson) return;
    const saved = await saveProgress();
    if (saved) goToNextLesson();
  }
  const availableQuestionCount = selected ? buildQuestionBank(selected).length : 0;

  if (enteringLesson) {
    return <section className="aunora-loading" aria-live="polite" aria-busy="true"><div className="aunora-loading-card" role="status"><img className="aunora-loading-wolf" src="/brand/aivanta-mascot.webp.png" alt=""/><h1 className="aunora-loading-title">Aivanta đang chuẩn bị bài học...</h1><p className="aunora-loading-desc">Sẵn sàng khám phá: {enteringLesson.title} 🐺</p><div className="aunora-loading-track" aria-hidden="true"><div className="aunora-loading-bar"/></div></div></section>;
  }
  if (selected && (selected.content.vocabulary || []).length >= 3) {
    return <AdventureLesson lesson={{id:selected.id,title:selected.title,words:selected.content.vocabulary||[],dialogue:selected.content.dialogue,goal:selected.content.lesson_goal}} onExit={resetLesson} onFinish={async(correct,total)=>{setScore(correct);setSaving(true);try{const response=await fetch("/api/lesson-progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:selected.slug,courseId:selectedCourseSlug,score:correct,totalQuestions:total})});if(!response.ok)throw new Error("Không thể lưu tiến độ");setDone(previous=>previous.includes(selected.slug)?previous:[...previous,selected.slug]);resetLesson();}finally{setSaving(false);}}}/>;
  }
  if (selected) {
    const content = selected.content || {};
    return <section className="library-study">
      <button className="library-back" onClick={resetLesson}><ArrowLeft size={16}/> Tất cả bài học</button>
      {mode === "learn" && <>
        <div className="eyebrow">BÀI HỌC · {selected.sort_order}</div><h2>{selected.title}</h2><p>{selected.summary}</p>
        <LessonPractice key={selected.id} lessonId={selected.id} title={selected.title} words={content.vocabulary||[]}/>
        <div style={{padding:"16px",margin:"16px 0",borderRadius:14,background:"#eaf3ff",color:"#153c78"}}><strong>🐉 AI Tutor Aivanta đồng hành cùng bạn</strong><p>Hỏi AI về 5 từ mới, luyện hội thoại và nhờ sửa câu tiếng Anh của bài này.</p><Link href={"/learn/tutor?lesson="+encodeURIComponent(selected.title)+"&words="+encodeURIComponent((content.vocabulary||[]).map(v=>v.word).join(", "))} style={{display:"inline-block",background:"#2468e8",color:"white",padding:"10px 15px",borderRadius:10,textDecoration:"none",fontWeight:700}}>💬 Luyện bài này với AI Tutor →</Link></div><h3>Từ vựng trọng tâm (5 từ)</h3><div className="library-vocab">{(content.vocabulary || []).map(item => <article key={item.word}><div><b>{item.word}</b><button aria-label={`Nghe phát âm ${item.word}`} onClick={() => { if ("speechSynthesis" in window) { const speech = new SpeechSynthesisUtterance(item.word); speech.lang = "en-US"; window.speechSynthesis.speak(speech); } }}><Volume2 size={15}/></button></div><span>{item.pronunciation || ""}</span><p>{item.meaning}</p><small>{item.example}</small></article>)}</div>
        <h3>Ví dụ giao tiếp</h3><div className="library-examples">{(content.examples || []).map((item, index) => <article key={index}><b>{item.english}</b><span>{item.vietnamese}</span></article>)}</div>
        {content.grammar && <div style={{background:"#f1f6ff",borderRadius:14,padding:18,marginTop:20}}><h3>📘 Ngữ pháp ứng dụng</h3><b>{content.grammar.title}</b><p>{content.grammar.explanation}</p>{(content.grammar.examples||[]).map((e,i)=><p key={i}><strong>{e.english}</strong><br/>{e.vietnamese}</p>)}</div>}
        {!!content.dialogue?.length && <div style={{marginTop:20}}><h3>💬 Hội thoại thực tế</h3>{content.dialogue.map((line,i)=><div key={i} style={{background:i%2?"#eef6ff":"#f5f3ff",padding:"12px 16px",borderRadius:12,margin:"8px 0"}}><b>{line.speaker}: </b>{line.english}{line.vietnamese&&<p>{line.vietnamese}</p>}</div>)}</div>}
        <LessonTutor key={selected.id} lesson={{id:selected.id,title:selected.title,words:(content.vocabulary||[]).map(v=>v.word),goal:content.lesson_goal,dialogue:content.dialogue}}/>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}><button className="btn nextbtn" onClick={()=>void saveProgress()} disabled={saving}>{saving?"Đang lưu…":"✓ Đánh dấu đã học xong"}</button>{nextLesson&&<button className="btn nextbtn" onClick={goToNextLesson}>Bài tiếp theo <ChevronRight size={17}/></button>}</div>{notice&&<p role="status">{notice}</p>}
      </>}
      {mode === "quiz" && question && <>
        <div className="eyebrow">CÂU {questionIndex + 1} / {questions.length}</div><div className="quizprogress"><i style={{ width: ((questionIndex + 1) / questions.length * 100) + "%" }}/></div>
        <h2>{question.q}</h2><div className="options">{question.options.map((option, index) => <button key={index} className={choice === index ? "selected" : ""} onClick={() => !answered && setChoice(index)} disabled={answered}>{String.fromCharCode(65 + index)}. {option}</button>)}</div>
        {answered && <div className={choice === question.answer ? "feedback good" : "feedback bad"}>{choice === question.answer ? <CheckCircle2/> : <XCircle/>}<span><b>{choice === question.answer ? "Chính xác!" : "Chưa chính xác"}</b><br/>{choice !== question.answer && <>Bạn chọn: <b>{question.options[choice ?? 0]}</b>. Đáp án đúng: <b>{question.options[question.answer]}</b>. Lựa chọn của bạn chưa khớp với yêu cầu của câu hỏi.<br/></>}{question.translation && <><b>Dịch nghĩa:</b> {question.translation}<br/></>}<b>Giải thích:</b> {question.explain}{choice !== question.answer && question.optionExplains?.[choice ?? -1] && <><br/><b>Vì sao lựa chọn này chưa đúng:</b> {question.optionExplains[choice ?? -1]}</>}</span></div>}
        <button className="btn nextbtn" disabled={choice === null} onClick={answered ? nextQuestion : submitAnswer}>{answered ? questionIndex === questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo" : "Kiểm tra đáp án"}</button>
      </>}
      {mode === "result" && <div className="lesson-result"><Trophy size={44}/><div className="eyebrow">KẾT QUẢ BÀI KIỂM TRA</div><h2>{selected.title}</h2><strong>{score}/{questions.length}</strong><span>Số câu trả lời đúng</span><p>{Math.round(score / Math.max(questions.length, 1) * 100)}% chính xác</p><button className="btn nextbtn" onClick={saveProgress} disabled={saving}>{saving ? "Đang lưu..." : "Lưu tiến độ"} <ArrowRight size={16}/></button>{nextLesson ? <button className="btn nextbtn" onClick={saveAndGoNext} disabled={saving}>{saving ? (isEnglish ? "Saving..." : "Đang lưu...") : (isEnglish ? "Save & Next" : "Lưu & học bài tiếp theo")} <ChevronRight size={17}/></button> : <button className="btn nextbtn" onClick={() => { setSelected(null); setMode("learn"); setNotice(""); }} disabled={saving}>Bạn đã đến bài cuối — quay lại danh sách <ArrowRight size={16}/></button>}<button className="lesson-retry" onClick={startQuiz}><RotateCcw size={14}/>Làm lại bài</button>{notice && <p role="status">{notice}</p>}</div>}
    </section>;
  }

  if (activeCourse) {
    const totalWords=courseLessons.reduce((sum,lesson)=>sum+(lesson.content.vocabulary||[]).length,0);
    const courseImageFiles=["coursesenglish-starter.png.png","coursesdaily-life.png.png","coursestravel-english.png.png","coursesstudy-work.png.png","coursesadvanced-english.png.png"];
    const courseIndex=courses.findIndex(course=>course.id===activeCourse.id);
    const courseImage=activeCourse.is_free?"/images/aunora/"+courseImageFiles[Math.max(0,courseIndex)%courseImageFiles.length]:"/images/courses/"+activeCourse.slug+".webp.png";
    const heroBackground=`linear-gradient(90deg,rgba(8,38,99,.94),rgba(18,69,137,.77) 48%,rgba(18,69,137,.03) 78%),url("${courseImage}")`;
    const cardBackground=`linear-gradient(90deg,#ffffff 2%,#fffffff2 46%,#ffffff22 100%),url("${courseImage}")`;
    return <section className="aunora-course-design">
      <button className="acd-back" onClick={()=>setSelectedCourseSlug(null)}><ArrowLeft size={18}/> Tất cả khóa học</button>
      <header className="acd-hero" style={{backgroundImage:heroBackground}}><div className="acd-hero-copy"><span className="acd-badge">{activeCourse.level||"Beginner"} · {activeCourse.is_free?"MIỄN PHÍ":"KHÓA HỌC"}</span><h1>{activeCourse.title}</h1><p>{activeCourse.description||"Xây nền tảng từ vựng và câu giao tiếp hằng ngày với sự đồng hành của Aivanta."}</p><div className="acd-hero-stats"><span>📖 {courseLessons.length} bài học</span><span>✍️ {totalWords} từ vựng</span></div></div></header>
      <div className="acd-grid">{courseLessons.map((lesson,index)=><article className="acd-card" key={lesson.id} style={{backgroundImage:cardBackground}}>
        <div><span className="acd-card-label">BÀI {String(index+1).padStart(2,"0")}</span><h2>{lesson.title}</h2><p>5 từ vựng, mẫu câu, hội thoại và luyện tập cùng Aivanta.</p></div>
        <div><div className="acd-pills"><span>📖 {(lesson.content.vocabulary||[]).length} từ vựng</span><span>💬 Luyện với Aivanta</span>{done.includes(lesson.slug)&&<span>✓ Đã học</span>}</div><button type="button" className="acd-enter" onClick={()=>openLesson(lesson)}>{done.includes(lesson.slug)?"Ôn tập lại":"Vào học"} <ArrowRight size={19}/></button></div>
      </article>)}</div>
    </section>;
  }

  const coursePictures = ["coursesenglish-starter.png.png","coursesdaily-life.png.png","coursestravel-english.png.png","coursesstudy-work.png.png","coursesadvanced-english.png.png"];
  const courseNames = ["English Starter","Everyday English","English for Travel","Grammar in Action","Confident Conversations"];
  const courseSummaries = ["Xây nền tảng từ vựng và câu giao tiếp hằng ngày.","Giao tiếp tự nhiên trong những tình huống quen thuộc hằng ngày.","Tự tin sử dụng tiếng Anh tại sân bay, khách sạn và khi khám phá địa điểm mới.","Hiểu và vận dụng ngữ pháp qua ví dụ, hội thoại và tình huống thực tế.","Diễn đạt ý kiến, cảm xúc và xử lý các cuộc trò chuyện dài hơn."];
  return <><h2 className="library-courses-title">Tất cả khóa học</h2><section className="aunora-library-showcase">{courses.map((course,index) => {
    const courseLessonsForCard = lessons.filter(lesson => lesson.course_id === course.id);
    const completeCount = courseLessonsForCard.filter(lesson => done.includes(lesson.slug)).length;
    const feature = index < 3;
    return <article className={`als-card als-card-${index} ${feature?"als-feature":"als-wide"}`} key={course.id}>
      <div className={"als-art"+(!course.is_free?" als-explorer-art":"")}><img src={course.is_free?"/images/aunora/"+coursePictures[index%coursePictures.length]:"/images/courses/"+course.slug+".webp.png"} alt={course.title}/>{index===0&&<span className="als-free">🌱 Miễn phí</span>}</div>
      <div className="als-info"><div className="als-info-top"><h2>{courseNames[index]||course.title}</h2><span className="als-symbol">{["🌱","♧","✈","▤","☏"][index%5]}</span></div>
      <p>{courseSummaries[index]||course.description}</p>
      <div className="als-pills"><span>▥ {course.level||"A1"}</span><span>▤ {courseLessonsForCard.length} bài học</span><span>◎ {completeCount}/{courseLessonsForCard.length} hoàn thành</span></div>
      <button type="button" onClick={()=>setSelectedCourseSlug(course.slug)}>Khám phá khóa học <ArrowRight size={17}/></button></div>
    </article>;
  })}</section></>;
}
