"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, RotateCcw, Trophy, Volume2, XCircle } from "lucide-react";

type Vocabulary = { word: string; meaning: string; pronunciation?: string; example: string };
type Example = { english: string; vietnamese: string };
type Question = { q: string; options: string[]; answer: number; explain: string };
export type LibraryCourse = { id: string; slug: string; title: string; level: string; description: string; is_free: boolean; sort_order: number };
export type LibraryLesson = { id: string; course_id: string; slug: string; title: string; summary: string; sort_order: number; content: { vocabulary?: Vocabulary[]; examples?: Example[]; questions?: Question[] } };
type Progress = { lesson_id: string; completed: boolean; score: number; total_questions: number };

function buildQuestionBank(lesson: LibraryLesson): Question[] {
  const content = lesson.content || {};
  const base = Array.isArray(content.questions) ? content.questions : [];
  const words = content.vocabulary || [];
  const generated: Question[] = [];
  const pick = (index: number, offset: number) => words[(index + offset) % Math.max(words.length, 1)];
  words.forEach((item, index) => {
    const wrong = [pick(index, 1), pick(index, 3)];
    generated.push({ q: `Which English phrase means “${item.meaning}”?`, options: [item.word, wrong[0]?.word || "", wrong[1]?.word || ""], answer: 0, explain: `“${item.word}” có nghĩa là “${item.meaning}”.` });
    generated.push({ q: `Choose the correct meaning of “${item.word}”.`, options: [item.meaning, wrong[0]?.meaning || "", wrong[1]?.meaning || ""], answer: 0, explain: `Hãy ghi nhớ: ${item.word} = ${item.meaning}.` });
    generated.push({ q: `Which sentence uses “${item.word}” correctly?`, options: [item.example, wrong[0]?.example || "", wrong[1]?.example || ""], answer: 0, explain: `Ví dụ đúng: ${item.example}` });
    const wordStart = item.example.toLowerCase().indexOf(item.word.toLowerCase());
    const blank = wordStart >= 0 ? item.example.slice(0, wordStart) + "_____" + item.example.slice(wordStart + item.word.length) : item.example;
    generated.push({ q: `Complete the example: “${blank}”`, options: [item.word, wrong[0]?.word || "", wrong[1]?.word || ""], answer: 0, explain: `Câu hoàn chỉnh: ${item.example}` });
    generated.push({ q: `Select the matching vocabulary for “${item.meaning}”.`, options: [item.word, wrong[1]?.word || "", wrong[0]?.word || ""], answer: 0, explain: `Đáp án: ${item.word}.` });
  });
  const combined = [...base, ...generated];
  while (combined.length < 50 && words.length) {
    const index = combined.length % words.length;
    const item = words[index];
    combined.push({ q: `Review: what does “${item.word}” mean?`, options: [item.meaning, pick(index, 2)?.meaning || "", pick(index, 4)?.meaning || ""], answer: 0, explain: `“${item.word}” = “${item.meaning}”.` });
  }
  return combined.slice(0, 50).map(question => {
    const order = question.options.map((_, index) => index).sort(() => Math.random() - 0.5);
    return { ...question, options: order.map(index => question.options[index]), answer: order.indexOf(question.answer) };
  }).sort(() => Math.random() - 0.5);
}

export default function LibraryClient({ courses, lessons, progress, quizSize, initialCourseSlug }: { courses: LibraryCourse[]; lessons: LibraryLesson[]; progress: Progress[]; quizSize: number; initialCourseSlug?: string }) {
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(() => courses.some(course => course.slug === initialCourseSlug) ? initialCourseSlug! : null);
  const [selected, setSelected] = useState<LibraryLesson | null>(null);
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
  async function saveProgress() {
    if (!selected) return;
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/lesson-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: selected.slug, courseId: selectedCourseSlug || "english-starter", score, totalQuestions: questions.length }) });
      if (!response.ok) throw new Error("Không thể đồng bộ tiến độ. Hãy thử lại.");
      setDone(previous => previous.includes(selected.slug) ? previous : [...previous, selected.slug]);
      setNotice("Đã lưu kết quả học tập của bạn.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể lưu kết quả."); }
    finally { setSaving(false); }
  }
  function resetLesson() { setSelected(null); setMode("learn"); setNotice(""); }

  const activeCourse = courses.find(course => course.slug === selectedCourseSlug) || null;
  const courseLessons = activeCourse ? lessons.filter(lesson => lesson.course_id === activeCourse.id) : [];

  if (selected) {
    const content = selected.content || {};
    return <section className="library-study">
      <button className="library-back" onClick={resetLesson}><ArrowLeft size={16}/> Tất cả bài học</button>
      {mode === "learn" && <>
        <div className="eyebrow">BÀI HỌC · {selected.sort_order}</div><h2>{selected.title}</h2><p>{selected.summary}</p>
        <h3>Từ vựng trọng tâm</h3><div className="library-vocab">{(content.vocabulary || []).map(item => <article key={item.word}><div><b>{item.word}</b><button aria-label={`Nghe phát âm ${item.word}`} onClick={() => { if ("speechSynthesis" in window) { const speech = new SpeechSynthesisUtterance(item.word); speech.lang = "en-US"; window.speechSynthesis.speak(speech); } }}><Volume2 size={15}/></button></div><span>{item.pronunciation || ""}</span><p>{item.meaning}</p><small>{item.example}</small></article>)}</div>
        <h3>Ví dụ giao tiếp</h3><div className="library-examples">{(content.examples || []).map((item, index) => <article key={index}><b>{item.english}</b><span>{item.vietnamese}</span></article>)}</div>
        <div className="library-quiz-intro"><b>Bài kiểm tra nhỏ · {quizSize} câu</b><span>Trả lời từng câu để xem giải thích và tổng kết kết quả.</span><button className="btn nextbtn" onClick={startQuiz}>Bắt đầu kiểm tra <ChevronRight size={17}/></button></div>
      </>}
      {mode === "quiz" && question && <>
        <div className="eyebrow">CÂU {questionIndex + 1} / {questions.length}</div><div className="quizprogress"><i style={{ width: ((questionIndex + 1) / questions.length * 100) + "%" }}/></div>
        <h2>{question.q}</h2><div className="options">{question.options.map((option, index) => <button key={index} className={choice === index ? "selected" : ""} onClick={() => !answered && setChoice(index)} disabled={answered}>{String.fromCharCode(65 + index)}. {option}</button>)}</div>
        {answered && <div className={choice === question.answer ? "feedback good" : "feedback bad"}>{choice === question.answer ? <CheckCircle2/> : <XCircle/>}<span><b>{choice === question.answer ? "Chính xác!" : "Chưa chính xác"}</b><br/>{question.explain}</span></div>}
        <button className="btn nextbtn" disabled={choice === null} onClick={answered ? nextQuestion : submitAnswer}>{answered ? questionIndex === questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo" : "Kiểm tra đáp án"}</button>
      </>}
      {mode === "result" && <div className="lesson-result"><Trophy size={44}/><div className="eyebrow">KẾT QUẢ BÀI KIỂM TRA</div><h2>{selected.title}</h2><strong>{score}/{questions.length}</strong><span>Số câu trả lời đúng</span><p>{Math.round(score / Math.max(questions.length, 1) * 100)}% chính xác</p><button className="btn nextbtn" onClick={saveProgress} disabled={saving}>{saving ? "Đang lưu..." : "Lưu tiến độ"} <ArrowRight size={16}/></button><button className="lesson-retry" onClick={startQuiz}><RotateCcw size={14}/>Làm lại bài</button>{notice && <p role="status">{notice}</p>}</div>}
    </section>;
  }

  if (activeCourse) {
    return <section className="library-course-view">
      <button className="library-back" onClick={() => setSelectedCourseSlug(null)}><ArrowLeft size={16}/> Tất cả khóa học</button>
      <div className="library-course-intro"><span className="eyebrow">{activeCourse.level} · {activeCourse.is_free ? "MIỄN PHÍ" : "MỞ THỬ NGHIỆM"}</span><h2>{activeCourse.title}</h2><p>{activeCourse.description}</p><b>{courseLessons.length} bài học · {courseLessons.reduce((sum, lesson) => sum + (lesson.content.vocabulary || []).length, 0)} từ vựng</b></div>
      <div className="library-grid">{courseLessons.map((lesson, index) => {
        const complete = done.includes(lesson.slug);
        const questionCount = (lesson.content.questions || []).length || buildQuestionBank(lesson).length;
        return <article className="library-card" key={lesson.id}><div className="library-card-top"><span>{complete ? "ĐÃ HOÀN THÀNH" : `BÀI ${String(index + 1).padStart(2, "0")}`}</span><BookOpen size={18}/></div><h2>{lesson.title}</h2><p>{lesson.summary}</p><div className="library-card-meta"><span>{(lesson.content.vocabulary || []).length} từ vựng</span><span>{Math.min(quizSize, questionCount)} câu kiểm tra</span></div><button className="btn nextbtn" onClick={() => { setSelected(lesson); setMode("learn"); }}>{complete ? "Ôn tập lại" : "Vào học"} <ArrowRight size={16}/></button></article>;
      })}</div>
    </section>;
  }

  return <section className="library-grid">{courses.map(course => {
    const courseLessonsForCard = lessons.filter(lesson => lesson.course_id === course.id);
    const completeCount = courseLessonsForCard.filter(lesson => done.includes(lesson.slug)).length;
    return <article className="library-card library-course-card" key={course.id}><div className="library-card-top"><span>{course.is_free ? "KHÓA HỌC MIỄN PHÍ" : "ĐANG MỞ THỬ NGHIỆM"}</span><BookOpen size={18}/></div><h2>{course.title}</h2><p>{course.description}</p><div className="library-card-meta"><span>{course.level}</span><span>{courseLessonsForCard.length} bài học</span><span>{completeCount}/{courseLessonsForCard.length} hoàn thành</span></div><button className="btn nextbtn" onClick={() => setSelectedCourseSlug(course.slug)}>Khám phá khóa học <ArrowRight size={16}/></button></article>;
  })}</section>;
}
