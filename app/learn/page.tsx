import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, MessageCircle, LockKeyhole } from "lucide-react";

const courses=[
 {name:"English Starter",level:"Cơ bản",lessons:"12 bài học",free:true,description:"Từ vựng nền tảng, câu giao tiếp và ngữ pháp căn bản."},
 {name:"Everyday English",level:"Sơ cấp",lessons:"18 bài học",free:false,description:"Giao tiếp trong trường học, gia đình và cuộc sống hằng ngày."},
 {name:"Grammar Builder",level:"Sơ trung cấp",lessons:"20 bài học",free:false,description:"Củng cố cấu trúc câu và sử dụng ngữ pháp tự nhiên."},
 {name:"Speak with Confidence",level:"Trung cấp",lessons:"16 bài học",free:false,description:"Luyện phản xạ nói và diễn đạt ý kiến."},
 {name:"English Explorer",level:"Nâng cao",lessons:"22 bài học",free:false,description:"Mở rộng vốn từ và đọc hiểu các chủ đề học thuật."}
];
export default function LearnPage(){
 return <main className="learnpage"><header className="learnnav"><Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link><Link href="/login" className="navlogout">Đăng nhập tài khoản</Link></header><section className="learnwrap"><div className="eyebrow">KHÔNG GIAN HỌC TẬP</div><h1>Chào mừng đến với <em>Zenvora AI.</em></h1><p className="learnlead">Chọn một khóa học để bắt đầu hành trình tiếng Anh của bạn.</p><div className="learnfeatures"><article><BookOpen/><b>Bài học</b><span>Học theo chủ đề</span></article><article><BrainCircuit/><b>Luyện tập</b><span>Quiz tương tác</span></article><article><MessageCircle/><b>AI Tutor</b><span>Trợ lý học tập</span></article></div><h2>Khóa học của bạn</h2><div className="coursegrid">{courses.map((c,i)=><article className="learncourse" key={c.name}><div className="learncoursehead"><span className={c.free?"freeflag":"lockflag"}>{c.free?"MIỄN PHÍ":<><LockKeyhole size={12}/> SẮP MỞ</>}</span><span>0{i+1}</span></div><div className="learnletter">{String.fromCharCode(65+i)}</div><h3>{c.name}</h3><p>{c.description}</p><div className="learnmeta"><span>{c.level}</span><span>{c.lessons}</span></div>{c.free?<Link href="/learn/starter" className="coursebutton">Vào học <ArrowRight size={15}/></Link>:<button className="coursebutton disabled" disabled>Chưa mở khóa</button>}</article>)}</div></section></main>;
}
