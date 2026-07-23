import { NextResponse } from 'next/server';

const EXAM_2025_PROMPT = `
Bạn là một chuyên gia toán học và giáo viên THPT. Hãy sinh ra một bộ đề thi môn Toán theo ĐÚNG cấu trúc năm 2025 dựa trên Dữ liệu đính kèm (File PDF/Ảnh) hoặc Yêu cầu/Chủ đề sau.
Đọc kỹ tài liệu đính kèm nếu có để lấy ngữ liệu hoặc chuyển đổi thành câu hỏi theo yêu cầu.

NỘI DUNG YÊU CẦU BỔ SUNG: [TOPIC]

CẤU TRÚC SỐ LƯỢNG VÀ MỨC ĐỘ YÊU CẦU:
[REQ_STR]

QUY TẮC ĐỊNH DẠNG DỮ LIỆU BẮT BUỘC:
1. TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON MẢNG CÁC CÂU HỎI (Không kèm markdown, không giải thích gì bên ngoài JSON).
2. TẤT CẢ công thức Toán học phải chuẩn LaTeX và được bọc trong dấu $...$ hoặc $$...$$. 
3. CHÚ Ý QUAN TRỌNG: Vì trả về chuỗi JSON, BẮT BUỘC NHÂN ĐÔI DẤU GẠCH CHÉO NGƯỢC (ví dụ: \\\\frac, \\\\log, \\\\sqrt, \\\\mathbb{R}) để JSON.parse không bị lỗi.
4. Phần "explanation" (Lời giải chi tiết): Trình bày khoa học, ngắt ý rõ ràng bằng \\n\\n.
5. Nếu trong file ảnh/pdf có hình vẽ đồ thị, hãy thêm "imageUrl": "" (hoặc để rỗng nếu không thể trích xuất ảnh), nhưng cố gắng mô tả bài toán rõ ràng bằng lời.

CHUẨN ĐẦU RA JSON (Array of objects):
[
  {
    "id": "tạo_id_ngẫu_nhiên",
    "type": "MCQ",
    "content": "Nội dung câu hỏi trắc nghiệm...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "0", // index của đáp án đúng (0, 1, 2, 3)
    "explanation": "Lời giải chi tiết..."
  },
  {
    "id": "tạo_id_ngẫu_nhiên",
    "type": "TF",
    "content": "Nội dung/Ngữ cảnh chung của câu hỏi Đúng/Sai...",
    "statements": [
      { "id": "a", "text": "Ý a...", "isTrue": true },
      { "id": "b", "text": "Ý b...", "isTrue": false },
      { "id": "c", "text": "Ý c...", "isTrue": true },
      { "id": "d", "text": "Ý d...", "isTrue": false }
    ],
    "explanation": "Lời giải chi tiết cho 4 ý..."
  },
  {
    "id": "tạo_id_ngẫu_nhiên",
    "type": "SA",
    "content": "Nội dung câu hỏi trả lời ngắn...",
    "correctAnswer": "Đáp án",
    "explanation": "Lời giải chi tiết..."
  }
]
`;

export async function POST(request: Request) {
  try {
    const { topic, aiStructure, fileData, mimeType } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình Gemini API Key' }, { status: 500 });
    }

    let reqStr = "\n\n- Không có yêu cầu cấu trúc cụ thể, vui lòng bóc tách và giữ nguyên hoặc chuyển đổi toàn bộ tài liệu nguồn thành định dạng JSON được yêu cầu.";
    
    if (aiStructure && aiStructure.length > 0) {
      let reqR1 = aiStructure.filter((x: any) => x.round === 'round1').map((x: any) => `- ${x.count} câu mức độ ${x.level}`).join('\n');
      let reqR2 = aiStructure.filter((x: any) => x.round === 'round2').map((x: any) => `- ${x.count} câu mức độ ${x.level}`).join('\n');
      let reqR3 = aiStructure.filter((x: any) => x.round === 'round3').map((x: any) => `- ${x.count} câu mức độ ${x.level}`).join('\n');

      reqStr = "";
      if(reqR1) reqStr += "\n\nPHẦN I (Trắc nghiệm 4 lựa chọn):\n" + reqR1;
      if(reqR2) reqStr += "\n\nPHẦN II (Trắc nghiệm Đúng/Sai):\n" + reqR2;
      if(reqR3) reqStr += "\n\nPHẦN III (Trả lời ngắn):\n" + reqR3;
    }

    let fullPrompt = EXAM_2025_PROMPT
      .replace('[TOPIC]', topic || 'Không có chỉ dẫn thêm.')
      .replace('[REQ_STR]', reqStr);

    const parts: any[] = [{ text: fullPrompt }];
    
    if (fileData && mimeType) {
      // fileData is expected to be a base64 string WITHOUT the data:image/png;base64, prefix
      parts.unshift({
        inlineData: {
          mimeType: mimeType,
          data: fileData
        }
      });
    }

    let aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: {
             temperature: 0.1,
          }
        })
      }
    );

    let data = await aiResponse.json();
    
    if (!aiResponse.ok && data.error?.message?.includes("high demand")) {
      console.log("Gemini 2.5 is overloaded, falling back to Gemini 2.0 Flash...");
      aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: {
               temperature: 0.1,
            }
          })
        }
      );
      data = await aiResponse.json();
    }

    if (!aiResponse.ok) {
      console.error("Google API Error:", data);
      return NextResponse.json({ error: data.error?.message || 'Lỗi từ Google API' }, { status: 500 });
    }

    let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return NextResponse.json({ error: 'Trợ lý AI không trả về dữ liệu hợp lệ.' }, { status: 500 });
    }

    if (aiText.startsWith('```json')) {
      aiText = aiText.replace(/```json\n/g, '').replace(/```/g, '');
    } else if (aiText.startsWith('```')) {
      aiText = aiText.replace(/```\n/g, '').replace(/```/g, '');
    }

    const parsedJson = JSON.parse(aiText.trim());

    return NextResponse.json({ result: parsedJson });
  } catch (error) {
    console.error("Lỗi AI Sinh câu hỏi:", error);
    return NextResponse.json({ error: 'Hệ thống gặp sự cố kết nối hoặc AI trả về sai định dạng.' }, { status: 500 });
  }
}
