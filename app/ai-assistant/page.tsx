'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function AIAssistantPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'MCQ' | 'TF' | 'SA'>('MCQ');
  const [level, setLevel] = useState('Thông hiểu');
  
  // State mới để lưu Nguồn dữ liệu
  const [referenceSource, setReferenceSource] = useState('');
  
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  const handleGeneratePrompt = () => {
    if (!topic.trim()) {
      showToast('warning', 'Thầy vui lòng nhập chủ đề kiến thức trước nhé!');
      return;
    }

    let jsonTemplate = '';
    if (type === 'MCQ') {
      jsonTemplate = `[
  {
    "type": "MCQ",
    "question": "Nội dung câu hỏi chứa LaTeX",
    "level": "${level}",
    "options": { "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D" },
    "correctAnswer": "A",
    "source": "Trích dẫn nguồn ngắn gọn"
  }
]`;
    } else if (type === 'TF') {
      jsonTemplate = `[
  {
    "type": "TF",
    "question": "Nội dung câu hỏi gốc chứa LaTeX",
    "level": "${level}",
    "statements": [
      { "id": "a", "text": "Phát biểu a", "correct": true },
      { "id": "b", "text": "Phát biểu b", "correct": false },
      { "id": "c", "text": "Phát biểu c", "correct": true },
      { "id": "d", "text": "Phát biểu d", "correct": false }
    ],
    "source": "Trích dẫn nguồn ngắn gọn"
  }
]`;
    } else {
      jsonTemplate = `[
  {
    "type": "SA",
    "question": "Nội dung câu hỏi điền đáp số chứa LaTeX",
    "level": "${level}",
    "correctAnswer": "Giá trị số hoặc phân số",
    "source": "Trích dẫn nguồn ngắn gọn"
  }
]`;
    }

    // Tích hợp lệnh Neo dữ liệu (Grounding) cực kỳ khắt khe
    const promptText = `Bạn là một chuyên gia biên soạn đề thi môn Toán cấp trung học phổ thông.
Hãy tạo ra 1 câu hỏi toán học về chủ đề "${topic}", mức độ "${level}", định dạng "${type === 'MCQ' ? 'Trắc nghiệm 4 lựa chọn' : type === 'TF' ? 'Trắc nghiệm Đúng/Sai' : 'Trả lời ngắn / Điền số'}".

==================================================
NGUỒN DỮ LIỆU THAM CHIẾU CHUẨN (GROUNDING SOURCE):
${referenceSource.trim() ? referenceSource : 'Không có nguồn cụ thể được cung cấp. Hãy sử dụng kiến thức chuẩn của Chương trình GDPT 2018 môn Toán.'}
==================================================

YÊU CẦU BẮT BUỘC VÀ KIỂM SOÁT TÍNH ĐÚNG ĐẮN:
1. TUYỆT ĐỐI chỉ sử dụng kiến thức, số liệu, và thuật ngữ từ "NGUỒN DỮ LIỆU THAM CHIẾU CHUẨN" bên trên để thiết kế câu hỏi. KHÔNG TỰ BỊA ĐẶT KIẾN THỨC.
2. Tất cả công thức toán học PHẢI được viết bằng mã LaTeX tiêu chuẩn (Ví dụ: \\int_{0}^{1} x dx hoặc \\vec{a} = (x; y; z)). 
3. Tuyệt đối KHÔNG dùng ký hiệu $ đơn hay $$ để bọc công thức.
4. Ghi chú nguồn gốc dữ liệu vào trường "source" trong mảng JSON.
5. Chỉ trả về duy nhất một mảng JSON thuần túy theo đúng cấu trúc dưới đây, không kèm theo bất kỳ văn bản giải thích hay ký hiệu markdown \`\`\`json nào ở đầu và cuối:

${jsonTemplate}`;

    setGeneratedPrompt(promptText);
    showToast('success', 'Đã tạo Prompt khống chế nguồn thành công!');
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
        showToast('success', 'Phân tích dữ liệu JSON thành công! Mời thầy duyệt mã LaTeX.');
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
      setGeneratedQuestions([]); 
    } catch (error) {
      showToast('error', 'Lưu trữ câu hỏi thất bại.');
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                Trạm điều khiển AI (Kiểm soát Nguồn)
              </span>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 uppercase tracking-wide mt-2">
                Bộ Tạo Prompt Soạn Đề
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                Kiểm soát hoàn toàn cấu trúc JSON và ngăn chặn Hallucination
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
            
            <div className="space-y-6">
              
              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-xs font-black text-purple-700 uppercase tracking-wider border-b border-purple-100 pb-3">
                  Bước 1: Thiết lập & Neo dữ liệu
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Chủ đề / Yêu cầu chi tiết:</label>
                    <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="VD: Viết một câu hỏi trắc nghiệm về Xác suất thực nghiệm..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm font-bold shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Dạng thức:</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold shadow-inner focus:outline-none"
                    >
                      <option value="MCQ">MCQ (4 Lựa chọn)</option>
                      <option value="TF">TF (Đúng/Sai)</option>
                      <option value="SA">SA (Điền đáp số)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Mức độ:</label>
                    <select 
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold shadow-inner focus:outline-none"
                    >
                      <option value="Nhận biết">Nhận biết</option>
                      <option value="Thông hiểu">Thông hiểu</option>
                      <option value="Vận dụng">Vận dụng</option>
                      <option value="Vận dụng cao">Vận dụng cao</option>
                    </select>
                  </div>
                  
                  {/* Ô NHẬP NGUỒN DỮ LIỆU ĐỐI CHIẾU MỚI */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1.5">
                      📚 Nguồn dữ liệu chuẩn (NotebookLM, SGK):
                    </label>
                    <textarea 
                      value={referenceSource}
                      onChange={(e) => setReferenceSource(e.target.value)}
                      placeholder="Dán tóm tắt kiến thức, ví dụ từ sách giáo khoa hay NotebookLM để ép AI chỉ được ra đề trong phạm vi này..."
                      className="w-full h-24 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-medium focus:outline-none resize-none focus:ring-2 focus:ring-emerald-300 placeholder:text-emerald-400/70"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGeneratePrompt}
                  className="w-full py-3 bg-purple-100 text-purple-700 font-extrabold rounded-xl hover:bg-purple-200 transition-all text-xs uppercase tracking-wider"
                >
                  ⚡ Khởi Tạo Lệnh Prompt (Bám sát Nguồn)
                </button>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-4 transition-all">
                <div className="flex justify-between items-center border-b border-sky-100 pb-3">
                  <h3 className="text-xs font-black text-[#0284C7] uppercase tracking-wider">Bước 2: Copy Prompt</h3>
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
                  placeholder="Lệnh Prompt sẽ xuất hiện ở đây..."
                  className="w-full h-40 p-4 bg-slate-800 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none shadow-inner resize-none leading-relaxed"
                />
              </div>

            </div>

            <div className="space-y-6">
              
              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider border-b border-amber-100 pb-3">
                  Bước 3: Dán Kết Quả JSON Từ Trợ Lý (ChatGPT/Gemini)
                </h3>
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Dán đoạn mã [{"type": "MCQ", ...}] AI trả về vào đây...'
                  className="w-full h-32 p-4 bg-amber-50/50 border border-amber-100 text-slate-700 font-mono text-xs rounded-xl focus:outline-none focus:border-amber-400 shadow-inner resize-none leading-relaxed placeholder:text-slate-400"
                />
                <button
                  onClick={handleParseJSON}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#9A3412] active:translate-y-1 active:shadow-[0_0px_0_0_#9A3412] transition-all text-xs uppercase tracking-wider"
                >
                  🧩 Dịch Mã JSON & Hiển Thị
                </button>
              </div>

              {generatedQuestions.length > 0 && (
                <div className="bg-white/90 backdrop-blur-xl border-2 border-emerald-100 p-6 rounded-3xl shadow-2xl animate-fadeIn space-y-4">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider border-b border-emerald-100 pb-3">
                    Bước 4: Duyệt Đề & Lưu Trữ
                  </h3>
                  
                  {generatedQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-4">
                      
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-inner overflow-x-auto text-center font-medium text-slate-800 text-sm">
                        <BlockMath math={q.question || '\\text{Lỗi cấu trúc}'} />
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
                        
                        {/* Hiển thị Nguồn đối chiếu mà AI đã tuân thủ */}
                        {q.source && (
                          <p className="text-emerald-700 italic border-t border-slate-200 mt-2 pt-2 text-[10px]">
                            📌 Nguồn đối chiếu: {q.source}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleSaveToBank(q)}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-[0_0px_0_0_#047857] transition-all flex justify-center items-center gap-2"
                      >
                        ✔ Phê Duyệt Nạp Vào Ngân Hàng
                      </button>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}