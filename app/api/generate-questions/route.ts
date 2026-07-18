import { NextResponse } from 'next/server';
import { AUTO_QUESTION_PROMPT } from '@/lib/prompts-appendix';

export async function POST(request: Request) {
  try {
    const { topic, level, count, locale } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình Gemini API Key' }, { status: 500 });
    }

    if (!topic || !level || !count) {
      return NextResponse.json({ error: 'Thiếu thông tin đầu vào (chủ đề, cấp độ, số lượng)' }, { status: 400 });
    }

    let fullPrompt = AUTO_QUESTION_PROMPT
      .replace('[TOPIC]', topic)
      .replace('[LEVEL]', level)
      .replace('[COUNT]', String(count));
      
    if (locale === 'en') {
      fullPrompt += "\n\nQUAN TRỌNG: Dịch toàn bộ nội dung câu hỏi và lời giải sang Tiếng Anh. Dịch chuẩn xác các thuật ngữ Toán học.";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
             temperature: 0.7,
          }
        })
      }
    );

    const data = await response.json();
    let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json({ error: 'Trợ lý AI không thể xử lý yêu cầu.' }, { status: 500 });
    }

    // Xóa bọc markdown codeblock nếu AI cố tình bao gồm
    if (aiText.startsWith('```latex')) {
      aiText = aiText.replace(/```latex\n/g, '').replace(/```/g, '');
    } else if (aiText.startsWith('```')) {
      aiText = aiText.replace(/```\n/g, '').replace(/```/g, '');
    }

    return NextResponse.json({ result: aiText.trim() });
  } catch (error) {
    console.error("Lỗi AI Sinh câu hỏi:", error);
    return NextResponse.json({ error: 'Hệ thống gặp sự cố kết nối.' }, { status: 500 });
  }
}
