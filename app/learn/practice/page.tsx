"use client";
import Link from "next/link";
import {BookOpen,Target,Headphones,MessageCircle,FileText,PenLine,ArrowRight,ChevronLeft} from "lucide-react";
const skills=[
 {name:"Từ vựng",description:"Ôn tập và mở rộng vốn từ qua các bài học.",icon:BookOpen,color:"#18b76b",bg:"#e3fff1",href:"/learn/dictionary",tag:"Tra cứu & ôn từ",image:"/images/practice/vocabulary.webp.png"},
 {name:"Ngữ pháp",description:"Luyện ngữ pháp qua bài tập tương tác.",icon:Target,color:"#fa426e",bg:"#ffeaf0",href:"/learn/library?course=grammar-in-action",tag:"Bài học ngữ pháp",image:"/images/practice/grammar.webp.png"},
 {name:"Luyện nghe",description:"Rèn khả năng nghe và hiểu tiếng Anh.",icon:Headphones,color:"#2187ff",bg:"#e5f1ff",href:"/learn/library",tag:"Bài học có âm thanh",image:"/images/practice/listening.webp.png"},
 {name:"Luyện nói",description:"Thực hành phát âm và giao tiếp với AI.",icon:MessageCircle,color:"#9950f4",bg:"#f3e9ff",href:"/learn/speaking",tag:"Speaking cùng Nova",image:"/images/practice/speaking.webp.png"},
 {name:"Đọc hiểu",description:"Đọc đoạn văn và trả lời câu hỏi.",icon:FileText,color:"#e99a13",bg:"#fff2dd",href:"/learn/library",tag:"Đọc & hiểu",image:"/images/practice/reading.webp.png"},
 {name:"Viết câu",description:"Luyện viết câu và diễn đạt ý tưởng.",icon:PenLine,color:"#2379f6",bg:"#e7f0ff",href:"/learn/tutor",tag:"AI hỗ trợ sửa câu",image:"/images/practice/writing.webp.png"}
];
export default function PracticePage(){return <main className="practice"><header className="practice-header"><Link href="/learn"><ChevronLeft size={21}/> Trang chủ</Link><strong>AUNORA <span>• Luyện tập</span></strong></header><section className="hero"><div><span className="eyebrow">✦ AUNORA PRACTICE</span><h1>🏋️ Luyện tập tiếng Anh</h1><p>Chọn kỹ năng bạn muốn rèn luyện hôm nay. Mỗi ngày tiến bộ một chút cùng Aivanta!</p></div><img src="/brand/aivanta-mascot.webp.png" alt="Aivanta"/></section><section className="body"><div className="heading"><div><h2>⭐ Luyện tập theo kỹ năng</h2><p>Chọn kỹ năng bạn muốn rèn luyện</p></div><span>6 kỹ năng</span></div><div className="grid">{skills.map(s=><Link className="card" href={s.href} key={s.name}><div className="card-image" style={{backgroundImage:`linear-gradient(90deg,rgba(255,255,255,.97) 0%,rgba(255,255,255,.85) 40%,rgba(255,255,255,0) 85%),url("${s.image}")`}}/><div className="icon" style={{background:s.bg,color:s.color}}><s.icon size={32} strokeWidth={2.5}/></div><h3>{s.name}</h3><p>{s.description}</p><div className="foot"><span style={{background:s.bg,color:s.color}}>{s.tag}</span><span className="skill-button" style={{background:s.color}}>Luyện tập <ArrowRight size={18}/></span></div></Link>)}</div></section><style jsx global>{`.practice{min-height:100vh;background:linear-gradient(180deg,#e8f3ff 0%,#f7fbff 100%);color:#102b59;font-family:inherit}
.practice .practice-header{height:76px;background:#092650;display:flex;align-items:center;justify-content:space-between;padding:0 max(24px,calc((100vw - 1520px)/2));color:white}
.practice .practice-header a{color:white;text-decoration:none;display:flex;align-items:center;gap:8px;font-weight:700}
.practice .practice-header strong{font-size:22px}.practice .practice-header strong span{font-size:14px;color:#bcd7ff}
.practice .hero{width:calc(100% - 48px);max-width:1520px;margin:22px auto 0;min-height:300px;border-radius:24px;overflow:hidden;background:linear-gradient(90deg,rgba(234,246,255,.88),rgba(211,234,255,.50)),url('/images/courses/english-for-travel.webp.png') center/cover;display:flex;align-items:center;justify-content:space-between;padding:25px 55px;box-shadow:0 15px 40px #1550a01a}
.practice .hero>div{max-width:780px}.practice .eyebrow{color:#2475f4;font-weight:900;letter-spacing:2px}
.practice .hero h1{font-size:clamp(32px,4vw,56px);margin:14px 0;color:#102f68}.practice .hero p{font-size:19px;line-height:1.6;color:#41618c}
.practice .hero img{height:280px;max-width:34%;object-fit:contain;align-self:flex-end}
.practice .body{width:calc(100% - 48px);max-width:1520px;margin:30px auto;padding:0 0 70px}
.practice .heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
.practice .heading h2{font-size:29px;margin:0 0 4px;color:#102b59}.practice .heading p{color:#6c8ab8;margin:0}.practice .heading>span{color:#2b73d7;background:#e4efff;padding:9px 15px;border-radius:20px;font-weight:800}
.practice .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.practice a.card{position:relative;isolation:isolate;overflow:hidden;min-height:235px;text-decoration:none!important;color:#122c5d!important;background:#fff;border:1px solid #d9e9ff;border-radius:23px;padding:23px;box-shadow:0 8px 25px #2361a018;display:flex;flex-direction:column;align-items:flex-start;transition:transform .2s,box-shadow .2s}
.practice a.card:hover{transform:translateY(-4px);box-shadow:0 15px 35px #2361a025}
.practice .card-image{position:absolute;z-index:-1;inset:0;background-size:cover;background-position:center right;transition:transform .3s}
.practice a.card:hover .card-image{transform:scale(1.04)}
.practice a.card .icon{position:relative;width:64px;height:64px;display:grid;place-items:center;border-radius:17px;flex-shrink:0}
.practice a.card h3{position:relative;display:block;opacity:1!important;visibility:visible!important;color:#102b59!important;font-size:25px!important;line-height:1.2!important;font-weight:850!important;margin:13px 0 8px!important;text-decoration:none!important}
.practice a.card p{position:relative;opacity:1!important;color:#3b5681!important;font-size:15px!important;line-height:1.45!important;max-width:56%;margin:0!important;text-decoration:none!important}
.practice a.card .foot{position:relative;margin-top:auto;display:flex;align-items:flex-start;flex-direction:column;gap:10px;padding-top:14px}
.practice a.card .foot>span:first-child{font-size:12px;font-weight:800;border-radius:20px;padding:6px 12px}
.practice a.card .skill-button{display:inline-flex;align-items:center;gap:10px;color:white!important;border-radius:13px;padding:10px 17px;font-weight:800;font-size:14px;box-shadow:0 5px 12px #123c7622}
@media(max-width:950px){.practice .grid{grid-template-columns:repeat(2,minmax(0,1fr))}.practice .hero{padding:25px}.practice .body{margin-top:25px}}
@media(max-width:640px){.practice .grid{grid-template-columns:1fr}.practice .hero img{height:160px}.practice .hero{padding:18px;min-height:215px;width:calc(100% - 24px)}.practice .hero p{font-size:14px}.practice .practice-header{padding:0 16px}.practice .heading h2{font-size:22px}.practice .body{width:calc(100% - 24px)}.practice a.card{min-height:220px}}`}</style></main>}
