import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LibraryClient, { type LibraryLesson } from "./library-client";

export const dynamic = "force-dynamic";

const planLimits: Record<string, { name: string; lessonLimit: number; quizSize: number }> = {
  starter: { name: "Aunora Sprout", lessonLimit: 500, quizSize: 15 },
  plus: { name: "Aunora Explorer", lessonLimit: 800, quizSize: 50 },
  pro: { name: "Aunora Achiever", lessonLimit: 1400, quizSize: 50 },
  elite: { name: "Aunora Mastery", lessonLimit: 2100, quizSize: 50 },
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: lessons, error: lessonsError }, { data: entitlement }] = await Promise.all([
    supabase.from("zenvora_lessons").select("id,slug,title,summary,content,sort_order").order("sort_order", { ascending: true }),
    supabase.from("aunora_user_entitlements").select("plan_id,active_until").eq("user_id", user.id).maybeSingle(),
  ]);

  let planId = entitlement?.plan_id || "starter";
  if (entitlement?.active_until && new Date(entitlement.active_until).getTime() < Date.now()) planId = "starter";
  const plan = planLimits[planId] || planLimits.starter;
  const { data: progress } = await supabase.from("aunora_lesson_progress")
    .select("lesson_id,completed,score,total_questions")
    .eq("user_id", user.id);

  return <main className="quizpage aunora-quiz lesson-hub">
    <div className="quiztop">
      <Link href="/learn"><ArrowLeft size={17}/>Về bảng điều khiển</Link>
      <span><BookOpen size={15}/> AUNORA · THƯ VIỆN BÀI HỌC</span>
      <span className="lesson-chip">{plan.name}</span>
    </div>
    <section className="library-heading">
      <div className="eyebrow"><Sparkles size={14}/> LỘ TRÌNH TIẾNG ANH</div>
      <h1>Học từng bước, <em>tiến bộ mỗi ngày.</em></h1>
      <p>Chọn một bài học, ôn từ vựng, luyện câu ví dụ và hoàn thành bài kiểm tra tương tác.</p>
      <div className="library-summary"><b>{lessons?.length || 0} bài học đã xuất bản</b><span>Gói hiện tại cho phép tối đa {plan.lessonLimit.toLocaleString("vi-VN")} bài học khi thư viện được mở rộng.</span><span>{plan.quizSize} câu kiểm tra mỗi bài theo quyền lợi gói.</span></div>
    </section>
    {lessonsError ? <div className="lesson-alert">Không thể tải thư viện. Hãy kiểm tra quyền đọc bảng zenvora_lessons trong Supabase.</div> :
      <LibraryClient lessons={(lessons || []) as LibraryLesson[]} progress={(progress || []) as {lesson_id:string;completed:boolean;score:number;total_questions:number}[]} quizSize={plan.quizSize} />}
    <p className="library-footnote">Hiện thư viện có {lessons?.length || 0} bài học thực tế. Số lượng 500–2.100 là hạn mức mục tiêu theo gói, không phải số bài đã xuất bản.</p>
  </main>;
}