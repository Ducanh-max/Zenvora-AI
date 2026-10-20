import {BookOpen,Bot,Sparkles,ShieldCheck,ArrowRight,CheckCircle2,GraduationCap,Star,Clock3} from "lucide-react";
import Link from "next/link";
import {notFound} from "next/navigation";
const plans={
free:{name:"Aunora Sprout",symbol:"✦",status:"Miễn phí",color:"#1769e6",subtitle:"Bắt đầu hành trình học tiếng Anh",features:["500 bài học","15 câu hỏi kiểm tra mỗi bài","10 lượt AI Tutor","40 Năng lượng Sói"],note:"Gói miễn phí. Quyền lợi thực tế phụ thuộc vào các tính năng đã triển khai."},
starter:{name:"Aunora Explorer",symbol:"♧",status:"49.000đ/tháng",color:"#079b78",subtitle:"Khám phá kiến thức",features:["800 bài học","50 câu hỏi kiểm tra mỗi bài","30 lượt AI Tutor","100 Năng lượng Sói"],note:"Gói chưa mở đăng ký hoặc thanh toán. Đây là quyền lợi theo bảng giá đã công bố, chưa phải cam kết tính năng đã hoạt động."},
pro:{name:"Aunora Achiever",symbol:"♛",status:"99.000đ/tháng",color:"#794de3",subtitle:"Chinh phục mục tiêu",features:["1.400 bài học","50 câu hỏi kiểm tra mỗi bài","60 lượt AI Tutor","Năng lượng Sói không giới hạn"],note:"Gói chưa mở đăng ký hoặc thanh toán. Đây là quyền lợi theo bảng giá đã công bố, chưa phải cam kết tính năng đã hoạt động."},
premium:{name:"Aunora Mastery",symbol:"◆",status:"149.000đ/tháng",color:"#c88800",subtitle:"Làm chủ tiếng Anh",features:["2.100 bài học","50 câu hỏi kiểm tra mỗi bài","AI Tutor không giới hạn","Năng lượng Sói không giới hạn"],note:"Gói chưa mở đăng ký hoặc thanh toán. Đây là quyền lợi theo bảng giá đã công bố, chưa phải cam kết tính năng đã hoạt động."}
};
const audiences={
free:{level:"Mới bắt đầu · Pre-A1 – A1",who:"Người mới học tiếng Anh, học sinh muốn làm quen từ vựng và mẫu câu đơn giản.",needs:["Thử học trước khi chọn gói nâng cao","Xây dựng thói quen học mỗi ngày","Ôn kiến thức nền tảng với bài kiểm tra ngắn"],why:"500 bài học và 15 câu kiểm tra mỗi bài phù hợp để bắt đầu với nhịp độ nhẹ nhàng. 10 lượt AI Tutor giúp làm quen với việc hỏi đáp."},
starter:{level:"Cơ bản · A1 – A2",who:"Người đã biết một ít tiếng Anh và muốn luyện tập thường xuyên, có thêm bài tập để củng cố kiến thức.",needs:["Mở rộng từ vựng và mẫu câu giao tiếp","Luyện tập nhiều câu hỏi hơn mỗi bài","Có thêm lượt trao đổi với AI Tutor"],why:"800 bài học, 50 câu kiểm tra mỗi bài và 30 lượt AI Tutor phù hợp với người muốn học đều đặn và luyện tập nhiều hơn."},
pro:{level:"Trung cấp · A2 – B1",who:"Người đã có nền tảng và muốn nâng cao phản xạ, ngữ pháp và khả năng sử dụng tiếng Anh trong tình huống thực tế.",needs:["Học chuyên sâu theo mục tiêu rõ ràng","Ôn tập và kiểm tra với cường độ cao hơn","Thường xuyên đặt câu hỏi cho AI Tutor"],why:"1.400 bài học, 60 lượt AI Tutor và Năng lượng Sói không giới hạn phù hợp với người có kế hoạch học nghiêm túc."},
premium:{level:"Trung cấp đến nâng cao · B1 trở lên",who:"Người cần học tiếng Anh thường xuyên, tự chủ trong việc luyện tập và muốn sử dụng AI Tutor nhiều.",needs:["Duy trì lịch học với khối lượng lớn","Luyện tập và hỏi AI Tutor không giới hạn","Chuẩn bị cho mục tiêu giao tiếp hoặc học tập dài hạn"],why:"2.100 bài học cùng AI Tutor và Năng lượng Sói không giới hạn phù hợp với nhu cầu học tập liên tục, linh hoạt."}
};
export function generateStaticParams(){return Object.keys(plans).map(plan=>({plan}));}
export default async function PlanDetail({params}:{params:Promise<{plan:string}>}){
 const {plan}=await params;const info=plans[plan as keyof typeof plans];if(!info)notFound();
 const stats=info.features;const audience=audiences[plan as keyof typeof audiences];
 const artwork="/images/aunora/"+({free:"coursesenglish-starter.png.png",starter:"coursestravel-english.png.png",pro:"coursesstudy-work.png.png",premium:"coursesadvanced-english.png.png"} as Record<string,string>)[plan];
 return <main className={`aunora-plan-page aunora-plan-${plan}`}>
  <div className="aunora-plan-wrap">
   <nav className="aunora-plan-nav"><Link href="/learn">← Trang học tập</Link><Link href="/learn/plans">So sánh các gói →</Link></nav>
   <section className="aunora-plan-hero">
    <div className="aunora-plan-hero-copy">
     <span className="aunora-plan-eyebrow">✦ AUNORA · LEARN • GROW • GLOW</span>
     <div className="aunora-plan-emblem">{info.symbol}</div>
     <span className="aunora-plan-pill">{plan==="free"?"GÓI MIỄN PHÍ":"GÓI HỌC NÂNG CAO"}</span>
     <h1>{info.name}</h1><p className="aunora-plan-subtitle">{info.subtitle}</p>
     <div className="aunora-plan-price">{plan==="free"?"0đ":info.status.split("/")[0]}<span> / tháng</span></div>
     <p className="aunora-plan-availability">{plan==="free"?"✓ Có thể bắt đầu ngay":"✧ Chưa mở đăng ký — xem trước đặc quyền"}</p>
     {plan==="free"?<Link className="aunora-plan-primary" href="/learn/library">Bắt đầu học ngay <span>↗</span></Link>:<span className="aunora-plan-primary aunora-plan-disabled">Sắp ra mắt <span>✦</span></span>}
    </div>
    <div className="aunora-plan-hero-art" aria-hidden="true"><div className="aunora-plan-orbit orbit-one"/><div className="aunora-plan-orbit orbit-two"/><img className="aunora-plan-mascot-art" src={artwork} alt=""/><div className="aunora-plan-art-label">AUNORA<br/><small>{info.name.replace("Aunora ","").toUpperCase()}</small></div><span className="aunora-plan-spark spark-one">✧</span><span className="aunora-plan-spark spark-two">✦</span></div>
   </section>
   <div className="aunora-plan-highlights"><div><BookOpen size={21}/><span>Học theo lộ trình</span></div><div><Bot size={21}/><span>Đồng hành cùng AI</span></div><div><Sparkles size={21}/><span>Khám phá kỹ năng mới</span></div><div><ShieldCheck size={21}/><span>Thông tin minh bạch</span></div></div>
   <section className="aunora-plan-benefits"><div className="aunora-plan-section-title"><span>ĐẶC QUYỀN CỦA BẠN</span><h2>Học tập theo cách của bạn</h2><p>Những quyền lợi được thiết kế cho hành trình chinh phục tiếng Anh.</p></div><div className="aunora-plan-benefit-grid">{stats.map((feature,index)=><article className="aunora-plan-benefit" key={feature}><div className="aunora-plan-benefit-icon">{["📚","🎯","✨","⚡"][index]}</div><div><span>QUYỀN LỢI {String(index+1).padStart(2,"0")}</span><h3>{feature}</h3></div></article>)}</div></section>
   <section className="aunora-plan-fit"><div className="aunora-plan-section-title"><span>CHỌN ĐÚNG LỘ TRÌNH</span><h2>Gói này phù hợp với ai?</h2><p>Gợi ý theo trình độ và nhu cầu học tập để bạn dễ lựa chọn.</p></div><div className="aunora-plan-fit-grid"><article className="aunora-plan-fit-card"><div className="aunora-plan-fit-icon">◎</div><span>TRÌNH ĐỘ GỢI Ý</span><h3>{audience.level}</h3><p>{audience.who}</p></article><article className="aunora-plan-fit-card"><div className="aunora-plan-fit-icon">✧</div><span>NHU CẦU PHÙ HỢP</span><h3>Mục tiêu học tập</h3><ul>{audience.needs.map(need=><li key={need}>✓ {need}</li>)}</ul></article></div><div className="aunora-plan-fit-reason"><strong>🐺 Vì sao Aivanta gợi ý gói này?</strong><p>{audience.why}</p></div><p className="aunora-plan-fit-disclaimer">Trình độ CEFR chỉ mang tính gợi ý để lựa chọn gói, không phải yêu cầu bắt buộc hay chứng nhận năng lực.</p></section>
   <section className="aunora-plan-journey"><div><span>✦ AUNORA JOURNEY</span><h2>Mỗi ngày một bước tiến cùng Aivanta</h2><p>Bắt đầu từ những bài học nhỏ, luyện tập đều đặn và theo dõi sự tiến bộ của chính bạn.</p><Link href="/learn/library">Khám phá bài học <ArrowRight size={17}/></Link></div><img src="/images/aunora/coursesenglish-starter.png.png" alt="Aivanta học tiếng Anh"/></section>
   <div className="aunora-plan-notice"><span>ⓘ</span><p>{info.note}</p></div>
   <div className="aunora-plan-footer"><Link href="/learn/plans">← Khám phá các gói khác</Link><Link href="/learn">Về trang học tập →</Link></div>
  </div>
 </main>;
}
