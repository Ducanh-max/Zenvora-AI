import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LibraryClient, { type LibraryLesson } from "./library-client";
import {getMembership} from "@/lib/membership";

export const dynamic = "force-dynamic";

const planLimits: Record<string, { name: string; lessonLimit: number; quizSize: number }> = {
  starter: { name: "Aunora Sprout", lessonLimit: 200, quizSize: 15 },
  plus: { name: "Aunora Explorer", lessonLimit: 800, quizSize: 50 },
  pro: { name: "Aunora Achiever", lessonLimit: 1400, quizSize: 50 },
  elite: { name: "Aunora Mastery", lessonLimit: 2100, quizSize: 50 },
};

export default async function LibraryPage({ searchParams }: { searchParams?: Promise<{ course?: string }> }) {
  const params = await searchParams;
  const membership = await getMembership();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: courses, error: coursesError }, { data: lessons, error: lessonsError }, { data: entitlement }] = await Promise.all([
    supabase.from("zenvora_courses").select("id,slug,title,level,description,is_free,sort_order").order("sort_order", { ascending: true }),
    supabase.from("zenvora_lessons").select("id,course_id,slug,title,summary,content,sort_order").eq("is_published",true).order("sort_order", { ascending: true }),
    supabase.from("aunora_user_entitlements").select("plan_id,active_until").eq("user_id", user.id).maybeSingle(),
  ]);

  let planId = user.app_metadata?.role === "admin" ? "elite" : (entitlement?.plan_id || "starter");
  if (user.app_metadata?.role !== "admin" && entitlement?.active_until && new Date(entitlement.active_until).getTime() < Date.now()) planId = "starter";
  const plan = planLimits[planId] || planLimits.starter;
  const explorerAllowed = membership.isAdmin || membership.plan !== "free";
  const visibleCourses = (courses || []).filter(course => course.is_free || explorerAllowed);
  const visibleCourseIds = new Set(visibleCourses.map(course => course.id));
  const visibleLessons = (lessons || []).filter(lesson => visibleCourseIds.has(lesson.course_id));
  const { data: progress } = await supabase.from("aunora_lesson_progress")
    .select("lesson_id,completed,score,total_questions")
    .eq("user_id", user.id);

  return <main className="quizpage aunora-quiz lesson-hub als-page">
    <div className="quiztop">
      <Link href="/learn"><ArrowLeft size={17}/>Về bảng điều khiển</Link>
      <span><BookOpen size={15}/> AUNORA · THƯ VIỆN BÀI HỌC</span>
      <span className="lesson-chip">{plan.name}</span>
    </div>
    <section className="library-heading">
      <div className="eyebrow"><Sparkles size={14}/> LỘ TRÌNH TIẾNG ANH CỦA BẠN</div><img className="library-aivanta" src="/brand/aivanta-mascot.webp.png" alt="Aivanta chào mừng bạn đến thư viện bài học"/>
      <h1>Học từng bước, <em>tiến bộ mỗi ngày.</em></h1>
      <p>Chọn một khóa học phù hợp với mục tiêu của bạn. Mỗi khóa học đều có bài học, luyện tập, bài kiểm tra và AI Tutor đồng hành cùng bạn.</p>
      <div className="library-summary"><b>{visibleCourses.length} khóa học · {visibleLessons.length} bài học</b><span>5 khóa học miễn phí · Bắt đầu học ngay hôm nay</span><span>15 câu kiểm tra cho mỗi bài trong giai đoạn thử nghiệm.</span></div>
    </section>
    {coursesError || lessonsError ? <div className="lesson-alert">Không thể tải danh sách khóa học. Hãy kiểm tra quyền đọc các bảng zenvora_courses và zenvora_lessons trong Supabase.</div> :
      <LibraryClient courses={visibleCourses as import("./library-client").LibraryCourse[]} lessons={visibleLessons as LibraryLesson[]} progress={(progress || []) as {lesson_id:string;completed:boolean;score:number;total_questions:number}[]} quizSize={plan.quizSize} initialCourseSlug={params?.course} />}
    <p className="library-footnote">Chọn khóa học phù hợp với mục tiêu của bạn và bắt đầu hành trình học tiếng Anh.</p>
  
<style>{`
.als-page{max-width:none!important;min-height:100vh!important;padding:12px max(22px,calc((100vw - 1450px)/2)) 50px!important;background:linear-gradient(90deg,#061b46df,#0b2850b8),url('/images/aunora/aunora-castle-background.png.png') center center/cover fixed!important;color:#fff!important}
/* Course and lesson maps use the available viewport; the library welcome banner is only for course selection. */
.als-page:has(.aunora-course-design) .library-heading{display:none!important}
/* Full-screen lesson: remove the library header and navigation above the lesson progress. */
.als-page:has(.adv-screen) .library-heading,
.als-page:has(.adv-screen) .quiztop,
.als-page:has(.library-study) .library-heading,
.als-page:has(.library-study) .quiztop{display:none!important}
.als-page:has(.adv-screen){padding:0!important}

.als-page:has(.aunora-course-design) .quiztop{margin-bottom:8px!important}
.als-page .quiztop{max-width:1380px;margin:0 auto 18px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;color:white}
.als-page .quiztop>a,.als-page .quiztop>span{color:#fff!important;background:#0b285dbd!important;border:1px solid #5b8ac56b!important;border-radius:99px!important;padding:9px 14px!important;font-size:13px!important;font-weight:700!important;display:flex;align-items:center;gap:7px;text-decoration:none}
.als-page .lesson-chip{background:#164d6cbb!important}
.als-page .library-heading{position:relative;max-width:1380px;margin:0 auto 15px;padding:15px 0 0;min-height:285px;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible}
.als-page .library-heading:before{content:"";position:absolute;inset:-60px -25px -10px;background:linear-gradient(90deg,#081a3ccf 0%,#092351ac 48%,transparent 80%);z-index:0;pointer-events:none}
.als-page .library-heading>*{position:relative;z-index:1}
.als-page .library-heading .eyebrow{font-weight:900;color:#d8e7ff!important;letter-spacing:1.4px}
.als-page .library-heading h1{max-width:610px;margin:9px 0 14px;color:white!important;font-size:clamp(36px,4vw,57px);line-height:1.1;letter-spacing:-1px}
.als-page .library-heading h1 em{display:block;font-style:normal;background:linear-gradient(100deg,#b5dfff,#448eff);-webkit-background-clip:text;background-clip:text;color:transparent}
.als-page .library-heading p{max-width:690px;color:#edf5ff!important;line-height:1.6;font-size:15px}
.als-page .library-heading .library-aivanta{position:absolute!important;right:10%;bottom:-30px;height:315px;width:315px;object-fit:contain;z-index:0;filter:drop-shadow(0 12px 25px #051a4e88)}
.als-page .library-summary{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:20px;max-width:760px;margin-top:22px;padding:16px 19px;border:1px solid #75b6ff63;background:#072956a8;border-radius:15px;color:#dceaff;font-size:12px}
.als-page .library-summary b,.als-page .library-summary span{color:#fff!important}
.als-page .library-courses-title{max-width:1380px;margin:20px auto 14px;padding:10px 16px;border-radius:12px;background:#0b285dc9;color:#ffffff!important;font-size:21px;font-weight:900;letter-spacing:.2px;text-shadow:0 1px 3px #061b46;display:block;width:fit-content;box-shadow:0 4px 16px #061b4633}
.aunora-library-showcase{max-width:1380px;margin:0 auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px;position:relative;z-index:1}
.als-card{overflow:hidden;position:relative;border:2px solid #8aabf7;border-radius:21px;background:linear-gradient(160deg,#fff,#dbe7ff 78%,#b4c6ff);box-shadow:0 12px 25px #0006;color:#102a61;min-width:0}
.als-feature{grid-column:span 2}.als-wide{grid-column:span 3;display:grid;grid-template-columns:50% 50%;min-height:188px}
.als-art{height:130px;position:relative;overflow:hidden;background:#2a73d0}.als-art img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 40%}
.als-wide .als-art{height:100%;min-height:188px}
.als-free{position:absolute;top:12px;left:12px;padding:7px 12px;border-radius:99px;background:#1fc976;color:white;font-size:12px;font-weight:900}
.als-info{padding:14px 16px 13px;display:flex;flex-direction:column;gap:8px;min-width:0}
.als-info-top{display:flex;align-items:center;justify-content:space-between;gap:7px}
.als-info h2{margin:0;font-size:17px;color:#09265b;line-height:1.2}
.als-symbol{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#53c8ff,#3567fa);color:white;display:grid;place-items:center;font-size:21px;flex-shrink:0;box-shadow:0 5px 11px #5a7fea44}
.als-card-0 .als-symbol{background:linear-gradient(135deg,#6bdc74,#159f66)}.als-card-3 .als-symbol,.als-card-4 .als-symbol{background:linear-gradient(135deg,#9875ed,#5941c3)}
.als-info p{margin:0;color:#244980;font-size:12px;line-height:1.5;min-height:32px}
.als-pills{display:flex;flex-wrap:wrap;gap:5px;margin-top:auto}
.als-pills span{padding:5px 8px;border-radius:8px;background:#b9d1ff94;color:#1c4b9a;font-size:11px;white-space:nowrap}
.als-info button{width:100%;border:0;border-radius:12px;padding:10px 12px;color:white;background:linear-gradient(100deg,#2a90ff,#3f5cf4);font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 4px 0 #233edb33}
.als-info button:hover{filter:brightness(1.08)}
.als-page .library-footnote{max-width:1380px;margin:20px auto;color:#d3e6ff;font-size:12px}
.als-page .library-course-view,.als-page .library-study{max-width:1380px;margin:auto;background:#fff;color:#142d5a;border-radius:20px;padding:25px}
.als-page .library-course-view .library-card,.als-page .library-study article{color:#16315d}
@media(max-width:950px){.als-feature{grid-column:span 3}.als-wide{grid-column:span 6}.als-page .library-heading .library-aivanta{right:0;opacity:.55}}
@media(max-width:650px){.als-page{padding:12px 12px 35px!important}.als-page .library-heading{min-height:290px}.als-page .library-heading h1{font-size:35px}.als-page .library-heading .library-aivanta{height:220px;width:220px;right:-15px;bottom:0;opacity:.4}.als-page .library-summary{gap:8px;padding:11px;font-size:10px}.als-feature,.als-wide{grid-column:span 6}.als-wide{grid-template-columns:1fr}.als-wide .als-art{height:135px;min-height:0}.als-page .quiztop{justify-content:center}}
`}</style>
</main>;
}