import Link from "next/link";
import { Activity, ArrowLeft, BookOpen, GraduationCap, Layers3, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createCourse, createLesson, deleteCourse, deleteLesson, updateCourse, updateLesson } from "./actions";

export const dynamic = "force-dynamic";

type Course = { id: string; slug: string; title: string; level: string; description: string; is_free: boolean; sort_order: number };
type Lesson = { id: string; course_id: string; slug: string; title: string; summary: string; content: unknown; sort_order: number };
type Profile = { id: string; display_name: string | null; created_at: string };

function StatCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: number; note: string }) {
  return <article className="admin-stat"><span className="admin-stat-icon"><Icon size={19}/></span><div><small>{label}</small><strong>{value.toLocaleString("vi-VN")}</strong><span>{note}</span></div></article>;
}

export default async function AdminPage() {
  let supabase;
  try { supabase = await createClient(); }
  catch {
    return <main className="admin-gate"><section><ShieldCheck size={34}/><h1>Admin AUNORA</h1><p>Chưa cấu hình kết nối Supabase trên môi trường triển khai. Hãy kiểm tra biến NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</p><Link href="/">Về trang chủ</Link></section></main>;
  }
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  const claims = authUser ? { app_metadata: authUser.app_metadata, email: authUser.email } : undefined;
  if (authError || !claims) {
    return <main className="admin-gate"><section><ShieldCheck size={34}/><h1>Khu vực quản trị</h1><p>Bạn cần đăng nhập bằng tài khoản Supabase để truy cập Admin. Tài khoản demo lưu trong trình duyệt hiện tại chưa thể dùng cho quyền quản trị.</p><Link href="/login">Đến trang đăng nhập</Link><Link href="/" className="admin-gate-back">Về trang chủ</Link></section></main>;
  }
  if (claims.app_metadata?.role !== "admin") {
    return <main className="admin-gate"><section><ShieldCheck size={34}/><h1>Chưa có quyền quản trị</h1><p>Tài khoản đã đăng nhập nhưng chưa được cấp vai trò admin trong Supabase Auth. Chỉ chủ dự án mới có thể cấp quyền này.</p><Link href="/learn">Về khu vực học tập</Link></section></main>;
  }

  const [userCount, courseCount, lessonCount, enrollmentCount, courseResult, lessonResult, profileResult, statsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("zenvora_courses").select("id", { count: "exact", head: true }),
    supabase.from("zenvora_lessons").select("id", { count: "exact", head: true }),
    supabase.from("zenvora_enrollments").select("id", { count: "exact", head: true }),
    supabase.from("zenvora_courses").select("id,slug,title,level,description,is_free,sort_order").order("sort_order"),
    supabase.from("zenvora_lessons").select("id,course_id,slug,title,summary,content,sort_order").order("sort_order"),
    supabase.from("profiles").select("id,display_name,created_at").order("created_at", { ascending: false }).limit(15),
    supabase.from("learning_stats").select("user_id,xp,streak_days,minutes_learned"),
  ]);

  const courses = (courseResult.data ?? []) as Course[];
  const lessons = (lessonResult.data ?? []) as Lesson[];
  const profiles = (profileResult.data ?? []) as Profile[];
  const stats = statsResult.data ?? [];
  const statsByUser = new Map(stats.map((row: { user_id: string; xp: number; streak_days: number; minutes_learned: number }) => [row.user_id, row]));
  const errors = [courseResult.error, lessonResult.error, profileResult.error, statsResult.error].filter(Boolean);

  return <main className="admin-page">
    <aside className="admin-sidebar">
      <Link href="/" className="admin-brand"><span>A</span><b>AUNORA<small>ADMIN CONSOLE</small></b></Link>
      <div className="admin-side-label">QUẢN TRỊ</div>
      <a href="#overview" className="admin-side-link active"><Activity size={17}/> Tổng quan</a>
      <a href="#users" className="admin-side-link"><Users size={17}/> Người dùng</a>
      <a href="#courses" className="admin-side-link"><BookOpen size={17}/> Khóa học</a>
      <a href="#lessons" className="admin-side-link"><GraduationCap size={17}/> Bài học</a>
      <div className="admin-sidebar-bottom"><span className="admin-secure"><ShieldCheck size={15}/> Admin access</span><Link href="/learn"><ArrowLeft size={15}/> Về ứng dụng</Link></div>
    </aside>
    <div className="admin-content">
      <header className="admin-topbar"><div><small>AUNORA / ADMIN</small><h1>Bảng điều khiển</h1></div><div className="admin-user"><span className="admin-avatar">{(claims.email || "A").slice(0,1).toUpperCase()}</span><span><b>{claims.email || "Administrator"}</b><small>Quản trị viên</small></span></div></header>
      <section id="overview" className="admin-section">
        <div className="admin-section-heading"><div><span className="admin-eyebrow">TỔNG QUAN HỆ THỐNG</span><h2>Xin chào, quản trị viên 👋</h2><p>Theo dõi và quản lý hoạt động học tập trên AUNORA.</p></div><span className="admin-live"><i/> Đã kết nối Supabase</span></div>
        {errors.length > 0 && <div className="admin-alert">Một số dữ liệu chưa tải được. Hãy kiểm tra quyền truy cập và RLS trong Supabase.</div>}
        <div className="admin-stats">
          <StatCard icon={Users} label="Người dùng" value={userCount.count ?? 0} note="Hồ sơ đã tạo"/>
          <StatCard icon={BookOpen} label="Khóa học" value={courseCount.count ?? 0} note="Trong thư viện"/>
          <StatCard icon={GraduationCap} label="Bài học" value={lessonCount.count ?? 0} note="Nội dung đã tạo"/>
          <StatCard icon={Layers3} label="Lượt đăng ký" value={enrollmentCount.count ?? 0} note="Ghi danh khóa học"/>
        </div>
      </section>

      <section id="users" className="admin-section">
        <div className="admin-section-heading"><div><span className="admin-eyebrow">CỘNG ĐỒNG</span><h2>Người dùng gần đây</h2><p>Thông tin lấy từ bảng hồ sơ và thống kê học tập.</p></div></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Người dùng</th><th>Ngày tham gia</th><th>XP</th><th>Chuỗi ngày</th><th>Thời gian học</th></tr></thead><tbody>
          {profiles.length ? profiles.map((profile) => { const s = statsByUser.get(profile.id) as { xp?: number; streak_days?: number; minutes_learned?: number } | undefined; return <tr key={profile.id}><td><b>{profile.display_name || "Chưa đặt tên"}</b><small>{profile.id.slice(0,8)}…</small></td><td>{new Date(profile.created_at).toLocaleDateString("vi-VN")}</td><td>{s?.xp ?? 0}</td><td>{s?.streak_days ?? 0} ngày</td><td>{s?.minutes_learned ?? 0} phút</td></tr>; }) : <tr><td colSpan={5} className="admin-empty">Chưa có hồ sơ người dùng.</td></tr>}
        </tbody></table></div>
      </section>

      <section id="courses" className="admin-section">
        <div className="admin-section-heading"><div><span className="admin-eyebrow">NỘI DUNG HỌC TẬP</span><h2>Quản lý khóa học</h2><p>Thêm mới hoặc chỉnh sửa khóa học đang có trong cơ sở dữ liệu.</p></div></div>
        <form action={createCourse} className="admin-form admin-create-form">
          <h3>＋ Thêm khóa học</h3><div className="admin-form-grid">
            <label>Mã khóa học<input name="slug" required placeholder="daily-conversation"/></label><label>Tên khóa học<input name="title" required placeholder="Daily Conversation"/></label>
            <label>Trình độ<input name="level" defaultValue="Beginner"/></label><label>Thứ tự<input name="sort_order" type="number" defaultValue="1"/></label>
            <label className="admin-field-wide">Mô tả<input name="description" placeholder="Mô tả ngắn về khóa học"/></label>
            <label className="admin-check"><input name="is_free" type="checkbox"/> Khóa học miễn phí</label>
          </div><button className="admin-primary">Thêm khóa học</button>
        </form>
        <div className="admin-record-list">{courses.map(course => <details className="admin-record" key={course.id}><summary><span className="admin-record-letter">{course.title.slice(0,1)}</span><span className="admin-record-name"><b>{course.title}</b><small>/{course.slug} · {course.level}</small></span><span className={course.is_free ? "admin-pill free" : "admin-pill"}>{course.is_free ? "MIỄN PHÍ" : "TRẢ PHÍ"}</span><span className="admin-details-hint">Chỉnh sửa⌄</span></summary>
          <form action={updateCourse} className="admin-form"><input type="hidden" name="id" value={course.id}/><div className="admin-form-grid">
            <label>Mã khóa học<input name="slug" required defaultValue={course.slug}/></label><label>Tên khóa học<input name="title" required defaultValue={course.title}/></label><label>Trình độ<input name="level" defaultValue={course.level}/></label><label>Thứ tự<input name="sort_order" type="number" defaultValue={course.sort_order}/></label><label className="admin-field-wide">Mô tả<input name="description" defaultValue={course.description}/></label><label className="admin-check"><input name="is_free" type="checkbox" defaultChecked={course.is_free}/> Miễn phí</label>
          </div><div className="admin-form-actions"><button className="admin-primary">Lưu thay đổi</button></div></form>
          <form action={deleteCourse} className="admin-delete-form"><input type="hidden" name="id" value={course.id}/><button className="admin-danger">Xóa khóa học</button></form>
        </details>)}</div>
      </section>

      <section id="lessons" className="admin-section">
        <div className="admin-section-heading"><div><span className="admin-eyebrow">CHƯƠNG TRÌNH HỌC</span><h2>Quản lý bài học</h2><p>Thêm bài học vào khóa học, cập nhật phần giới thiệu và nội dung JSON.</p></div></div>
        <form action={createLesson} className="admin-form admin-create-form">
          <h3>＋ Thêm bài học</h3><div className="admin-form-grid">
            <label>Khóa học<select name="course_id" required defaultValue=""><option value="" disabled>Chọn khóa học</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
            <label>Mã bài học<input name="slug" required placeholder="greetings"/></label><label>Tên bài học<input name="title" required placeholder="Greetings & Introductions"/></label><label>Thứ tự<input name="sort_order" type="number" defaultValue={1}/></label>
            <label className="admin-field-wide">Mô tả<input name="summary" placeholder="Tóm tắt bài học"/></label>
            <label className="admin-field-wide">Nội dung JSON<textarea name="content" rows={4} defaultValue="[]" /></label>
          </div><button className="admin-primary">Thêm bài học</button>
        </form>
        <div className="admin-record-list">{lessons.map(lesson => <details className="admin-record" key={lesson.id}><summary><span className="admin-record-letter"><GraduationCap size={19}/></span><span className="admin-record-name"><b>{lesson.title}</b><small>/{lesson.slug} · {courses.find(c=>c.id===lesson.course_id)?.title || "Khóa học"}</small></span><span className="admin-details-hint">Chỉnh sửa⌄</span></summary>
          <form action={updateLesson} className="admin-form"><input type="hidden" name="id" value={lesson.id}/><div className="admin-form-grid">
            <label>Khóa học<select name="course_id" defaultValue={lesson.course_id}>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Mã bài học<input name="slug" required defaultValue={lesson.slug}/></label><label>Tên bài học<input name="title" required defaultValue={lesson.title}/></label><label>Thứ tự<input name="sort_order" type="number" defaultValue={lesson.sort_order}/></label><label className="admin-field-wide">Mô tả<input name="summary" defaultValue={lesson.summary}/></label><label className="admin-field-wide">Nội dung JSON<textarea name="content" rows={5} defaultValue={JSON.stringify(lesson.content ?? [], null, 2)}/></label>
          </div><div className="admin-form-actions"><button className="admin-primary">Lưu bài học</button></div></form>
          <form action={deleteLesson} className="admin-delete-form"><input type="hidden" name="id" value={lesson.id}/><button className="admin-danger">Xóa bài học</button></form>
        </details>)}</div>
      </section>
      <footer className="admin-footer">AUNORA ADMIN CONSOLE · DỮ LIỆU ĐƯỢC BẢO VỆ BẰNG SUPABASE RLS</footer>
    </div>
  </main>;
}
