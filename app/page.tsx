"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, MessageCircle, Sparkles, ShieldCheck, Zap } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Bài học tương tác", text: "Học qua tình huống, từ vựng và câu hỏi thay vì chỉ đọc lý thuyết." },
  { icon: BrainCircuit, title: "Luyện tập thông minh", text: "Câu hỏi tương tác, phản hồi tức thì và theo dõi tiến độ." },
  { icon: MessageCircle, title: "AI Tutor", text: "Trợ lý học tập giúp giải thích ngữ pháp và luyện hội thoại." }
];
export default function Home() {
 return <main>
  <nav className="nav wrap"><Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link><div className="navlinks"><a href="#features">Tính năng</a><a href="#courses">Khóa học</a></div><div className="navactions"><Link href="/login">Đăng nhập</Link><Link className="btn small" href="/register">Bắt đầu miễn phí <ArrowRight size={16}/></Link></div></nav>
  <section className="hero wrap"><div><div className="eyebrow"><Sparkles size={15}/> HỌC TIẾNG ANH THEO CÁCH MỚI</div><h1>Tiếng Anh tốt hơn,<br/><em>bắt đầu từ hôm nay.</em></h1><p className="lead">Học chủ động với bài tập tương tác, lộ trình rõ ràng và trợ lý AI luôn sẵn sàng đồng hành.</p><div className="actions"><Link className="btn" href="/register">Khám phá Zenvora <ArrowRight size={18}/></Link><a className="plain" href="#courses">Xem khóa học</a></div><div className="trust"><span><ShieldCheck size={16}/> Học theo tốc độ của bạn</span><span><Zap size={16}/> Bài tập ngắn, dễ tiếp thu</span></div></div>
  <div className="visual"><div className="glow"></div><div className="study"><div className="tiny">● YOUR LEARNING SPACE <span>•••</span></div><div className="progress"><span>Tiến độ hôm nay</span><b>72%</b></div><div className="bar"><i/></div><div className="word"><small>WORD OF THE DAY</small><strong>Confident</strong><label>/ˈkɒn.fɪ.dənt/</label><p>Tự tin — feeling sure about yourself.</p><hr/><b>✨ Keep going, you are doing great!</b></div><div className="streak">🔥 <div><b>5 ngày</b><small>Chuỗi học tập</small></div></div></div><div className="badge"><BrainCircuit/> AI Tutor</div></div></section>
  <section id="features" className="features wrap"><div className="center"><div className="eyebrow">HỌC HIỆU QUẢ HƠN</div><h2>Mọi thứ bạn cần để <em>tiến bộ mỗi ngày.</em></h2><p>Một không gian học tập gọn gàng, tập trung vào thực hành.</p></div><div className="grid">{features.map(({icon:Icon,title,text})=><article key={title}><div className="icon"><Icon/></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section id="courses" className="courses"><div className="wrap courseinner"><div><div className="eyebrow">LỘ TRÌNH HỌC TẬP</div><h2>Bắt đầu từ nền tảng,<br/><em>tiến xa hơn mỗi ngày.</em></h2><p>Chọn cấp độ phù hợp và luyện tập theo nhịp độ riêng.</p></div><article className="coursecard"><div className="coursehead"><b>MIỄN PHÍ</b><span>01 / 05 khóa học</span></div><div className="letter">A</div><h3>English Starter</h3><p>Xây dựng nền tảng từ vựng, câu giao tiếp và ngữ pháp cơ bản.</p><div className="meta">🌱 Cơ bản <span>12 bài học</span></div><Link href="/register" className="btn full">Học ngay <ArrowRight size={16}/></Link></article></div></section>
  <footer className="wrap footer"><Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link><small>© 2026 Zenvora AI. Học tốt hơn mỗi ngày.</small></footer>
 </main>;
}
