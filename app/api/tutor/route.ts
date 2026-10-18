import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
type ChatMessage = { role: "user" | "assistant"; content: string; imageData?: string };
const tutorInstructions = "Bạn là AUNORA AI Tutor, gia sư thân thiện dành cho học sinh. Trò chuyện tự nhiên về nhiều chủ đề phù hợp lứa tuổi. Dùng tiếng Việt khi người học hỏi tiếng Việt; dùng tiếng Anh đơn giản khi luyện giao tiếp. Hỗ trợ từ vựng, phát âm, ngữ pháp, đọc hiểu, viết và giao tiếp. Có thể đọc ảnh, nhận diện chữ, giải thích nội dung ảnh và hỗ trợ bài tập. Khi sửa câu, nêu câu đúng, giải thích ngắn và cho ví dụ. Không bịa thông tin, không yêu cầu thông tin cá nhân nhạy cảm. Với bài kiểm tra đang diễn ra, hướng dẫn cách suy nghĩ thay vì làm thay toàn bộ."; 
export async function POST(request: Request) {
 try {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Vui lòng đăng nhập để sử dụng Gia sư AI." }, { status: 401 });
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AUNORA AI Tutor chưa được kết nối. Hãy thêm GROQ_API_KEY trong Vercel." }, { status: 503 });
  const body = await request.json();
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const valid = raw.filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim()).slice(-30) as ChatMessage[];
  if (!valid.length || valid[valid.length - 1].role !== "user") return NextResponse.json({ error: "Hãy nhập câu hỏi hoặc gửi ảnh trước nhé." }, { status: 400 });
  const messages = valid.map((m, index) => {
   const parts: any[] = [{ type: "text", text: m.content.trim().slice(0, 3500) }];
   if (index === valid.length - 1 && m.role === "user" && m.imageData) {
    if (typeof m.imageData !== "string" || !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(m.imageData) || m.imageData.length > 4200000) throw new Error("IMAGE_INVALID");
    parts.push({ type: "image_url", image_url: { url: m.imageData } });
   }
   return { role: m.role, content: parts.length === 1 ? parts[0].text : parts };
  });
  const model = process.env.GROQ_VISION_MODEL?.trim() || "qwen/qwen3.8-27b";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey }, body: JSON.stringify({ model, messages: [{ role: "system", content: tutorInstructions }, ...messages], temperature: 0.7, max_completion_tokens: 1200 }) });
  const result = await response.json();
  if (!response.ok) { const isQuota = response.status === 429; return NextResponse.json({ error: isQuota ? "AUNORA AI đang chạm giới hạn lượt dùng hoặc token. Vui lòng thử lại sau." : (result?.error?.message || "Không thể kết nối Gia sư AI lúc này.") }, { status: isQuota ? 429 : 502 }); }
  const reply = result?.choices?.[0]?.message?.content?.trim();
  if (!reply) return NextResponse.json({ error: "Gia sư AI chưa tạo được câu trả lời. Bạn thử hỏi lại nhé." }, { status: 502 });
  return NextResponse.json({ reply });
 } catch (error) { const message = error instanceof Error && error.message === "IMAGE_INVALID" ? "Ảnh không hợp lệ hoặc quá lớn. Hãy chọn ảnh nhỏ hơn nhé." : "Đã xảy ra lỗi. Vui lòng thử lại sau."; return NextResponse.json({ error: message }, { status: 400 }); }
}