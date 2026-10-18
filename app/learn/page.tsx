import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, MessageCircle, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const supabase = await createClient();
  const [{ data: courses }, { data: { user } }] = await Promise.all([
    supabase.from("zenvora_courses").select("id,slug,title,level,description,is_free,sort_order").order("sort_order"),
    supabase.auth.getUser(),
  ]);

  return <main className="learnpage">
    <header className="learnnav">
      <Link href="/" className="brand"><b>Z</b> zenvora<span>AI</span></Link>
      <div className="navlogout">{user?.email ?? "Tài khoản của bạn"}</div>
    </header>
    <section className="learnwrap">
      <div className="eyebrow">KHÔNG GIAN HỌC TẬP</div>
      <h1>Chào mừng đến với <em>Zenvora AI.</em></h1>
      <p className="learnlead">Chọn một khóa học để bắt đầu hành trình tiếng Anh của bạn.</p>
      <div className="learnfeatures">
        <article><BookOpen/><b>Bài học</b><span>Học theo chủ đề</span></article>
        <article><BrainCircuit/><b>Luyện tập</b><span>Quiz tương tác</span></article>
        <article><MessageCircle/><b>AI Tutor</b><span>Trợ lý học tập</span></article>
      </div>
      <h2>Khóa học của bạn</h2>
      <div className="coursegrid">
        {(courses ?? []).map((course, i) => <article className="learncourse" key={course.id}>
          <div className="learncoursehead">
            <span className={course.is_free ? "freeflag" : "lockflag"}>
              {course.is_free ? "MIỄN PHÍ" : <><LockKeyhole size={12}/> SẮP MỞ</>}
            </span>
            <span>{String(i + 1).padStart(2, "0")}</span>
          </div>
          <div className="learnletter">{course.title.slice(0, 1).toUpperCase()}</div>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <div className="learnmeta"><span>{course.level}</span><span>{course.is_free ? "3 bài học" : "Sắp ra mắt"}</span></div>
          {course.is_free
            ? <Link href="/learn/starter" className="coursebutton">Vào học <ArrowRight size={15}/></Link>
            : <button className="coursebutton disabled" disabled>Chưa mở khóa</button>}
        </article>)}
      </div>
      {(!courses || courses.length === 0) && <p>Chưa có khóa học nào. Vui lòng tải lại sau ít phút.</p>}
    </section>
  </main>;
}
