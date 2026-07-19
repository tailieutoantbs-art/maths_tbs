import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; 
export const runtime = 'edge'; 

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Nội dung trống' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    const systemInstruction = `Bạn là công cụ "Auto Formatter" chuyên làm sạch và canh chỉnh định dạng cho bài giảng Toán học. Nhiệm vụ của bạn:
1. XÓA BỎ HOÀN TOÀN các câu giao tiếp thừa (ví dụ: "Dưới đây là bài giảng...", "Chào bạn", "Chúc học tốt", "Đây là nội dung..."). CHỈ giữ lại nội dung học thuật.
2. Sửa lại khoảng trắng cho chuẩn:
   - Các Heading (#, ##, ###) phải có một dấu cách sau ký tự # và một dòng trống trước/sau nó.
   - Các công thức Toán LaTeX dạng block phải được bọc trong $$ ... $$.
   - Các công thức Toán LaTeX dạng inline phải được bọc trong $ ... $. Đảm bảo có khoảng trắng hợp lý giữa text và công thức.
3. Nếu phát hiện có Lời giải / Đáp án chi tiết mà chưa được bọc, hãy bọc nó vào thẻ HTML: <details><summary>Lời giải chi tiết</summary>...nội dung...</details>.
4. Không được tự ý thay đổi, cắt xén, hay tóm tắt kiến thức Toán học gốc. Chỉ canh chỉnh định dạng cho đẹp mắt và chuẩn xác.
5. TRẢ VỀ NGAY LẬP TỨC MÃ MARKDOWN ĐÃ ĐƯỢC CHUẨN HÓA, KHÔNG CÓ BẤT KỲ VĂN XUÔI NÀO KHÁC.`;

    const contentsParts = [
      { text: systemInstruction + '\n\n---\nNỘI DUNG CẦN CHUẨN HÓA:\n\n' + content }
    ];

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    let data: any;

    for (const model of modelsToTry) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: contentsParts }]
          })
        }
      );
      data = await response.json();

      const isRateLimit = data.error?.code === 429 || data.error?.message?.toLowerCase().includes('quota') || data.error?.message?.toLowerCase().includes('exceeded');
      if (!data.error || (data.error.code !== 503 && !data.error.message?.includes('high demand') && !isRateLimit)) {
        break;
      }
      console.warn(`Model ${model} is overloaded in format-lesson, trying fallback...`);
    }

    if (data.error) {
      console.error("Format Lesson API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({ error: 'Không nhận được phản hồi từ AI' }, { status: 500 });
    }

    // Clean markdown codeblocks if AI wrapped the whole thing in ```markdown
    if (generatedText.startsWith('```markdown')) {
      generatedText = generatedText.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    }

    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error("Format Lesson Error:", error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}
