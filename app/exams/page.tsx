'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function ExamsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [topic, setTopic] = useState('');
  
  // Cấu hình Ma trận đề thi (Số lượng và Mức độ cho từng dạng)
  const [examConfig, setExamConfig] = useState({
    MCQ: { count: 0, level: 'Thông hiểu' },
    TF: { count: 0, level: 'Thông hiểu' },
    SA: { count: 0, level: 'Vận dụng' },
    LA: { count: 0, level: 'Vận dụng cao' }
  });
  
  const [referenceSource, setReferenceSource] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Hàm cập nhật cấu hình ma trận
  const updateConfig = (type: 'MCQ' | 'TF' | 'SA' | 'LA', field: 'count' | 'level', value: any) => {
    setExamConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: field === 'count' ? Number(value) : value }
    }));
  };

  const handleGeneratePrompt = () => {
    if (!topic.trim()) {
      showToast('warning', 'Thầy vui lòng nhập chủ đề / yêu cầu chi tiết trước nhé!');
      return;
    }

    const totalQuestions = examConfig.MCQ.count + examConfig.TF.count + examConfig.SA.count + examConfig.LA.count;
    if (totalQuestions === 0) {
      showToast('warning', 'Thầy vui lòng nhập số lượng cho ít nhất 1 dạng câu hỏi!');
      return;
    }

    // Xây dựng danh sách yêu cầu và mẫu JSON động dựa trên cấu hình
    let requestedTypes = [];
    let jsonTemplateExamples = [];

    if (examConfig.MCQ.count > 0) {
      requestedTypes.push(`- ${examConfig.MCQ.count} câu Trắc nghiệm 4 lựa chọn (MCQ) - Mức độ: ${examConfig.MCQ.level}`);
      jsonTemplateExamples.push(`  {
    "type": "MCQ",
    "question": "Nội dung câu hỏi chứa LaTeX",
    "level": "${examConfig.MCQ.level}",
    "options": { "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D" },
    "correctAnswer": "A",
    "source": "Trích dẫn nguồn"
  }`);
    }

    if (examConfig.TF.count > 0) {
      requestedTypes.push(`- ${examConfig.TF.count} câu Trắc nghiệm Đúng/Sai (TF) - Mức độ: ${examConfig.TF.level}`);
      jsonTemplateExamples.push(`  {
    "type": "TF",
    "question": "Nội dung câu hỏi gốc chứa LaTeX",
    "level": "${examConfig.TF.level}",
    "statements": [
      { "id": "a", "text": "Phát biểu a", "correct": true },
      { "id": "b", "text": "Phát biểu b", "correct": false },
      { "id": "c", "text": "Phát biểu c", "correct": true },
      { "id": "d", "text": "Phát biểu d", "correct": false }
    ],
    "source": "Trích dẫn nguồn"
  }`);
    }

    if (examConfig.SA.count > 0) {
      requestedTypes.push(`- ${examConfig.SA.count} câu Trả lời ngắn / Điền số (SA) - Mức độ: ${examConfig.SA.level}`);
      jsonTemplateExamples.push(`  {
    "type": "SA",
    "question": "Nội dung câu hỏi điền đáp số chứa LaTeX",
    "level": "${examConfig.SA.level}",
    "correctAnswer": "Giá trị số hoặc phân số",
    "source": "Trích dẫn nguồn"
  }`);
    }

    if (examConfig.LA.count > 0) {
      requestedTypes.push(`- ${examConfig.LA.count} câu Tự luận (LA) - Mức độ: ${examConfig.LA.level}`);
      jsonTemplateExamples.push(`  {
    "type": "LA",
    "question": "Nội dung câu hỏi tự luận chứa LaTeX",
    "level": "${examConfig.LA.level}",
    "correctAnswer": "Lời giải chi tiết từng bước (có chứa LaTeX)",
    "source": "Trích dẫn nguồn"
  }`);
    }

    const promptText = `Bạn là một chuyên gia biên soạn đề thi môn Toán cấp trung học phổ thông.
Hãy tạo ra một bộ đề thi (gồm ${totalQuestions} câu) về chủ đề "${topic}".

CẤU TRÚC MA TRẬN YÊU CẦU:
${requestedTypes.join('\n')}

==================================================
NGUỒN DỮ LIỆU THAM CHIẾU CHUẨN (GROUNDING SOURCE):
${referenceSource.trim() ? referenceSource : 'Không có nguồn cụ thể được cung cấp. Hãy sử dụng kiến thức chuẩn của Chương trình GDPT 2018 môn Toán.'}
==================================================

YÊU CẦU BẮT BUỘC VÀ KIỂM SOÁT TÍNH ĐÚNG ĐẮN:
1. TUYỆT ĐỐI chỉ sử dụng kiến thức, số liệu, và thuật ngữ từ "NGUỒN DỮ LIỆU THAM CHIẾU CHUẨN" bên trên để thiết kế câu hỏi. KHÔNG TỰ BỊA ĐẶT KIẾN THỨC.
2. Tất cả công thức toán học PHẢI được viết bằng mã LaTeX tiêu chuẩn (Ví dụ: \\int_{0}^{1} x dx hoặc \\vec{a} = (x; y; z)). 
3. Tuyệt đối KHÔNG dùng ký hiệu $ đơn hay $$ để bọc công thức.
4. Chỉ trả về duy nhất một mảng JSON thuần túy (Array of Objects) chứa toàn bộ các câu hỏi trên, không kèm theo văn bản giải thích hay ký hiệu markdown \`\`\`json. 

MẪU CẤU TRÚC JSON YÊU CẦU:
[
${jsonTemplateExamples.join(',\n')}
]`;

    setGeneratedPrompt(promptText);
    showToast('success', 'Đã tạo Prompt Ma trận đề thi thành công!');
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    showToast('info', 'Đã sao chép Prompt vào khay nhớ tạm!');
  };

  const handleParseJSON = () => {
    if (!jsonInput.trim()) {
      showToast('warning', 'Thầy chưa dán kết quả JSON từ AI trả về!');
      return;
    }

    try {
      const cleanedInput = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedInput);
      
      if (Array.isArray(parsedData)) {
        setGeneratedQuestions(parsedData);
        showToast('success', `Phân tích thành công ${parsedData.length} câu hỏi! Mời thầy duyệt đề.`);
      } else {
        setGeneratedQuestions([parsedData]);
        showToast('success', 'Phân tích dữ liệu JSON thành công!');
      }
      setJsonInput(''); 
    } catch (error) {
      showToast('error', 'Lỗi cú pháp JSON. Thầy kiểm tra lại dữ liệu copy từ AI nhé!');
      console.error(error);
    }
  };

  const handleSaveToBank = async (q: any) => {
    try {
      await addDoc(collection(db, 'cauhoi_nganhang'), {
        ...q,
        createdAt: serverTimestamp()
      });
      showToast('success', 'Đã lưu câu hỏi vào ngân hàng đề thi TBS!');
      // Loại bỏ câu hỏi đã lưu khỏi danh sách duyệt
      setGeneratedQuestions(prev => prev.filter(item => item !== q));
    } catch (error) {
      showToast('error', 'Lưu trữ câu hỏi thất bại.');
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* THANH TIÊU ĐỀ */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                QUẢN LÝ CHUYÊN MÔN & NGÂN HÀNG ĐỀ THI
              </span>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 uppercase tracking-wide mt-2">
                Bộ Tạo Prompt Ma Trận Đề
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                Thiết lập đồng thời nhiều dạng thức: MCQ, Đúng/Sai, Trả lời ngắn, Tự luận
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase shadow-sm"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CỘT TRÁI: THIẾT LẬP CẤU HÌNH & XUẤT PROMPT */}
            <div className="space-y-6">
              
              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-5">
                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider border-b border-emerald-100 pb-3">
                  Bước 1: Thiết lập Cấu trúc Ma trận & Neo dữ liệu
                </h3>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Chủ đề / Yêu cầu chi tiết:</label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="VD: Viết bộ đề kiểm tra 15 phút về Xác suất thực nghiệm..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm font-bold shadow-inner"
                  />
                </div>

                {/* BẢNG CẤU HÌNH CÁC DẠNG CÂU HỎI */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Cấu hình dạng thức đề thi:</label>
                  
                  {/* Row MCQ */}
                  <div className="flex items-center gap-3">
                    <span className="w-16 font-bold text-xs text-slate-700">MCQ:</span>
                    <input type="number" min="0" value={examConfig.MCQ.count} onChange={(e) => updateConfig('MCQ', 'count', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-300 text-sm text-center focus:ring-1 focus:ring-emerald-400" placeholder="Số lượng" />
                    <select value={examConfig.MCQ.level} onChange={(e) => updateConfig('MCQ', 'level', e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-400">
                      <option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option><option>Vận dụng cao</option>
                    </select>
                  </div>
                  
                  {/* Row TF */}
                  <div className="flex items-center gap-3">
                    <span className="w-16 font-bold text-xs text-slate-700">Đúng/Sai:</span>
                    <input type="number" min="0" value={examConfig.TF.count} onChange={(e) => updateConfig('TF', 'count', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-300 text-sm text-center focus:ring-1 focus:ring-emerald-400" />
                    <select value={examConfig.TF.level} onChange={(e) => updateConfig('TF', 'level', e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-400">
                      <option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option><option>Vận dụng cao</option>
                    </select>
                  </div>

                  {/* Row SA */}
                  <div className="flex items-center gap-3">
                    <span className="w-16 font-bold text-xs text-slate-700">Trả lời ngắn:</span>
                    <input type="number" min="0" value={examConfig.SA.count} onChange={(e) => updateConfig('SA', 'count', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-300 text-sm text-center focus:ring-1 focus:ring-emerald-400" />
                    <select value={examConfig.SA.level} onChange={(e) => updateConfig('SA', 'level', e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-400">
                      <option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option><option>Vận dụng cao</option>
                    </select>
                  </div>

                  {/* Row LA */}
                  <div className="flex items-center gap-3">
                    <span className="w-16 font-bold text-xs text-slate-700">Tự luận:</span>
                    <input type="number" min="0" value={examConfig.LA.count} onChange={(e) => updateConfig('LA', 'count', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-300 text-sm text-center focus:ring-1 focus:ring-emerald-400" />
                    <select value={examConfig.LA.level} onChange={(e) => updateConfig('LA', 'level', e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-400">
                      <option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option><option>Vận dụng cao</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1.5">
                    📚 Nguồn dữ liệu chuẩn (NotebookLM, SGK):
                  </label>
                  <textarea 
                    value={referenceSource}
                    onChange={(e) => setReferenceSource(e.target.value)}
                    placeholder="Dán tóm tắt kiến thức từ sách giáo khoa hoặc dữ liệu chuẩn để khống chế phạm vi đề thi..."
                    className="w-full h-24 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-medium focus:outline-none resize-none focus:ring-2 focus:ring-emerald-300 placeholder:text-emerald-400/70"
                  />
                </div>

                <button
                  onClick={handleGeneratePrompt}
                  className="w-full py-3 bg-emerald-100 text-emerald-700 font-extrabold rounded-xl hover:bg-emerald-200 transition-all text-xs uppercase tracking-wider shadow-sm"
                >
                  ⚡ Khởi Tạo Lệnh Prompt Đa Dạng
                </button>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-4 transition-all">
                <div className="flex justify-between items-center border-b border-sky-100 pb-3">
                  <h3 className="text-xs font-black text-sky-700 uppercase tracking-wider">Bước 2: Copy Prompt</h3>
                  <button 
                    onClick={handleCopyPrompt}
                    disabled={!generatedPrompt}
                    className="px-4 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md disabled:opacity-50 active:scale-95 transition-all"
                  >
                    📋 Copy Prompt
                  </button>
                </div>
                <textarea 
                  readOnly
                  value={generatedPrompt}
                  placeholder="Lệnh Prompt chứa cấu trúc Ma trận JSON sẽ xuất hiện ở đây..."
                  className="w-full h-40 p-4 bg-slate-800 text-emerald-400 font-mono text-[11px] rounded-xl focus:outline-none shadow-inner resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* CỘT PHẢI: DÁN KẾT QUẢ & HIỂN THỊ DUYỆT ĐỀ */}
            <div className="space-y-6">
              
              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider border-b border-amber-100 pb-3">
                  Bước 3: Dán Kết Quả JSON Từ Trợ Lý (ChatGPT/Gemini)
                </h3>
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Dán mảng JSON [{"type": "MCQ", ...}, {"type": "LA", ...}] AI trả về vào đây...'
                  className="w-full h-32 p-4 bg-amber-50/50 border border-amber-100 text-slate-700 font-mono text-[11px] rounded-xl focus:outline-none focus:border-amber-400 shadow-inner resize-none leading-relaxed placeholder:text-slate-400"
                />
                <button
                  onClick={handleParseJSON}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#9A3412] active:translate-y-1 active:shadow-[0_0px_0_0_#9A3412] transition-all text-xs uppercase tracking-wider"
                >
                  🧩 Dịch Mã JSON & Hiển Thị Đề
                </button>
              </div>

              {/* KHU VỰC DUYỆT ĐỀ VÀ LƯU VÀO FIREBASE */}
              {generatedQuestions.length > 0 && (
                <div className="bg-white/90 backdrop-blur-xl border-2 border-emerald-100 p-6 rounded-3xl shadow-2xl animate-fadeIn space-y-4">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider border-b border-emerald-100 pb-3 flex justify-between">
                    <span>Bước 4: Duyệt Đề & Lưu Trữ</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{generatedQuestions.length} câu</span>
                  </h3>
                  
                  <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
                    {generatedQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-4 border-b border-slate-200 pb-6 last:border-0">
                        
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded">
                            Dạng: {q.type} | {q.level}
                          </span>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-inner overflow-x-auto font-medium text-slate-800 text-sm">
                          {/* Dùng BlockMath nếu AI sinh chuẩn LaTeX, hoặc có thể dùng text thông thường tùy dữ liệu */}
                          <BlockMath math={q.question || '\\text{Lỗi hiển thị LaTeX}'} />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs font-semibold">
                          {q.type === 'MCQ' && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                              {Object.entries(q.options).map(([key, value]: any) => (
                                <p key={key} className={q.correctAnswer === key ? 'text-emerald-600 font-black' : ''}>
                                  <span className="font-black mr-1">{key}.</span> {value}
                                </p>
                              ))}
                            </div>
                          )}

                          {q.type === 'TF' && q.statements && (
                            <div className="space-y-1.5 text-slate-600">
                              {q.statements.map((st: any, i: number) => (
                                <p key={i}>
                                  <span className="font-black text-purple-600 uppercase mr-1">Ý {st.id}):</span> {st.text} ➔ 
                                  <span className={`ml-1 font-black ${st.correct ? 'text-emerald-600' : 'text-rose-500'}`}>{st.correct ? 'ĐÚNG' : 'SAI'}</span>
                                </p>
                              ))}
                            </div>
                          )}

                          {q.type === 'SA' && (
                            <p className="text-slate-600">
                              🔑 Đáp số: <span className="text-amber-600 font-mono font-black text-sm bg-white px-2 py-0.5 rounded border ml-1">{q.correctAnswer}</span>
                            </p>
                          )}

                          {/* Xử lý hiển thị riêng cho câu Tự Luận (LA) */}
                          {q.type === 'LA' && (
                            <div className="text-slate-600">
                              <p className="font-black text-indigo-600 mb-2">🔑 Lời giải chi tiết:</p>
                              <div className="p-3 bg-white border border-slate-200 rounded whitespace-pre-wrap font-normal leading-relaxed">
                                {q.correctAnswer}
                              </div>
                            </div>
                          )}
                          
                          {q.source && (
                            <p className="text-emerald-700 italic border-t border-slate-200 mt-3 pt-2 text-[10px]">
                              📌 Nguồn tham chiếu chuẩn: {q.source}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleSaveToBank(q)}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm hover:scale-[1.01] transition-all flex justify-center items-center gap-2"
                        >
                          ✔ Nạp Câu Hỏi Này Vào Ngân Hàng Đề
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}