"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, BrainCircuit, Heart, Languages, Sparkles, Target } from "lucide-react";

type Lang = "vi" | "en";
export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("vi");
  useEffect(() => {
    const saved = localStorage.getItem("aunora_language");
    if (saved === "vi" || saved === "en") setLang(saved);
  }, []);
  function changeLang(value: Lang) {
    setLang(value);
    localStorage.setItem("aunora_language", value);
  }
  const vi = lang === "vi";
  const items = vi
    ? [
        { icon: Target, title: "Học tập có mục tiêu", text: "Lộ trình rõ ràng giúp người học biết mình đang học gì và cần tiến bộ ở đâu." },
        { icon: BrainCircuit, title: "Thực hành thông minh", text: "Bài tập tương tác giúp kiến thức được ghi nhớ qua việc sử dụng thực tế." },
        { icon: Heart, title: "Đồng hành mỗi ngày", text: "Một không gian học tập thân thiện, khuyến khích bạn kiên trì và tự tin hơn." }
      ]
    : [
        { icon: Target, title: "Purposeful learning", text: "A clear learning path helps you understand what you're learning and where to improve." },
        { icon: BrainCircuit, title: "Smart practice", text: "Interactive exercises help you remember knowledge by using it in context." },
        { icon: Heart, title: "A daily companion", text: "A welcoming learning space that encourages consistency and confidence." }
      ];
  return (
    <main className="marketing-page catalog-page">
      <nav className="nav wrap">
        <Link href="/" className="aunora-auth-brand"><span className="aunora-mark"><BookOpen /></span><span className="aunora-wordmark"><b>AUNORA</b><small>LEARN • GROW • GLOW</small></span></Link>
        <div className="navlinks"><Link href="/">{vi ? "Trang chủ" : "Home"}</Link><Link href="/about" aria-current="page">{vi ? "Về chúng tôi" : "About us"}</Link><Link href="/courses">{vi ? "Khóa học" : "Courses"}</Link></div>
        <div className="navactions"><div className="marketing-language" role="group" aria-label="Choose language"><Languages size={15}/><button type="button" className={vi ? "active" : ""} onClick={() => changeLang("vi")}>VI</button><button type="button" className={!vi ? "active" : ""} onClick={() => changeLang("en")}>EN</button></div><Link href="/register" className="btn small">{vi ? "Bắt đầu học" : "Start learning"} <ArrowRight size={15}/></Link></div>
      </nav>
      <section className="catalog-wrap">
        <div className="eyebrow"><Sparkles size={15}/> {vi ? "CÂU CHUYỆN AUNORA" : "THE AUNORA STORY"}</div>
        <h1>{vi ? "Chúng tôi tin rằng" : "We believe"}<br/><em>{vi ? "ai cũng có thể tự tin dùng tiếng Anh." : "everyone can grow confident in English."}</em></h1>
        <p className="catalog-lead">{vi ? "AUNORA được xây dựng với mong muốn biến việc học tiếng Anh thành hành trình gần gũi, chủ động và đầy cảm hứng. Mỗi bước tiến nhỏ đều đáng được ghi nhận." : "AUNORA was created to make learning English feel approachable, active, and inspiring. Every small step forward deserves to be celebrated."}</p>
        <div className="catalog-grid">
          {items.map(({icon:Icon,title,text}) => <article className="catalog-card" key={title}><div className="catalog-letter"><Icon size={30}/></div><h2>{title}</h2><p>{text}</p></article>)}
        </div>
        <div className="courseinner" style={{marginTop: "56px"}}>
          <div><div className="eyebrow">{vi ? "BẮT ĐẦU HÀNH TRÌNH" : "START YOUR JOURNEY"}</div><h2>{vi ? "Tiến bộ từng chút," : "Make progress,"}<br/><em>{vi ? "tự tin mỗi ngày." : "one day at a time."}</em></h2><p>{vi ? "Khám phá các khóa học và chọn điểm bắt đầu phù hợp với bạn." : "Explore our courses and find the right place to begin."}</p><Link className="btn" href="/courses">{vi ? "Khám phá khóa học" : "Explore courses"} <ArrowRight size={16}/></Link></div>
          <div className="coursecard"><div className="coursehead"><b>AUNORA</b><span>LEARN • GROW • GLOW</span></div><div className="letter">A</div><h3>{vi ? "Học hôm nay, tự tin ngày mai." : "Learn today. Grow tomorrow."}</h3><p>{vi ? "Một hành trình học tiếng Anh được thiết kế để bạn chủ động khám phá và phát triển." : "An English-learning journey designed to help you explore and grow with confidence."}</p></div>
        </div>
      </section>
      <footer className="wrap footer"><Link href="/" className="brand"><b>A</b> AUNORA</Link><small>© 2026 AUNORA. LEARN • GROW • GLOW</small></footer>
    </main>
  );
}
