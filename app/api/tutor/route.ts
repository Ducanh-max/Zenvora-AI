import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const tutorInstructions = `
Bạn là AUNORA AI Tutor, một gia sư tiếng Anh thân thiện, kiên nhẫn và linh hoạt dành cho học sinh.
- Trò chuyện tự nhiên về nhiều chủ đề đời sống, học tập, sở thích, du lịch, công nghệ và văn hóa phù hợp lứa tuổi; không giới hạn trong bài học tiếng Anh.
- Dùng tiếng Việt khi người học hỏi tiếng Việt hoặc cần giải thích; dùng tiếng Anh đơn giản khi luyện giao tiếp.
- Hỗ trợ từ vựng, phát âm/IPA, ngữ pháp, đọc hiểu, viết và giao tiếp.
- Khi sửa câu, nêu câu đúng, giải thích lỗi ngắn gọn và thêm ví dụ.
- Khi luyện hội thoại, hỏi từng câu một và điều chỉnh độ khó theo người học.
- Không bịa thông tin; nếu không chắc, hãy nói rõ.
- Không yêu cầu thông tin cá nhân nhạy cảm. Với bài kiểm tra đang diễn ra, hướng dẫn cách suy nghĩ thay vì làm thay toàn bộ.
- Trình bày dễ đọc, không quá dài nếu người học không yêu cầu giải thích chi tiết.
`.trim();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để sử dụng Gia sư AI." }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "AUNORA AI Tutor chưa được kết nối. Hãy thêm GROQ_API_KEY vào Environment Variables của Vercel."
      }, { status: 503 });
    }

    const body = await request.json();
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter((m: any): m is ChatMessage =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
      )
      .slice(-30)
      .map((m: ChatMessage) => ({
        role: m.role,
        content: m.content.trim().slice(0, 3500)
      }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Hãy nhập câu hỏi trước nhé." }, { status: 400 });
    }

    const model = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: tutorInstructions }, ...messages],
        temperature: 0.7,
        max_completion_tokens: 1200
      })
    });

    const result = await response.json();
    if (!response.ok) {
      const providerMessage = result?.error?.message || "Không thể kết nối Gia sư AI lúc này.";
      const isQuota = response.status === 429;
      return NextResponse.json({
        error: isQuota
          ? "AUNORA AI đang chạm giới hạn lượt dùng tạm thời. Vui lòng thử lại sau."
          : providerMessage
      }, { status: isQuota ? 429 : 502 });
    }

    const reply = result?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Gia sư AI chưa tạo được câu trả lời. Bạn thử hỏi lại nhé." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Đã xảy ra lỗi. Vui lòng thử lại sau." }, { status: 500 });
  }
}
