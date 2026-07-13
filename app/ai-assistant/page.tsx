'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AIAssistantPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('Lớp 12');
  const [digitalTool, setDigitalTool] = useState('GeoGebra');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLessonPlan = async () => {
    if (!topic.trim()) {
      showToast('warning', 'Thầy vui lòng nhập tên bài học / chủ đề nhé!');
      return;
    }

    setIsGenerating(true);
    setAiResponse('');
    showToast('info', 'AI đang phân tích và thiết kế giáo án. Thầy đợi chút nhé...');

    // Lệnh Prompt chuyên biệt ép AI viết giáo án tích hợp năng lực số
    const promptText = `Bạn là một chuyên gia phương pháp giảng dạy Toán học tại Việt Nam.
Hãy thiết kế một Kế hoạch bài dạy (Giáo án) chi tiết cho bài học: "${topic}" dành cho học sinh ${grade}.
YÊU CẦU BẮT BUỘC:
1. Cấu trúc giáo án rành mạch theo 4 hoạt động: Khởi động, Hình thành kiến thức mới, Luyện tập, Vận dụng.
2. TÍCH HỢP NĂNG LỰC SỐ: Phải có ít nhất 1 hoạt động ứng dụng phần mềm/công cụ [${digitalTool}] để minh họa hoặc cho học sinh thực hành. Nêu rõ thao tác giáo viên/học sinh cần làm với công cụ này.
3. Tất cả công thức Toán học phải bọc trong thẻ LaTeX tiêu chuẩn (dùng dấu $ hoặc $$).
4. Trình bày bằng văn bản Markdown rõ ràng, dễ đọc.`;

    try {
      // Gọi API mà chúng ta đã tạo chuyên cho việc viết văn bản (Markdown/LaTeX)
      const response = await fetch('/api/editor-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) throw new Error('Lỗi phản hồi từ máy chủ');

      const data = await response.json();
      setAiResponse(data.text);
      showToast('success', 'Đã thiết kế xong giáo án!');
    } catch (error) {
      console.error("Lỗi AI:", error);
      showToast('error', 'Quá trình tạo giáo án gặp lỗi. Thầy kiểm tra lại API Key nhé.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyContent = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    showToast('success', 'Đã copy giáo án vào khay nhớ tạm! Thầy có thể dán sang Word hoặc Trình Biên Soạn.');
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-700 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* HEADER */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Trợ lý AI TBS
              </span>
              <h1 className="text-2xl font-extrabold text-gray-800 uppercase tracking-wide mt-2">
                Soạn Giáo Án Năng Lực Số
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Tích hợp công nghệ (GeoGebra, Desmos, Quizizz...) vào tiến trình dạy học.
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm uppercase shadow-sm"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CỘT TRÁI: FORM CẤU HÌNH */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-5">
                <h3 className="text-sm font-black text-purple-700 uppercase tracking-wider border-b border-purple-100 pb-3">
                  Thông số bài giảng
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tên bài học / Chủ đề:</label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="VD: Thể tích khối đa diện..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Đối tượng học sinh:</label>
                  <select 
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="Lớp 10">Lớp 10 (Chương trình 2018)</option>
                    <option value="Lớp 11">Lớp 11 (Chương trình 2018)</option>
                    <option value="Lớp 12">Lớp 12 (Chương trình 2018)</option>
                    <option value="Đội tuyển HSG">Đội tuyển HSG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Công cụ số tích hợp:</label>
                  <select 
                    value={digitalTool}
                    onChange={(e) => setDigitalTool(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="GeoGebra">GeoGebra (Mô phỏng 2D/3D)</option>
                    <option value="Desmos">Desmos (Đồ thị hàm số)</option>
                    <option value="Quizizz / Kahoot">Quizizz / Kahoot (Trắc nghiệm tương tác)</option>
                    <option value="Padlet / Azota">Padlet / Azota (Thu thập phản hồi)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateLessonPlan}
                  disabled={isGenerating}
                  className={`w-full py-3.5 font-black rounded-xl transition-all text-sm uppercase tracking-wider shadow-sm flex justify-center items-center gap-2 ${isGenerating ? 'bg-gray-200 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Đang xử lý...
                    </>
                  ) : (
                    '🚀 Tạo Giáo Án'
                  )}
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden min-h-[500px]">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">
                    Kết Quả Từ Trợ Lý AI
                  </h3>
                  {aiResponse && (
                    <button 
                      onClick={handleCopyContent}
                      className="px-4 py-1.5 bg-white text-purple-600 border border-purple-200 text-xs font-bold uppercase rounded-lg shadow-sm hover:bg-purple-50 transition-all"
                    >
                      📋 Copy Văn Bản
                    </button>
                  )}
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto">
                  {aiResponse ? (
                    <div className="prose max-w-none text-gray-800">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {aiResponse}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-60">
                      <span className="text-6xl">🤖</span>
                      <p className="text-sm font-medium">Bản thảo giáo án sẽ xuất hiện tại đây.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </AuthGuard>
  );
}