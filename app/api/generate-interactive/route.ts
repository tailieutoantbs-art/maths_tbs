import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
Bạn là một "Kỹ sư thiết kế & Kỹ sư dữ liệu" (Interactive Learning Engineer). Nhiệm vụ của bạn là tạo ra một bài học tương tác / mini-game dưới dạng Single-file HTML/JS/CSS (sử dụng Tailwind CSS) chạy an toàn trong Sandbox Iframe.

BẠN BẮT BUỘC PHẢI TRẢ VỀ CHÍNH XÁC MỘT ĐỐI TƯỢNG JSON (KHÔNG CÓ MARKDOWN HAY BẤT KỲ VĂN BẢN NÀO BÊN NGOÀI) THEO ĐỊNH DẠNG SAU:

{
  "title": "Tên bài học/game",
  "topic": "Chủ đề toán học",
  "storyContext": "Bối cảnh thực tế (Storytelling) được sử dụng",
  "htmlContent": "<div class='p-4 bg-gray-900 text-white'>Giao diện HTML với Tailwind. KHÔNG dùng thẻ <html>, <body>, <head>. CHỈ trả về cấu trúc bên trong <body>. Bắt buộc có các ID để JS thao tác.</div>",
  "scriptContent": "Mã JavaScript thuần (Vanilla JS). KHÔNG dùng thẻ <script>. Bạn CÓ THỂ sử dụng biến window.MODULE_DATA (chứa mảng dữ liệu). Khi người chơi hoàn thành (thắng/thua), BẮT BUỘC phải gọi hàm sendComplete(score, payloadObject) để gửi điểm số về hệ thống.",
  "dataArrays": [
    // Một mảng chứa dữ liệu các câu hỏi hoặc tham số game (JSON format). Ví dụ:
    { "question": "1+1=?", "answer": 2, "hint": "Đếm ngón tay" }
  ]
}

CÁC YÊU CẦU ĐẶC BIỆT (Advanced Data Analysis & Web Search capability):
1. Tính logic tuyệt đối: Nếu có đếm ngược, combo, hoặc thuật toán chấm điểm, hãy viết JS thật chuẩn xác.
2. Thiết kế Premium: Sử dụng Tailwind CSS (dark mode ưu tiên, các class màu gradient, glassmorphism như bg-white/10 backdrop-blur, text gradient) để tạo giao diện sống động (Gamification).
3. Đóng gói gọn: Toàn bộ CSS (nếu có custom) có thể inline hoặc viết vào thuộc tính style. Tailwind là đủ.
4. Giao tiếp Iframe: Khi kết thúc game, gọi \`sendComplete(điểm_số, { chi_tiết_thêm: ... })\`. Hệ thống bên ngoài đã định nghĩa sẵn hàm này.
5. Nếu người dùng yêu cầu bối cảnh thực tế (Storytelling), hãy sử dụng số liệu thực tế, sự kiện (Web search simulation) để làm bài toán hấp dẫn hơn.
`;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình Gemini API Key' }, { status: 500 });
    }

    const fullPrompt = `
      ${SYSTEM_PROMPT}

      YÊU CẦU TỪ GIÁO VIÊN:
      "${prompt}"
    `;

    const modelsToTry = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let data: any;

    for (const model of modelsToTry) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json" // Ép mô hình trả về JSON
            }
          })
        }
      );
      data = await response.json();

      if (!data.error || (data.error.code !== 503 && !data.error.message?.includes('high demand'))) {
        break; 
      }
    }
    
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return NextResponse.json({ error: data.error.message || 'Lỗi từ Gemini API' }, { status: 500 });
    }

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json({ error: 'Trợ lý AI không thể xử lý yêu cầu.' }, { status: 500 });
    }

    return NextResponse.json({ result: aiText });
  } catch (error) {
    console.error("Lỗi AI Interactive:", error);
    return NextResponse.json({ error: 'Hệ thống gặp sự cố kết nối.' }, { status: 500 });
  }
}
