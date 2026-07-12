import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { topic, type, level, count } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình Gemini API Key trong file .env' }, { status: 500 });
    }

    // Thiết lập hệ thống Prompt chuyên sâu buộc AI sinh cấu trúc chuẩn sư phạm
    const systemInstruction = ` Bạn là một chuyên gia biên soạn đề thi môn Toán cấp trung học phổ thông.
    Nhiệm vụ của bạn là tạo ra ${count || 1} câu hỏi toán học về chủ đề "${topic}", mức độ "${level}", định dạng câu hỏi là "${type}".
    
    YÊU CẦU BẮT BUỘC:
    1. Tất cả công thức toán học PHẢI được viết bằng mã LaTeX và được bọc trong ký hiệu block math đơn giản để hệ thống KaTeX hiển thị được (Ví dụ: \\\\int_{0}^{1} x dx hoặc \\\\vec{a} = (x; y; z)). Không dùng dấu $ đơn lẻ.
    2. Nội dung câu hỏi phải chính xác về kiến thức toán học phổ thông.
    3. Định dạng câu trả lời bắt buộc phải là cấu trúc mảng JSON thuần túy (Array), không kèm theo ký hiệu markdown \`\`\`json ở đầu và cuối.

    CẤU TRÚC JSON CHO TỪNG DẠNG CÂU HỎI:
    - Nếu type = "MCQ": { "type": "MCQ", "question": "Nội dung câu hỏi chứa LaTeX", "level": "${level}", "options": { "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D" }, "correctAnswer": "A" }
    - Nếu type = "TF": { "type": "TF", "question": "Nội dung câu hỏi lớn chứa LaTeX", "level": "${level}", "statements": [ { "id": "a", "text": "Nội dung phát biểu a", "correct": true }, { "id": "b", "text": "Nội dung phát biểu b", "correct": false }, { "id": "c", "text": "Nội dung phát biểu c", "correct": true }, { "id": "d", "text": "Nội dung phát biểu d", "correct": false } ] }
    - Nếu type = "SA": { "type": "SA", "question": "Nội dung câu hỏi điền đáp số", "level": "${level}", "correctAnswer": "Giá trị số hoặc phân số" }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction }] }],
          generationConfig: {
            responseMimeType: 'application/json' // Ép Gemini trả về định dạng JSON thuần
          }
        })
      }
    );

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json({ error: 'AI không thể khởi tạo nội dung phù hợp.' }, { status: 500 });
    }

    const parsedQuestions = JSON.parse(aiText.trim());
    return NextResponse.json({ questions: Array.isArray(parsedQuestions) ? parsedQuestions : [parsedQuestions] });

  } catch (error) {
    console.error("Lỗi biên soạn AI:", error);
    return NextResponse.json({ error: 'Quá trình biên soạn câu hỏi gặp trục trặc.' }, { status: 500 });
  }
}