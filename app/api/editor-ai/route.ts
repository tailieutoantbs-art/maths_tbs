import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình Gemini API Key trong file .env' }, { status: 500 });
    }

    // Lệnh ép AI trả lời dạng văn bản Markdown + LaTeX (Không ép JSON)
    const systemInstruction = `Bạn là một chuyên gia Toán học và giáo dục tại Việt Nam. Hãy trả lời chi tiết, chính xác và LUÔN LUÔN sử dụng chuẩn Markdown kết hợp với mã LaTeX cho mọi công thức Toán học. Không sử dụng HTML.`;
    
    const fullPrompt = `${systemInstruction}\n\nYêu cầu của giáo viên:\n${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      }
    );

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json({ error: 'AI không thể phản hồi nội dung.' }, { status: 500 });
    }

    return NextResponse.json({ text: aiText });

  } catch (error) {
    console.error("Lỗi AI Phòng Biên Soạn:", error);
    return NextResponse.json({ error: 'Quá trình biên soạn AI gặp trục trặc.' }, { status: 500 });
  }
}