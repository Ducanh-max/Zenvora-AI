"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Languages, Sparkles } from "lucide-react";

type Lang = "vi" | "en";
export default function CoursesPage() {
  const [lang, setLang] = useState<Lang>("vi");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aunora_language");
      if (saved === "vi" || saved === "en") setLang(saved);
    } catch {}
  }, []);
  const vi = lang === "vi";
  const courses = vi
    ? [
        ["01", "English Starter", "Xây nền tảng từ vựng, phát âm và những câu tiếng Anh đầu tiên."],
        ["02", "Everyday English", "Luyện giao tiếp tự nhiên trong học tập và cuộc sống hằng ngày."],
        ["03", "English for Travel", "Tự tin sử dụng tiếng Anh tại sân bay, khách sạn và các chuyến đi."],
        ["04", "Grammar in Action", "Hiểu và vận dụng ngữ pháp qua ví dụ và tình huống thực tế."],
        ["05", "Confident Conversations", "Phát triển phản xạ, trình bày ý kiến và hội thoại tự tin."]
      ]
    : [
        ["01", "English Starter", "Build your foundation in vocabulary, pronunciation, and essential phrases."],
        ["02", "Everyday English", "Practice natural communication in everyday life and study."],
        ["03", "English for Travel", "Use English confidently at airports, hotels, and while travelling."],
        ["04", "Grammar in Action", "Understand and apply grammar through real-life examples."],
        ["05", "Confident Conversations", "Build fluency, share opinions, and communicate with confidence."]
      ];
  return <main className="marketing-page plan-page">
    <nav className="nav wrap">
      <Link href="/learn" className="aunora-auth-brand"><span className="aunora-mark"><BookOpen /></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link>
      <div className="navactions">
        <Link href="/learn">{vi ? "Không gian học tập" : "Learning space"}</Link>
        <div className="marketing-language"><Languages size={15}/><button className={vi ? "active" : ""} onClick={() => { setLang("vi"); localStorage.setItem("aunora_language", "vi"); }}>VI</button><button className={!vi ? "active" : ""} onClick={() => { setLang("en"); localStorage.setItem("aunora_language", "en"); }}>EN</button></div>
      </div>
    </nav>
    <section className="plan-wrap">
      <Link href="/learn" className="catalog-back"><ArrowLeft size={16}/>{vi ? "Về bảng điều khiển" : "Back to dashboard"}</Link>
      <div className="eyebrow"><Sparkles size={14}/>{vi ? "AUNORA · HỌC TẬP MIỄN PHÍ" : "AUNORA · FREE LEARNING"}</div>
      <h1>{vi ? <>Mở khóa tri thức, <em>không mất phí.</em></> : <>Unlock knowledge, <em>at no cost.</em></>}</h1>
      <p className="plan-lead">{vi ? "Toàn bộ 5 khóa học và 500 bài học theo lộ trình đều miễn phí cho mọi người học." : "All five courses and the complete 500-lesson learning path are free for every learner."}</p>
      <div className="library-summary"><b>{vi ? "5 khóa học · 500 bài học" : "5 courses · 500 lessons"}</b><span>{vi ? "Không cần đăng ký gói trả phí." : "No paid membership required."}</span></div>
      <div className="plan-grid">{courses.map(([number, title, description]) => <article className={"plan-card " + ["sprout","explorer","achiever","elite","sprout"][Number(number)-1]} key={number}>
        <div className="plan-card-top"><span>{vi ? "KHÓA HỌC MIỄN PHÍ" : "FREE COURSE"}</span><span>{number}</span></div>
        <div className="plan-icon"><BookOpen /></div><h2>{title}</h2><p className="plan-desc">{description}</p>
        <div className="plan-price"><strong>{vi ? "Miễn phí" : "Free"}</strong></div>
        <ul><li><CheckCircle2 size={15}/><span>{vi ? "Bài học, luyện tập và kiểm tra" : "Lessons, practice, and quizzes"}</span></li><li><CheckCircle2 size={15}/><span>{vi ? "Theo dõi tiến độ học tập" : "Learning progress tracking"}</span></li></ul>
        <div className="plan-level">{vi ? "LỘ TRÌNH AUNORA" : "AUNORA LEARNING PATH"}<b>{vi ? "Mở cho tất cả" : "Open to everyone"}</b></div>
        <Link className="plan-cta" href={"/learn/library?course=" + ["english-starter","everyday-english","english-for-travel","grammar-in-action","confident-conversations"][Number(number)-1]}>{vi ? "Vào học miễn phí" : "Start learning free"} <ArrowRight size={16}/></Link>
      </article>)}</div>
      <p className="plan-footnote">{vi ? "AUNORA cam kết giữ miễn phí toàn bộ 5 khóa học trong lộ trình 500 bài. Các tính năng AI có thể được mở rộng dần khi hệ thống hoàn thiện." : "AUNORA keeps all five courses in the 500-lesson path free. AI features may be expanded as the platform develops."}</p>
    </section>
    <footer className="wrap footer"><span><b>AUNORA</b> · LEARN • GROW • GLOW</span><small>© 2026 AUNORA</small></footer>
  </main>;
}
