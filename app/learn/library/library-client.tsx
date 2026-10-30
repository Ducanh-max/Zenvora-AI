"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import LessonTutor from "./lesson-tutor";
import LessonPractice from "./lesson-practice";
import AdventureLesson from "./adventure-lesson";
import ScheduledReview from "./scheduled-review";
import {SAMPLE_IDS} from "./sample-intro-content";
import "./course-design.css";
import "./adventure-lesson.css";
import { useEffect, useMemo, useRef, useState } from "react";
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

export default function LibraryClient({ courses, lessons, progress, quizSize, initialCourseSlug, canReviewQuestions=false }: { courses: LibraryCourse[]; lessons: LibraryLesson[]; progress: Progress[]; quizSize: number; initialCourseSlug?: string; canReviewQuestions?: boolean }) {
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
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [enteringLesson, setEnteringLesson] = useState<LibraryLesson | null>(null);
  useEffect(()=>{try{const saved=sessionStorage.getItem("aunora_active_lesson")||localStorage.getItem("aunora_resume_lesson");if(!saved)return;const item=JSON.parse(saved) as {slug:string;course:string};const found=lessons.find(l=>l.slug===item.slug&&courses.some(c=>c.id===l.course_id&&c.slug===item.course));if(found){setSelectedCourseSlug(item.course);setSelectedSection(Math.floor(Math.max(0,lessons.filter(l=>l.course_id===found.course_id).sort((a,b)=>a.sort_order-b.sort_order).findIndex(l=>l.id===found.id))/10));setSelected(found);sessionStorage.removeItem("aunora_active_lesson");sessionStorage.removeItem("aunora_returning_to_lesson");localStorage.removeItem("aunora_resume_lesson");}}catch{}},[lessons,courses]);
  useEffect(()=>{if(selected){try{sessionStorage.setItem("aunora_active_lesson",JSON.stringify({slug:selected.slug,course:selectedCourseSlug}));localStorage.setItem("aunora_last_unfinished_lesson",JSON.stringify({slug:selected.slug,course:selectedCourseSlug,id:selected.id,title:selected.title}));}catch{}}},[selected,selectedCourseSlug]);
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
  useEffect(()=>{setDone(previous=>[...new Set([...previous,...progress.filter(p=>p.completed).map(p=>p.lesson_id)])]);},[progress]);
  const [sectionTransition,setSectionTransition]=useState<number|null>(null);
  const [carMotion,setCarMotion]=useState<{section:number;index:number}|null>(null);
  const [carArriving,setCarArriving]=useState(false);
  const [carPhase,setCarPhase]=useState<"idle"|"driving"|"waiting"|"entering">("idle");
  const [arrivedLesson,setArrivedLesson]=useState<LibraryLesson|null>(null);
  const carTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(()=>()=>{carTimers.current.forEach(clearTimeout)},[]);
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
      animateCarAfterLesson(selected);
      setNotice("Đã lưu kết quả học tập của bạn.");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu kết quả.");
      return false;
    } finally { setSaving(false); }
  }
  function animateCarAfterLesson(lesson:LibraryLesson) {
    const course=courses.find(c=>c.slug===selectedCourseSlug);
    if(!course?.is_free)return;
    const ordered=lessons.filter(item=>item.course_id===course.id).sort((a,b)=>a.sort_order-b.sort_order);
    for(let section=0;section<Math.ceil(ordered.length/10);section++){
      const activities=makeSectionActivities(ordered.slice(section*10,section*10+10),section);
      const index=activities.findIndex(item=>item.slug===lesson.slug);
      if(index<0)continue;
      const next=activities[index+1];
      const completedAfter=new Set([...done,lesson.slug]);
      if(activities.every(item=>completedAfter.has(item.slug))&&section+1<Math.ceil(ordered.length/10)){
        carTimers.current.forEach(clearTimeout);
        carTimers.current=[];
        setCarMotion(null);setArrivedLesson(null);setSelectedSection(section+1);
        setSectionTransition(section+1);
        carTimers.current.push(setTimeout(()=>setSectionTransition(null),3200));
        return;
      }
      if(!next)return;
      carTimers.current.forEach(clearTimeout);
      carTimers.current=[];
      setSelectedSection(section);
      setCarMotion({section,index});
      setCarArriving(false);
      setCarPhase("idle");
      setArrivedLesson(null);
      carTimers.current.push(setTimeout(()=>{
        setCarPhase("driving");
        setCarArriving(true);
        setCarMotion({section,index:index+1});
      },350));
      carTimers.current.push(setTimeout(()=>{
        setCarArriving(false);
        setCarPhase("waiting");
      },2550));
      carTimers.current.push(setTimeout(()=>{setCarPhase("idle");setArrivedLesson(next);},5550));
      return;
    }
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
    return <section className="aunora-loading" aria-live="polite" aria-busy="true"><div className="aunora-loading-card" role="status"><img className="aunora-loading-wolf" src="/brand/wolf-face/aivanta-face.png" alt=""/><h1 className="aunora-loading-title">Aivanta đang chuẩn bị bài học...</h1><p className="aunora-loading-desc">Sẵn sàng khám phá: {enteringLesson.title}</p><div className="aunora-loading-track" aria-hidden="true"><div className="aunora-loading-bar"/></div></div></section>;
  }
  if (selected && (selected.content.vocabulary || []).length >= 3) {
    return <AdventureLesson canReviewQuestions={canReviewQuestions} lesson={{id:selected.id,title:selected.title,words:selected.content.vocabulary||[],dialogue:selected.content.dialogue,examples:selected.content.examples,goal:selected.content.lesson_goal,review:selected.slug.includes("-review-"),test:selected.slug.includes("-test-")}} onExit={resetLesson} onFinish={async(correct,total)=>{setScore(correct);setSaving(true);try{const response=await fetch("/api/lesson-progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:selected.slug,courseId:selectedCourseSlug||"english-starter",score:Math.max(0,Math.min(correct,total)),totalQuestions:total})});if(!response.ok){const payload=await response.json().catch(()=>({error:"Không thể lưu tiến độ"}));throw new Error(payload.error||"Không thể lưu tiến độ");}setDone(previous=>previous.includes(selected.slug)?previous:[...previous,selected.slug]);animateCarAfterLesson(selected);try{localStorage.removeItem("aunora_lesson_step_"+selected.id);localStorage.removeItem("aunora_last_unfinished_lesson")}catch{}resetLesson();}finally{setSaving(false);}}}/>;
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

  // Four groups per section, each containing two source lessons, a review and a test.
  // The final group also incorporates the remaining source lessons.
  function makeSectionActivities(source: LibraryLesson[], sectionIndex: number): LibraryLesson[] {
    if(source.length&&source.every(lesson=>SAMPLE_IDS.includes(lesson.id)))return source;
    const pairs = [[0,1],[2,3],[4,5],[6,7,8,9]];
    return pairs.flatMap((indices,groupIndex) => {
      const items=indices.map(i=>source[i]).filter((item):item is LibraryLesson=>Boolean(item));
      if(!items.length)return [];
      const first=items[0],second=items[1]||first;
      const combinedWords=items.flatMap(item=>item.content.vocabulary||[]);
      const combinedQuestions=items.flatMap(item=>item.content.questions||[]);
      const combinedExamples=items.flatMap(item=>item.content.examples||[]);
      const combinedDialogue=items.flatMap(item=>item.content.dialogue||[]);
      const base=(kind:string,title:string,words:Vocabulary[],questions:Question[]):LibraryLesson=>({
        ...first,id:first.id+"-"+kind+"-"+sectionIndex+"-"+groupIndex,
        slug:first.slug+"-"+kind+"-"+sectionIndex+"-"+groupIndex,
        title,summary:"Luyện tập kiến thức tổng hợp của nhóm bài học.",
        content:{...first.content,vocabulary:words,questions,examples:combinedExamples,dialogue:combinedDialogue}
      });
      return [
        first,
        second,
        base("review","Ôn tập: "+first.title+" & "+second.title,combinedWords.slice(0,10),combinedQuestions),
        base("test","Kiểm tra tổng hợp "+(groupIndex+1),combinedWords.slice(0,10),combinedQuestions)
      ];
    });
  }
  const sectionNames: Record<string,string[]> = {
    "english-starter":["Những bước giao tiếp đầu tiên","Thế giới quanh em","Cuộc sống mỗi ngày","Tự tin sử dụng tiếng Anh"],
    "everyday-english":["Giao tiếp thường ngày","Gia đình và bạn bè","Sinh hoạt và sở thích","Tình huống đời sống"],
    "english-for-travel":["Chuẩn bị hành trình","Di chuyển và phương hướng","Khách sạn và ăn uống","Khám phá và trải nghiệm"],
    "grammar-in-action":["Nền tảng câu tiếng Anh","Thì và thời gian","Diễn đạt ý tưởng","Vận dụng ngữ pháp"],
    "confident-conversations":["Bắt đầu cuộc trò chuyện","Chia sẻ và hỏi đáp","Diễn đạt cảm xúc, ý kiến","Giao tiếp tự tin"]
  };
  const sampleCourse=courseLessons.some(lesson=>SAMPLE_IDS.includes(lesson.id));
  const sectionTitles = sampleCourse?["Giới thiệu bản thân"]:activeCourse ? sectionNames[activeCourse.slug] || [] : [];
  if (activeCourse) {
    const totalWords=courseLessons.reduce((sum,lesson)=>sum+(lesson.content.vocabulary||[]).length,0);
    const courseImageFiles=["coursesenglish-starter.png.png","coursesdaily-life.png.png","coursestravel-english.png.png","coursesstudy-work.png.png","coursesadvanced-english.png.png"];
    const courseIndex=courses.findIndex(course=>course.id===activeCourse.id);
    const courseImage=activeCourse.is_free?"/images/aunora/"+courseImageFiles[Math.max(0,courseIndex)%courseImageFiles.length]:"/images/courses/"+activeCourse.slug+".webp.png";
    const heroBackground=`linear-gradient(90deg,rgba(8,38,99,.94),rgba(18,69,137,.77) 48%,rgba(18,69,137,.03) 78%),url("${courseImage}")`;
    const cardBackground=`linear-gradient(90deg,#ffffff 2%,#fffffff2 46%,#ffffff22 100%),url("${courseImage}")`;
    const isMapView=activeCourse.is_free && selectedSection===null;
    const isLessonMap=activeCourse.is_free && selectedSection!==null;
    return <section className={"aunora-course-design"+(isMapView?" acd-world-view":"")}>
      <ScheduledReview refresh={done.length}/><button className="acd-back" onClick={()=>{if(selectedSection!==null)setSelectedSection(null);else setSelectedCourseSlug(null)}}><ArrowLeft size={18}/> {selectedSection!==null?"Quay lại các chủ đề":"Tất cả khóa học"}</button>
      {isLessonMap?null:isMapView?<div className="acd-world-intro"><div><span className="acd-world-eyebrow">✦ AUNORA ACADEMY · LỘ TRÌNH HỌC TẬP</span><h1>{activeCourse.title}</h1><p>{activeCourse.description||"Cùng Aivanta khám phá tiếng Anh qua bốn hành trình thú vị!"}</p><div className="acd-world-stats"><span>📖 {courseLessons.length} bài học</span><span>🗺️ {Math.ceil(courseLessons.length/10)} phần</span><span>✨ {totalWords} từ vựng</span></div></div><img src="/brand/aivanta-mascot.webp.png" alt="Aivanta đồng hành cùng bạn"/></div>:<header className="acd-hero" style={{backgroundImage:heroBackground}}><div className="acd-hero-copy"><span className="acd-badge">{activeCourse.level||"Beginner"} · {activeCourse.is_free?"MIỄN PHÍ":"KHÓA HỌC"}</span><h1>{activeCourse.title}{selectedSection!==null?" · Phần "+(selectedSection+1):""}</h1><p>{activeCourse.description||"Xây nền tảng từ vựng và câu giao tiếp hằng ngày với Aivanta."}</p><div className="acd-hero-stats"><span>📖 {courseLessons.length} bài học</span><span>✍️ {totalWords} từ vựng</span></div></div></header>}
      {sectionTransition!==null&&typeof document!=="undefined"&&createPortal(
        <div className="acd-section-transition" role="dialog" aria-modal="true" aria-label="Chúc mừng hoàn thành phần học" onClick={()=>setSectionTransition(null)} style={{position:"fixed",inset:0,zIndex:2147483647,display:"flex",alignItems:"center",justifyContent:"center",padding:16,boxSizing:"border-box",background:"rgba(9,30,75,.76)",overflowY:"auto"}}>
          <div className="acd-section-transition-card" onClick={event=>event.stopPropagation()} style={{boxSizing:"border-box",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,width:"min(420px, 100%)",maxWidth:420,maxHeight:"calc(100dvh - 32px)",overflowY:"auto",padding:"22px 20px",margin:"auto",borderRadius:24,background:"linear-gradient(145deg,#fff,#e7f5ff)",textAlign:"center",boxShadow:"0 20px 70px rgba(7,26,76,.35)"}}>
            <img src="/brand/aivanta-mascot.webp.png" alt="Aivanta" width={130} height={130} style={{display:"block",width:130,height:130,minWidth:0,minHeight:0,maxWidth:130,maxHeight:130,flex:"0 0 130px",objectFit:"contain",margin:"0 auto"}}/>
            <span>✨ CHÚC MỪNG!</span>
            <h2>Hoàn thành Phần {sectionTransition}!</h2>
            <p>🗺️ Đang mở hành trình Phần {sectionTransition+1}…</p>
            <button type="button" onClick={()=>setSectionTransition(null)}>Khám phá phần mới →</button>
          </div>
        </div>,document.body)}

      {isLessonMap && <div className="acd-lesson-map-heading"><span>✦ PHẦN {(selectedSection ?? 0)+1} · LỘ TRÌNH {sampleCourse?4:16} BÀI HỌC</span><h2>{sectionTitles[selectedSection ?? 0] || "Khám phá tiếng Anh"}</h2><p>Chọn một điểm trên bản đồ để bắt đầu hoặc ôn tập bài học.</p></div>}
      <div className={isMapView?"acd-world-map":isLessonMap?"acd-lesson-map-wrap":"acd-sections"}>{Array.from({length:Math.ceil(courseLessons.length/10)},(_,sectionIndex)=>{
        const sourceSectionLessons=courseLessons.slice(sectionIndex*10,sectionIndex*10+10);
        const sectionLessons=activeCourse.is_free?makeSectionActivities(sourceSectionLessons,sectionIndex):sourceSectionLessons;
        const completed=sectionLessons.filter(lesson=>done.includes(lesson.slug)).length;
        const sectionTitle=sectionTitles[sectionIndex]||sectionLessons[0]?.title||"Khám phá tiếng Anh";
        if(selectedSection!==null&&selectedSection!==sectionIndex)return null;
        if(isMapView)return <button type="button" key={sectionIndex} className={"acd-island acd-island-"+sectionIndex} onClick={()=>setSelectedSection(sectionIndex)} aria-label={"Mở phần "+(sectionIndex+1)+": "+sectionTitle}>
          
          <span className="acd-island-panel"><span className="acd-island-label">PHẦN {sectionIndex+1} · BÀI {sectionIndex*16+1}–{sectionIndex*16+sectionLessons.length}</span><strong>{sectionTitle}</strong><span className="acd-island-description">{sectionLessons[0]?.title} · {sectionLessons[sectionLessons.length-1]?.title}</span><span className="acd-island-progress"><span><i style={{width:(completed/sectionLessons.length*100)+"%"}}/></span><b>{completed}/{sectionLessons.length}</b></span><span className="acd-island-action">{completed===sectionLessons.length?"Ôn tập phần này":"Khám phá phần "+(sectionIndex+1)} →</span></span>
        </button>;
        if(isLessonMap)return <section className="acd-lesson-map" key={sectionIndex} aria-label={"Bản đồ "+sectionLessons.length+" bài học của phần "+(sectionIndex+1)}>
          <svg className="acd-lesson-route" viewBox="0 0 1000 558" preserveAspectRatio="none" aria-hidden="true"><path className="acd-route-shadow" d="M130 178.56 L200 161.82 L270 156.24 L340 172.98 L680 189.72 L750 178.56 L820 189.72 L890 212.04 L830 362.7 L760 385.02 L690 407.34000000000003 L620 429.66 L380 412.92 L310 390.6 L240 368.28000000000003 L170 351.54"/><path className="acd-route-line" d="M130 178.56 L200 161.82 L270 156.24 L340 172.98 L680 189.72 L750 178.56 L820 189.72 L890 212.04 L830 362.7 L760 385.02 L690 407.34000000000003 L620 429.66 L380 412.92 L310 390.6 L240 368.28000000000003 L170 351.54"/></svg>
          <div className="acd-lesson-map-points">{sectionLessons.map((lesson,offset)=>{
            const finished=done.includes(lesson.slug);
            const current=offset===Math.max(0,sectionLessons.findIndex(item=>!done.includes(item.slug)));
            const isTest=offset%4===3;
            return <button key={lesson.slug} type="button" className={"acd-lesson-point acd-lesson-point-"+offset+(finished?" is-done":"")+(current?" is-current":"")+(isTest?" is-test":"")} onClick={()=>{setArrivedLesson(lesson);setCarPhase("waiting")}} aria-label={(finished?"Ôn tập bài ":"Bài ")+(offset+1)+": "+lesson.title} title={lesson.title}><span>{finished?"✓":isTest?"★":offset+1}</span><small>{finished?"Ôn tập +5 EXP":isTest?"Kiểm tra":"Bài "+(offset+1)}</small></button>;
          })}</div>
          <div className={"acd-car-marker"+(carArriving?" is-driving":"")+(carPhase==="entering"?" is-entering":"")} style={{left:([13,20,27,34,68,75,82,89,83,76,69,62,38,31,24,17][carMotion?.section===sectionIndex?carMotion.index:Math.min(15,Math.max(0,sectionLessons.findIndex(item=>!done.includes(item.slug))))])+"%",top:([32,29,28,31,34,32,34,38,65,69,73,77,74,70,66,63][carMotion?.section===sectionIndex?carMotion.index:Math.min(15,Math.max(0,sectionLessons.findIndex(item=>!done.includes(item.slug))))])+"%"}} aria-label="Aivanta đang lái xe tới bài học tiếp theo"><img src="/images/aunora/learning-parts/vehicles/aivanta-car.png" alt="Aivanta lái xe"/></div>
          {arrivedLesson&&<div className="acd-arrival-card" role="dialog" aria-label="Bài học tiếp theo"><button type="button" className="acd-arrival-close" onClick={()=>setArrivedLesson(null)} aria-label="Đóng">×</button><span><img src="/brand/wolf-face/aivanta-face.png" alt="" style={{width:27,height:27,objectFit:"contain",verticalAlign:"middle",marginRight:7}}/>{done.includes(arrivedLesson.slug)?"Ôn tập kiến thức đã học!":"Aivanta đã đến bài tiếp theo!"}</span><h3>{arrivedLesson.title}</h3><p>⭐ {done.includes(arrivedLesson.slug)?"Ôn tập · +5 EXP":"Hoàn thành bài học · +10 EXP"}</p><button type="button" className="acd-arrival-start" onClick={()=>{const lesson=arrivedLesson;setArrivedLesson(null);setCarPhase("entering");openLesson(lesson)}}>{done.includes(arrivedLesson.slug)?"Ôn tập · +5 EXP →":"Bắt đầu · +10 EXP →"}</button><small>Chưa muốn học? Đóng bảng này hoặc chọn lại bài trên bản đồ.</small></div>}
          <div className="acd-lesson-chests">{Array.from({length:Math.ceil(sectionLessons.length/4)},(_,group)=>group).map(group=>{const groupLessons=sectionLessons.slice(group*4,group*4+4);const cleared=groupLessons.length>0&&groupLessons.every(item=>done.includes(item.slug));return <div className={"acd-chest acd-chest-"+group+(cleared?" is-open":"")} key={group} title={cleared?"Đã mở rương!":"Hoàn thành nhóm bài để mở rương"} aria-label={"Rương "+(group+1)+(cleared?" đã mở":" chưa mở")}>{cleared?"🎁":"🧰"}</div>})}</div>
          <div className="acd-lesson-map-footer"><strong>Tiến độ: {completed}/{sectionLessons.length} bài · {Math.ceil(sectionLessons.length/4)} rương phần thưởng</strong></div>
        </section>;
        return <section className="acd-section" key={sectionIndex}>
          <header className="acd-section-heading"><div><span className="acd-section-kicker">✦ PHẦN {sectionIndex+1} · BÀI {sectionIndex*10+1}–{sectionIndex*10+sectionLessons.length}</span><h2>{sectionTitle}</h2><p>{sectionLessons[0]?.title}{sectionLessons.length>1?" · "+sectionLessons[sectionLessons.length-1].title:""}</p></div><strong>{completed}/{sectionLessons.length} bài · {Math.round(completed/sectionLessons.length*100)}%</strong></header>
          <div className="acd-section-track" role="progressbar" aria-label={`Tiến độ phần ${sectionIndex+1}`} aria-valuenow={Math.round(completed/sectionLessons.length*100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:(completed/sectionLessons.length*100)+"%"}}/></div>
          {selectedSection===null?<button type="button" className="acd-section-enter" onClick={()=>setSelectedSection(sectionIndex)}>📖 {completed===sectionLessons.length?"Ôn tập phần này":"Học phần "+(sectionIndex+1)} <ArrowRight size={18}/></button>:<div className="acd-grid">{sectionLessons.map((lesson,offset)=><article className="acd-card" key={lesson.id} style={{backgroundImage:cardBackground}}>
          <div><span className="acd-card-label">BÀI {String(sectionIndex*10+offset+1).padStart(2,"0")}</span><h2>{lesson.title}</h2><p>5 từ vựng, mẫu câu, hội thoại và luyện tập cùng Aivanta.</p></div>
          <div><div className="acd-pills"><span>📖 {(lesson.content.vocabulary||[]).length} từ vựng</span><span>💬 Luyện với Aivanta</span>{done.includes(lesson.slug)&&<span>✓ Đã học</span>}</div><button type="button" className="acd-enter" onClick={()=>setArrivedLesson(lesson)}>{done.includes(lesson.slug)?"Ôn tập lại":"Vào học"} <ArrowRight size={19}/></button></div>
          </article>)}</div>}</section>;
      })}</div>
    </section>;
  }

  const coursePictures = ["coursesenglish-starter.png.png","coursesdaily-life.png.png","coursestravel-english.png.png","coursesstudy-work.png.png","coursesadvanced-english.png.png"];
  const courseNames = ["English Starter","Everyday English","English for Travel","Grammar in Action","Confident Conversations"];
  const courseSummaries = ["Xây nền tảng từ vựng và câu giao tiếp hằng ngày.","Giao tiếp tự nhiên trong những tình huống quen thuộc hằng ngày.","Tự tin sử dụng tiếng Anh tại sân bay, khách sạn và khi khám phá địa điểm mới.","Hiểu và vận dụng ngữ pháp qua ví dụ, hội thoại và tình huống thực tế.","Diễn đạt ý kiến, cảm xúc và xử lý các cuộc trò chuyện dài hơn."];
  return <><ScheduledReview refresh={done.length}/><h2 className="library-courses-title">Khóa học và nội dung sắp ra mắt</h2><section className="aunora-library-showcase">{courses.map((course,index) => {
    const courseLessonsForCard = lessons.filter(lesson => lesson.course_id === course.id);
    const completeCount = courseLessonsForCard.filter(lesson => done.includes(lesson.slug)).length;
    const feature = index < 3;
    return <article className={`als-card als-card-${index} ${feature?"als-feature":"als-wide"}`} key={course.id}>
      <div className={"als-art"+(!course.is_free?" als-explorer-art":"")}><img src={course.is_free?"/images/aunora/"+coursePictures[index%coursePictures.length]:"/images/courses/"+course.slug+".webp.png"} alt={course.title}/>{index===0&&<span className="als-free">🌱 Miễn phí</span>}</div>
      <div className="als-info"><div className="als-info-top"><h2>{courseNames[index]||course.title}</h2><span className="als-symbol">{["🌱","♧","✈","▤","☏"][index%5]}</span></div>
      <p>{courseSummaries[index]||course.description}</p>
      <div className="als-pills"><span>▥ {course.level||"A1"}</span><span>▤ {courseLessonsForCard.length} bài học</span><span>◎ {completeCount}/{courseLessonsForCard.length} hoàn thành</span></div>
      <button type="button" disabled={!courseLessonsForCard.length} onClick={()=>{setSelectedSection(null);setSelectedCourseSlug(course.slug)}}>{courseLessonsForCard.length?"Vào học":"Đang xây dựng"} <ArrowRight size={17}/></button></div>
    </article>;
  })}</section></>;
}
