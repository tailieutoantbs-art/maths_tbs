import { NextResponse } from 'next/server';
import { APPENDIX_PROMPTS, SYSTEM_PROMPT } from '@/lib/prompts-appendix';

export async function POST(request: Request) {
  try {
    const { planType, inputData, referenceSource } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình Gemini API Key' }, { status: 500 });
    }

    const selectedPrompt = APPENDIX_PROMPTS[planType as keyof typeof APPENDIX_PROMPTS];
    if (!selectedPrompt) {
      return NextResponse.json({ error: 'Loại kế hoạch không hợp lệ' }, { status: 400 });
    }

    // Thiết lập lệnh ép AI phải bám sát Nguồn dữ liệu (Grounding)
    const fullPrompt = `
    ${SYSTEM_PROMPT}
    
    YÊU CẦU VÀ CẤU TRÚC ĐỊNH DẠNG BẮT BUỘC:
    ${selectedPrompt}

    ==================================================
    NGUỒN DỮ LIỆU THAM CHIẾU CHUẨN (GROUNDING SOURCE):
    ${referenceSource ? referenceSource : 'Không có nguồn cụ thể được cung cấp. Hãy sử dụng kiến thức chuẩn của Chương trình GDPT 2018.'}
    ==================================================
    
    DỮ LIỆU ĐẦU VÀO TỪ GIÁO VIÊN (Yêu cầu bài toán, lớp, đặc thù...):
    ${inputData}

    LỆNH KIỂM SOÁT TÍNH ĐÚNG ĐẮN (QUAN TRỌNG):
    1. TUYỆT ĐỐI chỉ sử dụng kiến thức, thuật ngữ, và định hướng từ "NGUỒN DỮ LIỆU THAM CHIẾU CHUẨN" bên trên để biên soạn nội dung. KHÔNG ĐƯỢC TỰ BỊA ĐẶT HOẶC LẤY KIẾN THỨC NGOÀI LỀ.
    2. Bắt buộc thêm một dòng ở cuối cùng của văn bản xuất ra: "📌 Nguồn dữ liệu đối chiếu: [Ghi tóm tắt tên Nguồn tham chiếu hoặc 'NotebookLM' / 'SGK' dựa trên dữ liệu người dùng nhập]".
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        })
      }
    );

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json({ error: 'Trợ lý AI không thể xử lý yêu cầu.' }, { status: 500 });
    }

    return NextResponse.json({ result: aiText });
  } catch (error) {
    console.error("Lỗi AI Kế hoạch:", error);
    return NextResponse.json({ error: 'Hệ thống gặp sự cố kết nối.' }, { status: 500 });
  }
}