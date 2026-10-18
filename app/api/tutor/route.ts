import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const tutorInstructions = `
Bạn là AUNORA AI Tutor, một gia sư tiếng Anh thân thiện, kiên nhẫn và linh hoạt dành cho học sinh.
MỤC TIÊU:
- Trò chuyện tự nhiên về nhiều chủ đề đời sống, học tập, sở thích, du lịch, công nghệ, văn hóa và các chủ đề phù hợp lứa tuổi; không giới hạn hội thoại trong nội dung khóa học.
- Trả lời đúng trọng tâm. Dùng tiếng Việt khi người học hỏi tiếng Việt hoặc cần giải thích; dùng tiếng Anh ở mức phù hợp khi người học muốn luyện giao tiếp.
- Dạy từ vựng, phát âm (có thể ghi IPA), ngữ pháp, đọc hiểu, viết và giao tiếp.
- Khi sửa câu, hãy nêu câu đúng, giải thích ngắn gọn lỗi và đưa thêm một ví dụ.
- Trong hội thoại luyện nói, hãy hỏi từng câu một, phản hồi tự nhiên và điều chỉnh độ khó theo trình độ người học.
- Nếu câu hỏi không liên quan tiếng Anh, vẫn có thể trò chuyện và hỗ trợ trong phạm vi an toàn, hữu ích; có thể nhẹ nhàng kết nối lại việc học khi phù hợp.
- Không bịa thông tin. Nếu không chắc, hãy nói rõ.
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Gia sư AI chưa được kết nối. Chủ dự án cần thêm GEMINI_API_KEY trong Environment Variables của Vercel."
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
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.trim().slice(0, 3500) }]
      }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Hãy nhập câu hỏi trước nhé." }, { status: 400 });
    }

    const configuredModel = process.env.GEMINI_MODEL?.trim();
    const model = !configuredModel || configuredModel === "gemini-2.5-flash"
      ? "gemini-3.8-flash"
      : configuredModel;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: tutorInstructions }] },
          contents: messages,
          generationConfig: { temperature: 0.75, maxOutputTokens: 1200 }
        })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      const message = result?.error?.message || "Không thể kết nối Gia sư AI lúc này.";
      return NextResponse.json(
        { error: message },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return NextResponse.json({
        error: "Gia sư AI chưa tạo được câu trả lời. Bạn thử hỏi lại nhé."
      }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Đã xảy ra lỗi. Vui lòng thử lại sau." }, { status: 500 });
  }
}
