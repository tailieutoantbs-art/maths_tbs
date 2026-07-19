import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Allow longer execution time for AI processing
export const runtime = 'edge'; // Sử dụng Edge Runtime để tránh bị Vercel ngắt kết nối (504 Timeout)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const textInput = formData.get('textInput') as string;
    const file = formData.get('file') as File;
    const locale = formData.get('locale') as string || 'vi';

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    let filePart = null;

    if (file) {
      const buffer = await file.arrayBuffer();
      // Chuyển đổi an toàn cho Edge Runtime (không dùng Buffer)
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);
      
      filePart = {
        inlineData: {
          mimeType: file.type || "application/pdf",
          data: base64Data
        }
      };
    }

    const languageInstruction = locale === 'en' 
      ? 'TUYỆT ĐỐI BẮT BUỘC: Bạn phải xuất ra toàn bộ nội dung (bao gồm cả phân tích sư phạm, lý thuyết, đề bài, lời giải) bằng TIẾNG ANH (ENGLISH). Dịch chính xác thuật ngữ Toán học sang tiếng Anh.' 
      : 'VUI LÒNG giữ nguyên hoặc trình bày toàn bộ nội dung bằng TIẾNG VIỆT (VIETNAMESE).';

const systemInstruction = `Bạn là một CHUYÊN GIA SƯ PHẠM TOÁN HỌC siêu việt. Nhiệm vụ của bạn là nhận nội dung hoặc tài liệu của người dùng, phân tích và biến nó thành một BÀI GIẢNG TRỰC QUAN ĐỈNH CAO.

YÊU CẦU ĐỊNH DẠNG (VÔ CÙNG QUAN TRỌNG):
- XUẤT TRỰC TIẾP VÀO NỘI DUNG CHÍNH. TUYỆT ĐỐI KHÔNG DÙNG CÂU CHÀO HỎI, KHÔNG DÙNG CÂU DẪN.
- KHÔNG CÓ BẤT KỲ VĂN XUÔI GIAO TIẾP NÀO. CHỈ XUẤT RA MÃ MARKDOWN CỦA BÀI GIẢNG.
- Xuất ra chuẩn Markdown (sử dụng dấu $ và $$ cho công thức Toán học LaTeX). Không được thiếu khoảng trắng sau dấu #.
- Đặc biệt quan trọng: Tất cả các Lời giải, Hướng dẫn giải chi tiết cho bài tập PHẢI được bọc trong thẻ HTML <details><summary>Lời giải / Đáp án</summary>...nội dung lời giải...</details>.
- ĐỐI VỚI HÌNH VẼ MINH HỌA, ĐỒ THỊ, HÌNH HỌC KHÔNG GIAN: TUYỆT ĐỐI KHÔNG SỬ DỤNG TIKZ. BẮT BUỘC sử dụng mã SVG HTML thuần túy. Đặc biệt quan trọng: BẠN PHẢI BỌC MÃ SVG TRONG KHỐI CODE MARKDOWN (\`\`\`svg ... \`\`\`) để hệ thống có thể render được. Hãy tự lập trình SVG vẽ các khối hình, đổ màu Gradient hoặc màu pastel phong cách hiện đại, sinh động. Đảm bảo SVG scale tốt, code chính xác, font chữ trên hình dễ nhìn.
- TUYỆT ĐỐI KHÔNG bịa đặt (hallucinate) các đường link hình ảnh. Dùng đồ họa SVG thay thế.
- VẤN ĐỀ CHÍNH TẢ: TUYỆT ĐỐI KHÔNG thêm khoảng trắng thừa vào giữa các từ tiếng Việt có dấu (ví dụ SAI: "đế n", "mố i", "đố i", "môi i". ví dụ ĐÚNG: "đến", "mối", "đối"). Bạn phải viết chuẩn chính tả tiếng Việt liền mạch.

CẤU TRÚC BÀI GIẢNG ĐỀ XUẤT (TÙY NỘI DUNG):
1. Hoạt động khởi động / Kiến thức cốt lõi (Ngắn gọn, dễ hiểu kèm 1 hình ảnh minh họa SVG sinh động).
2. Hệ thống bài tập phân hóa có kèm Lời giải bọc trong <details>.
3. Tổng kết nhanh.

${languageInstruction}
`;

    const userPrompt = textInput 
      ? `Nội dung/Yêu cầu từ giáo viên: ${textInput}`
      : `Dưới đây là tài liệu (PDF/Ảnh) đính kèm. Vui lòng phân tích và thiết kế bài giảng theo cấu trúc yêu cầu.`;

    const contentsParts = [{ text: systemInstruction + '\n\n' + userPrompt }] as any[];
    
    if (filePart) {
      contentsParts.push(filePart);
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
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
      console.warn(`Model ${model} is overloaded in Editor AI, trying fallback...`);
    }

    if (data.error) {
      console.error("Editor AI API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({ error: 'Không nhận được phản hồi từ AI' }, { status: 500 });
    }

    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error("Editor AI Error:", error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}