import Link from "next/link";
import {notFound} from "next/navigation";
const plans={
free:{name:"Aunora Sprout",symbol:"✦",status:"Miễn phí",color:"#1769e6",subtitle:"Bắt đầu hành trình học tiếng Anh",features:["500 bài học","15 câu hỏi kiểm tra mỗi bài","10 lượt AI Tutor","40 Năng lượng Sói"],note:"Gói miễn phí. Quyền lợi thực tế phụ thuộc vào các tính năng đã triển khai."},
starter:{name:"Aunora Explorer",symbol:"♧",status:"49.000đ/tháng",color:"#079b78",subtitle:"Khám phá kiến thức",features:["800 bài học","50 câu hỏi kiểm tra mỗi bài","30 lượt AI Tutor","100 Năng lượng Sói"],note:"Gói chưa mở đăng ký hoặc thanh toán. Đây là quyền lợi theo bảng giá đã công bố, chưa phải cam kết tính năng đã hoạt động."},
pro:{name:"Aunora Achiever",symbol:"♛",status:"99.000đ/tháng",color:"#794de3",subtitle:"Chinh phục mục tiêu",features:["1.400 bài học","50 câu hỏi kiểm tra mỗi bài","60 lượt AI Tutor","Năng lượng Sói không giới hạn"],note:"Gói chưa mở đăng ký hoặc thanh toán. Đây là quyền lợi theo bảng giá đã công bố, chưa phải cam kết tính năng đã hoạt động."},
premium:{name:"Aunora Mastery",symbol:"◆",status:"149.000đ/tháng",color:"#c88800",subtitle:"Làm chủ tiếng Anh",features:["2.100 bài học","50 câu hỏi kiểm tra mỗi bài","AI Tutor không giới hạn","Năng lượng Sói không giới hạn"],note:"Gói chưa mở đăng ký hoặc thanh toán. Đây là quyền lợi theo bảng giá đã công bố, chưa phải cam kết tính năng đã hoạt động."}
};
export function generateStaticParams(){return Object.keys(plans).map(plan=>({plan}));}
export default async function PlanDetail({params}:{params:Promise<{plan:string}>}){
 const {plan}=await params;const info=plans[plan as keyof typeof plans];if(!info)notFound();
 const stats=info.features;
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
    <div className="aunora-plan-hero-art" aria-hidden="true"><div className="aunora-plan-orbit orbit-one"/><div className="aunora-plan-orbit orbit-two"/><div className="aunora-plan-art-symbol">{info.symbol}</div><div className="aunora-plan-art-label">AUNORA<br/><small>{info.name.replace("Aunora ","").toUpperCase()}</small></div><span className="aunora-plan-spark spark-one">✧</span><span className="aunora-plan-spark spark-two">✦</span></div>
   </section>
   <section className="aunora-plan-benefits"><div className="aunora-plan-section-title"><span>ĐẶC QUYỀN CỦA BẠN</span><h2>Học tập theo cách của bạn</h2><p>Những quyền lợi được thiết kế cho hành trình chinh phục tiếng Anh.</p></div><div className="aunora-plan-benefit-grid">{stats.map((feature,index)=><article className="aunora-plan-benefit" key={feature}><div className="aunora-plan-benefit-icon">{["▤","✓","✧","⚡"][index]}</div><div><span>QUYỀN LỢI {String(index+1).padStart(2,"0")}</span><h3>{feature}</h3></div></article>)}</div></section>
   <div className="aunora-plan-notice"><span>ⓘ</span><p>{info.note}</p></div>
   <div className="aunora-plan-footer"><Link href="/learn/plans">← Khám phá các gói khác</Link><Link href="/learn">Về trang học tập →</Link></div>
  </div>
 </main>;
}
