import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

    const { data, error } = await supabase
      .from("aunora_lesson_progress")
      .select("lesson_id, course_id, completed, score, total_questions, completed_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ progress: data ?? [] });
  } catch (error) {
    console.error("AUNORA progress GET:", error);
    return NextResponse.json({ error: "Không thể tải tiến độ học tập." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

    const body = await request.json();
    const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
    const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "sprout";
    const score = Number(body.score);
    const totalQuestions = Number(body.totalQuestions);

    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(lessonId) ||
        !/^[a-zA-Z0-9_-]{1,50}$/.test(courseId) ||
        !Number.isInteger(score) || !Number.isInteger(totalQuestions) ||
        score < 0 || totalQuestions < 1 || score > totalQuestions) {
      return NextResponse.json({ error: "Dữ liệu tiến độ không hợp lệ." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("aunora_lesson_progress")
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        completed: true,
        score,
        total_questions: totalQuestions,
        completed_at: now,
        updated_at: now
      }, { onConflict: "user_id,lesson_id" })
      .select("lesson_id, course_id, completed, score, total_questions, completed_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error("AUNORA progress POST:", error);
    return NextResponse.json({ error: "Không thể lưu tiến độ. Vui lòng thử lại." }, { status: 500 });
  }
}
