"use server";

import { revalidatePath } from "next/cache";
import {publishAnnouncement} from "@/lib/web-push-server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || user?.app_metadata?.role !== "admin") {
    throw new Error("Bạn không có quyền quản trị AUNORA.");
  }
  return supabase;
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createCourse(formData: FormData) {
  const supabase = await requireAdmin();
  const slug = field(formData, "slug");
  const title = field(formData, "title");
  if (!slug || !title) throw new Error("Vui lòng nhập mã và tên khóa học.");
  const { error } = await supabase.from("zenvora_courses").insert({
    slug, title,
    level: field(formData, "level") || "Beginner",
    description: field(formData, "description"),
    is_free: formData.get("is_free") === "on",
    sort_order: Number(field(formData, "sort_order") || 0),
  });
  if (error) throw new Error(error.message);
  try { const {data:{user}}=await supabase.auth.getUser(); if(user && formData.get("notify_learners")==="on") await publishAnnouncement(supabase,user.id,`Khóa học mới: ${title}`.slice(0,120),"AUNORA vừa thêm một khóa học mới. Mở thư viện để khám phá.","/learn/library"); } catch(error) { console.error("Course notification:",error); }
  revalidatePath("/admin");
  revalidatePath("/courses");
}

export async function updateCourse(formData: FormData) {
  const supabase = await requireAdmin();
  const id = field(formData, "id");
  const title = field(formData, "title");
  if (!id || !title) throw new Error("Thiếu thông tin khóa học.");
  const { error } = await supabase.from("zenvora_courses").update({
    slug: field(formData, "slug"),
    title,
    level: field(formData, "level") || "Beginner",
    description: field(formData, "description"),
    is_free: formData.get("is_free") === "on",
    sort_order: Number(field(formData, "sort_order") || 0),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/courses");
}

export async function deleteCourse(formData: FormData) {
  const supabase = await requireAdmin();
  const id = field(formData, "id");
  if (!id) throw new Error("Thiếu mã khóa học.");
  const { error } = await supabase.from("zenvora_courses").delete().eq("id", id);
  if (error) throw new Error("Không thể xóa khóa học đang có bài học hoặc đăng ký liên quan. " + error.message);
  revalidatePath("/admin");
  revalidatePath("/courses");
}

function lessonPayload(formData: FormData) {
  const rawContent = field(formData, "content");
  let content: unknown = [];
  if (rawContent) {
    try { content = JSON.parse(rawContent); }
    catch { throw new Error("Nội dung bài học phải là JSON hợp lệ."); }
  }
  return {
    course_id: field(formData, "course_id"),
    slug: field(formData, "slug"),
    title: field(formData, "title"),
    summary: field(formData, "summary"),
    sort_order: Number(field(formData, "sort_order") || 0),
    content,
  };
}

export async function createLesson(formData: FormData) {
  const supabase = await requireAdmin();
  const payload = lessonPayload(formData);
  if (!payload.course_id || !payload.slug || !payload.title) throw new Error("Vui lòng chọn khóa học và nhập mã, tên bài học.");
  const { error } = await supabase.from("zenvora_lessons").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/courses");
}

export async function updateLesson(formData: FormData) {
  const supabase = await requireAdmin();
  const id = field(formData, "id");
  const payload = lessonPayload(formData);
  if (!id || !payload.course_id || !payload.slug || !payload.title) throw new Error("Thiếu thông tin bài học.");
  const { error } = await supabase.from("zenvora_lessons").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteLesson(formData: FormData) {
  const supabase = await requireAdmin();
  const id = field(formData, "id");
  if (!id) throw new Error("Thiếu mã bài học.");
  const { error } = await supabase.from("zenvora_lessons").delete().eq("id", id);
  if (error) throw new Error("Không thể xóa bài học đang có tiến độ hoặc lượt làm bài liên quan. " + error.message);
  revalidatePath("/admin");
}

export async function giftTutorCredits(userId:string,amount:number){
 const db=await requireAdmin();
 if(!Number.isInteger(amount)||amount<1||amount>10000)throw new Error("Số lượt phải từ 1 đến 10000.");
 const {data,error}=await db.rpc("aunora_gift_tutor_credits",{p_user:userId,p_amount:amount});
 if(error)throw new Error(error.message);
 return Number(data);
}

