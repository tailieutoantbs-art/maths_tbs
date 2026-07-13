'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function ExamsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // --- TRẠNG THÁI ĐIỀU HƯỚNG TAB ---
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  // =========================================================================
  // ==================== TAB 1: LOGIC BIÊN SOẠN BẰNG AI =====================
  // =========================================================================
  const [topic, setTopic] = useState('');
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

  const updateConfig = (type: 'MCQ' | 'TF' | 'SA' | 'LA', field: 'count' | 'level', value: any) => {
    setExamConfig(prev => ({ ...prev, [type]: { ...prev[type], [field]: field === 'count' ? Number(value) : value } }));
  };

  const handleGeneratePrompt = () => {
    if (!topic.trim()) { showToast('warning', 'Vui lòng nhập chủ đề / yêu cầu chi tiết!'); return; }
    const totalQuestions = examConfig.MCQ.count + examConfig.TF.count + examConfig.SA.count + examConfig.LA.count;
    if (totalQuestions === 0) { showToast('warning', 'Vui lòng nhập số lượng cho ít nhất 1 dạng!'); return; }

    let requestedTypes = [];
    let jsonTemplateExamples = [];

    if (examConfig.MCQ.count > 0) {
      requestedTypes.push(`- ${examConfig.MCQ.count} câu Trắc nghiệm 4 lựa chọn (MCQ) - Mức độ: ${examConfig.MCQ.level}`);
      jsonTemplateExamples.push(`  { "type": "MCQ", "question": "Câu hỏi LaTeX", "level": "${examConfig.MCQ.level}", "options": { "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D" }, "correctAnswer": "A", "source": "Nguồn" }`);
    }
    if (examConfig.TF.count > 0) {
      requestedTypes.push(`- ${examConfig.TF.count} câu Trắc nghiệm Đúng/Sai (TF) - Mức độ: ${examConfig.TF.level}`);
      jsonTemplateExamples.push(`  { "type": "TF", "question": "Câu hỏi LaTeX", "level": "${examConfig.TF.level}", "statements": [ { "id": "a", "text": "Phát biểu a", "correct": true }, { "id": "b", "text": "Phát biểu b", "correct": false }, { "id": "c", "text": "Phát biểu c", "correct": true }, { "id": "d", "text": "Phát biểu d", "correct": false } ], "source": "Nguồn" }`);
    }
    if (examConfig.SA.count > 0) {
      requestedTypes.push(`- ${examConfig.SA.count} câu Trả lời ngắn (SA) - Mức độ: ${examConfig.SA.level}`);
      jsonTemplateExamples.push(`  { "type": "SA", "question": "Câu hỏi LaTeX", "level": "${examConfig.SA.level}", "correctAnswer": "Giá trị số", "source": "Nguồn" }`);
    }
    if (examConfig.LA.count > 0) {
      requestedTypes.push(`- ${examConfig.LA.count} câu Tự luận (LA) - Mức độ: ${examConfig.LA.level}`);
      jsonTemplateExamples.push(`  { "type": "LA", "question": "Câu hỏi tự luận LaTeX", "level": "${examConfig.LA.level}", "correctAnswer": "Lời giải LaTeX", "source": "Nguồn" }`);
    }

    const promptText = `Bạn là chuyên gia ra đề Toán THPT. Hãy tạo ${totalQuestions} câu về "${topic}".\n\nCẤU TRÚC MA TRẬN:\n${requestedTypes.join('\n')}\n\nNGUỒN THAM CHIẾU (BẮT BUỘC TUÂN THỦ):\n${referenceSource.trim() ? referenceSource : 'Sách giáo khoa Toán GDPT 2018.'}\n\nYÊU CẦU:\n1. Bám sát nguồn, không bịa đặt.\n2. Công thức bọc trong mã LaTeX (VD: \\int x dx).\n3. Trả về MẢNG JSON thuần túy (Không dùng \`\`\`json).\n\nMẪU:\n[\n${jsonTemplateExamples.join(',\n')}\n]`;
    setGeneratedPrompt(promptText);
    showToast('success', 'Đã tạo Prompt Ma trận đề thi!');
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    showToast('info', 'Đã copy Prompt!');
  };

  const handleParseJSON = () => {
    try {
      const cleanedInput = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedInput);
      setGeneratedQuestions(Array.isArray(parsedData) ? parsedData : [parsedData]);
      showToast('success', 'Dịch JSON thành công!');
      setJsonInput(''); 
    } catch (error) {
      showToast('error', 'Lỗi cú pháp JSON!');
    }
  };

  // NÚT MỚI: LƯU ĐỒNG LOẠT
  const handleSaveAllToBank = async () => {
    if (generatedQuestions.length === 0) return;
    try {
      showToast('info', 'Đang lưu vào ngân hàng...');
      for (const q of generatedQuestions) {
        await addDoc(collection(db, 'cauhoi_nganhang'), { ...q, createdAt: serverTimestamp() });
      }
      showToast('success', `Đã lưu thành công ${generatedQuestions.length} câu hỏi!`);
      setGeneratedQuestions([]);
    } catch (error) {
      showToast('error', 'Có lỗi khi lưu đồng loạt.');
    }
  };

  const handleSaveSingleToBank = async (q: any) => {
    try {
      await addDoc(collection(db, 'cauhoi_nganhang'), { ...q, createdAt: serverTimestamp() });
      showToast('success', 'Đã lưu câu hỏi!');
      setGeneratedQuestions(prev => prev.filter(item => item !== q));
    } catch (error) {
      showToast('error', 'Lưu thất bại.');
    }
  };


  // =========================================================================
  // ==================== TAB 2: LOGIC KHO & GIAO ĐỀ (MỚI) ===================
  // =========================================================================
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [isFetchingBank, setIsFetchingBank] = useState(false);

  const fetchBankQuestions = async () => {
    setIsFetchingBank(true);
    try {
      const q = query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const questionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBankQuestions(questionsData);
    } catch (error) {
      showToast('error', 'Không thể tải dữ liệu ngân hàng đề.');
    } finally {
      setIsFetchingBank(false);
    }
  };

  // Tự động tải kho câu hỏi khi chuyển sang Tab Quản lý
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchBankQuestions();
    }
  }, [activeTab]);


  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER & TAB NAVIGATION */}
          <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                  QUẢN LÝ CHUYÊN MÔN
                </span>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 uppercase tracking-wide mt-2">
                  Hệ Thống Ngân Hàng Đề Thi
                </h1>
              </div>
              <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm">
                ⬅ Về Dashboard
              </button>
            </div>
            
            {/* CÔNG TẮC CHUYỂN TAB */}
            <div className="flex gap-2 mt-2 bg-slate-100 p-1.5 rounded-xl w-fit">
              <button 
                onClick={() => setActiveTab('create')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'create' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                1. Biên Soạn (Trợ Lý AI)
              </button>
              <button 
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'manage' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                2. Kho Dữ Liệu & Giao Đề Học Sinh
              </button>
            </div>
          </div>

          {/* ======================= HIỂN THỊ TAB 1 ======================= */}
          {activeTab === 'create' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              {/* CỘT TRÁI: THIẾT LẬP */}
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl space-y-5">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider border-b border-emerald-100 pb-3">Bước 1: Ma Trận Đề & Nguồn</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Chủ đề:</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Nhập chủ đề..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm font-bold shadow-inner" />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Cấu hình dạng thức:</label>
                    {['MCQ', 'TF', 'SA', 'LA'].map((t) => (
                      <div key={t} className="flex items-center gap-3">
                        <span className="w-20 font-bold text-xs text-slate-700">{t === 'MCQ' ? 'Trắc nghiệm:' : t === 'TF' ? 'Đúng/Sai:' : t === 'SA' ? 'Trả lời ngắn:' : 'Tự luận:'}</span>
                        <input type="number" min="0" value={(examConfig as any)[t].count} onChange={(e) => updateConfig(t as any, 'count', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-300 text-sm text-center" />
                        <select value={(examConfig as any)[t].level} onChange={(e) => updateConfig(t as any, 'level', e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-xs">
                          <option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option><option>Vận dụng cao</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1.5">📚 Nguồn dữ liệu (Grounding):</label>
                    <textarea value={referenceSource} onChange={(e) => setReferenceSource(e.target.value)} placeholder="Dán nội dung sách giáo khoa để AI dựa vào..." className="w-full h-24 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-medium focus:outline-none resize-none" />
                  </div>
                  <button onClick={handleGeneratePrompt} className="w-full py-3 bg-emerald-100 text-emerald-700 font-extrabold rounded-xl hover:bg-emerald-200 text-xs uppercase tracking-wider">⚡ Khởi Tạo Lệnh Prompt</button>
                </div>

                <div className="bg-white/90 p-6 rounded-3xl shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-sky-100 pb-3">
                    <h3 className="text-xs font-black text-sky-700 uppercase tracking-wider">Bước 2: Copy Prompt</h3>
                    <button onClick={handleCopyPrompt} disabled={!generatedPrompt} className="px-4 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md disabled:opacity-50">📋 Copy Prompt</button>
                  </div>
                  <textarea readOnly value={generatedPrompt} className="w-full h-32 p-4 bg-slate-800 text-emerald-400 font-mono text-[11px] rounded-xl focus:outline-none shadow-inner resize-none" />
                </div>
              </div>

              {/* CỘT PHẢI: DỊCH JSON & LƯU TRỮ */}
              <div className="space-y-6">
                <div className="bg-white/90 p-6 rounded-3xl shadow-xl space-y-4">
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider border-b border-amber-100 pb-3">Bước 3: Dịch mã JSON từ AI</h3>
                  <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='Dán mảng JSON AI trả về vào đây...' className="w-full h-32 p-4 bg-amber-50 border border-amber-100 font-mono text-[11px] rounded-xl focus:outline-none resize-none" />
                  <button onClick={handleParseJSON} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-xl text-xs uppercase shadow-[0_4px_0_0_#9A3412] active:translate-y-1 active:shadow-none transition-all">🧩 Hiển Thị Đề</button>
                </div>

                {generatedQuestions.length > 0 && (
                  <div className="bg-white/95 p-6 rounded-3xl shadow-2xl space-y-4 border-2 border-emerald-400">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                      <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                        Bước 4: Duyệt Đề ({generatedQuestions.length} câu)
                      </h3>
                      {/* NÚT LƯU ĐỒNG LOẠT Ở ĐÂY */}
                      <button onClick={handleSaveAllToBank} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors">
                        💾 LƯU TẤT CẢ VÀO KHO
                      </button>
                    </div>
                    
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6">
                      {generatedQuestions.map((q, idx) => (
                        <div key={idx} className="space-y-4 border-b border-slate-200 pb-6 last:border-0 relative">
                          <span className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-black rounded">{q.type}</span>
                          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-inner text-sm font-medium">
                            <BlockMath math={q.question || '\\text{Lỗi LaTeX}'} />
                          </div>
                          {/* (Giao diện hiển thị chi tiết đáp án ẩn bớt để tối ưu code, logic vẫn giữ nguyên) */}
                          <div className="bg-slate-50 p-3 rounded-lg text-xs">
                            <p className="font-bold text-slate-500 mb-1">Cấp độ: {q.level}</p>
                            <button onClick={() => handleSaveSingleToBank(q)} className="w-full mt-2 py-2 border-2 border-emerald-500 text-emerald-600 font-bold rounded hover:bg-emerald-50 text-xs">✔ Lưu Câu Này</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= HIỂN THỊ TAB 2 (QUẢN LÝ KHO & GIAO ĐỀ) ======================= */}
          {activeTab === 'manage' && (
            <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 animate-fadeIn min-h-[600px] flex flex-col">
              
              <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Kho Dữ Liệu Ngân Hàng</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Đang lưu trữ {bankQuestions.length} câu hỏi hệ thống.</p>
                </div>
                
                {/* NÚT XUẤT ĐỀ THI GIAO CHO HỌC SINH */}
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm shadow-md hover:scale-105 transition-transform flex items-center gap-2">
                  <span>🚀</span> XUẤT ĐỀ VÀ GIAO CHO HỌC SINH
                </button>
              </div>

              {isFetchingBank ? (
                <div className="flex-1 flex justify-center items-center">
                  <p className="text-slate-500 font-bold animate-pulse">Đang tải dữ liệu từ máy chủ...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
                  {bankQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow relative group">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : q.type === 'TF' ? 'bg-amber-100 text-amber-700' : q.type === 'SA' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                          {q.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{q.level}</span>
                      </div>
                      
                      {/* Hiển thị tóm tắt LaTeX (Có thể bị cắt ngang nếu quá dài) */}
                      <div className="text-xs overflow-hidden max-h-24">
                         <BlockMath math={q.question || ''} />
                      </div>

                      {/* Nút check chọn vào đề thi */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input type="checkbox" className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                  
                  {bankQuestions.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                      Chưa có câu hỏi nào trong kho. Thầy hãy tạo ở Tab Biên Soạn nhé.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </AuthGuard>
  );
}