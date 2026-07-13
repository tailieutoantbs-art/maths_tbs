"use client";
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function EditorWithAIPage() {
  const [editorContent, setEditorContent] = useState('Dưới đây là một ví dụ về công thức Toán LaTeX:\n\nPhương trình bậc hai có dạng: $ax^2 + bx + c = 0$\n\nCông thức nghiệm:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');

  // Hàm gọi API đã được nối chính xác vào thư mục /api/editor-ai
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiResponse(""); // Xóa nội dung cũ trước khi nhận câu trả lời mới
    
    try {
      const response = await fetch('/api/editor-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        throw new Error("Lỗi phản hồi từ máy chủ");
      }

      const data = await response.json();
      setAiResponse(data.text);
    } catch (error) {
      console.error("Lỗi gọi AI:", error);
      setAiResponse("⚠️ Lỗi: Không thể kết nối với Trợ lý AI. Thầy vui lòng kiểm tra lại đường truyền hoặc cấu hình API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAppendix = (type: string) => {
    if (type === 'phuluc1') setAiPrompt("Dựa vào Phụ lục 1, hãy lập Kế hoạch bài dạy (Giáo án) cho bài: [Tên bài Toán]. Yêu cầu: Phân bổ thời gian 45 phút, rành mạch 4 hoạt động (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng).");
    else if (type === 'phuluc2') setAiPrompt("Dựa vào Phụ lục 2, hãy xây dựng Phân phối chương trình chi tiết cho chuyên đề: [Tên chuyên đề]. Yêu cầu bám sát chuẩn kiến thức kỹ năng.");
    else if (type === 'phuluc3') setAiPrompt("Dựa vào Phụ lục 3, hãy sinh một đề kiểm tra 15 phút phần [Chủ đề]. Yêu cầu: 10 câu trắc nghiệm khách quan, có đáp án và lời giải chi tiết theo định dạng LaTeX.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-extrabold text-indigo-700">BIÊN SOẠN TÀI LIỆU TOÁN HỌC - TBS</h1>
          <p className="text-sm text-gray-500 font-medium">Tích hợp Trợ lý AI & Hỗ trợ chuẩn LaTeX</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">📄 Xuất Word</button>
          <button className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">📜 Xuất LaTeX</button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* CỘT TRÁI: KHUNG SOẠN THẢO & XEM TRƯỚC */}
        <div className="w-2/3 p-6 overflow-hidden flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
            
            {/* Thanh điều khiển Tab */}
            <div className="bg-gray-100 px-4 pt-3 border-b border-gray-200 flex gap-2">
              <button 
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'edit' ? 'bg-white text-indigo-600 border-t-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                ✍️ Mã Nguồn (Soạn Thảo)
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'preview' ? 'bg-white text-emerald-600 border-t-2 border-emerald-600' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                👁️ Xem Trước (Kết Quả Toán)
              </button>
            </div>
            
            {/* Vùng hiển thị nội dung theo Tab */}
            <div className="flex-1 overflow-y-auto relative">
              {activeTab === 'edit' ? (
                <textarea
                  className="absolute inset-0 w-full h-full p-6 resize-none focus:outline-none text-gray-800 leading-relaxed font-mono text-sm bg-gray-50"
                  placeholder="Nhập nội dung văn bản và công thức LaTeX (ví dụ: $\int x dx$)..."
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                />
              ) : (
                <div className="p-8 prose max-w-none text-gray-800">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {editorContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TRỢ LÝ AI TÍCH HỢP */}
        <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col shadow-[[-4px_0_15px_rgba(0,0,0,0.03)]] z-10">
          <div className="p-4 border-b border-gray-100 bg-indigo-50/50 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="font-bold text-indigo-800 text-lg">Trợ Lý AI TBS</h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {aiResponse ? (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 text-sm text-gray-700 relative group">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {aiResponse}
                </ReactMarkdown>
                <button 
                  onClick={() => {
                    setEditorContent(prev => prev + '\n\n' + aiResponse);
                    setActiveTab('preview');
                  }}
                  className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  📋 Chèn vào bài
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 opacity-60">
                <span className="text-5xl">✨</span>
                <p className="text-sm text-center px-4">Hãy gọi AI để tạo giáo án, lập ma trận đề thi hoặc giải bài tập.</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleSelectAppendix('phuluc1')} className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors">+ PL1: Giáo án</button>
              <button onClick={() => handleSelectAppendix('phuluc2')} className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors">+ PL2: Kế hoạch</button>
              <button onClick={() => handleSelectAppendix('phuluc3')} className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors">+ PL3: Đề thi</button>
            </div>

            <div className="relative">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Nhập yêu cầu (Hỗ trợ sinh mã LaTeX Toán học)..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-12 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                rows={4}
              />
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className={`absolute bottom-3 right-3 p-2 rounded-lg flex items-center justify-center transition-all ${isGenerating || !aiPrompt.trim() ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
              >
                {isGenerating ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}