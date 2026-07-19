import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
Bạn là một chuyên gia toán học và chuyên gia gõ LaTeX chuyên nghiệp. Nhiệm vụ của bạn là đọc nội dung file PDF đính kèm (chứa đề thi, bài tập toán) và bóc tách toàn bộ các bài toán để chuẩn hoá thành mã LaTeX.

HƯỚNG DẪN ĐỊNH DẠNG BẮT BUỘC (QUAN TRỌNG):
1. Mỗi câu hỏi / bài toán phải được bọc trong môi trường \\begin{question} ... \\end{question}.
2. Nếu câu hỏi là trắc nghiệm, các phương án A, B, C, D phải được trình bày rõ ràng (dùng môi trường danh sách nếu cần).
3. TẤT CẢ các công thức toán học, biến số, và biểu thức đều PHẢI nằm trong môi trường toán học chuẩn của LaTeX. 
   - Công thức hiển thị trên dòng (inline): dùng dấu $ ... $
   - Công thức hiển thị tách khối (display): dùng dấu $$ ... $$ hoặc \\[ ... \\]
4. Tuyệt đối không sử dụng các ký tự UTF-8 toán học đặc biệt (như √, ∫, α, ≠) trực tiếp dưới dạng văn bản thường; BẮT BUỘC phải dùng mã lệnh LaTeX tương ứng (ví dụ: \\sqrt{}, \\int, \\alpha, \\neq).
5. Về HÌNH VẼ HÌNH HỌC (nếu có trong PDF):
   - Hãy cố gắng chuyển đổi hình vẽ đó thành mã TikZ chuẩn xác và chèn vào bên dưới câu hỏi.
   - Nếu hình quá phức tạp không thể dùng TikZ, hãy chèn một thẻ giữ chỗ: [CHÈN HÌNH VẼ VÀO ĐÂY] kèm theo mô tả ngắn gọn về hình.
6. LỜI GIẢI (Tuỳ chọn - được truyền qua cấu hình):
   - Nếu hệ thống yêu cầu "Tự động bổ sung lời giải", hãy tự động giải chi tiết và chính xác từng bài toán, sau đó bọc toàn bộ phần giải thích vào môi trường \\begin{solution} ... \\end{solution}.
   - Nếu hệ thống KHÔNG yêu cầu bổ sung lời giải, BỎ QUA bước giải toán.
`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình Gemini API Key' }, { status: 500 });
    }

    // Lấy dữ liệu từ FormData
    const formData = await request.formData();
    const pdfFile = formData.get('file') as File;
    const addSolutions = formData.get('addSolutions') === 'true';
    const locale = formData.get('locale') || 'vi';

    if (!pdfFile || pdfFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File tải lên không hợp lệ. Chỉ chấp nhận tệp PDF.' }, { status: 400 });
    }

    // Chuyển đổi File sang Base64
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Thiết lập lệnh ép AI
    let finalPrompt = SYSTEM_PROMPT;
    if (addSolutions) {
      finalPrompt += "\n\nYÊU CẦU ĐẶC BIỆT: Giáo viên ĐÃ BẬT tính năng bổ sung lời giải. Bạn BẮT BUỘC phải tự động viết lời giải chi tiết cho tất cả các câu hỏi được trích xuất và bọc trong \\begin{solution} ... \\end{solution}.";
    } else {
      finalPrompt += "\n\nYÊU CẦU ĐẶC BIỆT: Giáo viên KHÔNG YÊU CẦU giải bài. Tuyệt đối KHÔNG sinh ra lời giải, chỉ trích xuất đề bài.";
    }

    const languageInstruction = locale === 'en'
      ? "TUYỆT ĐỐI dịch và trình bày lại toàn bộ nội dung đề thi, bài tập và lời giải sang TIẾNG ANH (ENGLISH)."
      : "VUI LÒNG giữ nguyên hoặc trình bày toàn bộ nội dung bằng TIẾNG VIỆT (VIETNAMESE).";
    finalPrompt += `\n\nYÊU CẦU NGÔN NGỮ: ${languageInstruction}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    let data: any;

    for (const model of modelsToTry) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: finalPrompt },
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          })
        }
      );
      data = await response.json();

      const isRateLimit = data.error?.code === 429 || data.error?.message?.toLowerCase().includes('quota') || data.error?.message?.toLowerCase().includes('exceeded');
      if (!data.error || (data.error.code !== 503 && !data.error.message?.includes('high demand') && !isRateLimit)) {
        break;
      }
      console.warn(`Model ${model} is overloaded, trying fallback...`);
    }
    
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return NextResponse.json({ error: data.error.message || 'Lỗi từ Gemini API' }, { status: 500 });
    }

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json({ error: 'Trợ lý AI không thể xử lý hoặc tệp PDF không chứa văn bản hợp lệ.' }, { status: 500 });
    }

    return NextResponse.json({ result: aiText });
  } catch (error: any) {
    console.error("Lỗi trích xuất PDF:", error);
    return NextResponse.json({ error: 'Hệ thống gặp sự cố kết nối hoặc xử lý file.' }, { status: 500 });
  }
}
