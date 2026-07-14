'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';

export default function PlanAssistantPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'phuluc1' | 'phuluc2' | 'phuluc3'>('phuluc3');

  // --- STATE: PHỤ LỤC 3 (MA TRẬN ĐỀ) ---
  const [grade, setGrade] = useState('Khối 10');
  const [examType, setExamType] = useState('Giữa kỳ I');
  const [examDuration, setExamDuration] = useState('90 phút');
  const [topics, setTopics] = useState('');
  const [ratio, setRatio] = useState('4-3-2-1'); // Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  // Hàm sinh Prompt cho Ma trận đề kiểm tra
  const handleGenerateMatrixPrompt = () => {
    if (!topics.trim()) {
      showToast('warning', 'Thầy vui lòng nhập các chủ đề kiến thức cần kiểm tra!');
      return;
    }

    const promptText = `Bạn là tổ trưởng chuyên môn Toán cấp THPT. Hãy lập Khung Ma trận và Bản đặc tả đề kiểm tra môn Toán theo đúng chuẩn Công văn 3175/BGDĐT-GDTrH.

THÔNG SỐ ĐỀ BÀI:
- Đối tượng: Học sinh ${grade}
- Loại bài kiểm tra: ${examType}
- Thời gian làm bài: ${examDuration}
- Nội dung/Chủ đề đánh giá: ${topics}
- Tỷ lệ các mức độ nhận thức (Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao): ${ratio}

YÊU CẦU ĐẦU RA:
1. Bảng Khung Ma trận đề kiểm tra (Trình bày dạng bảng Markdown rõ ràng, chia số lượng câu hỏi trắc nghiệm và tự luận cho từng mức độ).
2. Bản đặc tả chi tiết (Nêu rõ Yêu cầu cần đạt cho từng đơn vị kiến thức tương ứng với các mức độ).
Hãy đảm bảo cấu trúc logic, khoa học và phân bổ điểm số hợp lý với tổng 10.0 điểm.`;

    setGeneratedPrompt(promptText);
    showToast('success', 'Đã khởi tạo lệnh Prompt xây dựng Ma trận thành công!');
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    showToast('info', 'Đã sao chép vào khay nhớ tạm. Thầy có thể dán vào ChatGPT hoặc Gemini!');
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                TRƯỜNG TH, THCS VÀ THPT THANH BÌNH
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2">
                Trợ Lý Thiết Kế Kế Hoạch & Ma Trận
              </h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          {/* THANH ĐIỀU HƯỚNG TAB */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveTab('phuluc1')} 
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'phuluc1' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Phụ lục 1: Kế hoạch dạy học
            </button>
            <button 
              onClick={() => setActiveTab('phuluc2')} 
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'phuluc2' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Phụ lục 2: Tổ chức hoạt động
            </button>
            <button 
              onClick={() => setActiveTab('phuluc3')} 
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'phuluc3' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Phụ lục 3: Ma trận đề thi
            </button>
          </div>

          {/* NỘI DUNG TỪNG TAB */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
            
            {/* TAB PHỤ LỤC 1 & 2 (ĐANG XÂY DỰNG) */}
            {(activeTab === 'phuluc1' || activeTab === 'phuluc2') && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="text-6xl animate-bounce">🚧</div>
                <h3 className="text-xl font-black text-slate-700 uppercase">Phân hệ đang được lập trình</h3>
                <p className="text-sm text-slate-500 font-medium max-w-md">
                  Tính năng sinh kế hoạch bài dạy và phân phối chương trình tự động đang được thiết kế tích hợp với dữ liệu khung GDPT 2018. Thầy vui lòng sử dụng tab Ma trận đề thi trước nhé!
                </p>
              </div>
            )}

            {/* TAB PHỤ LỤC 3: MA TRẬN ĐỀ THI */}
            {activeTab === 'phuluc3' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                
                {/* Khu vực cấu hình đầu vào */}
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-lg font-black text-blue-700 uppercase tracking-wide">Thiết lập thông số Ma trận</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">Ép AI phân bổ cấu trúc chuẩn theo barem điểm của Tổ chuyên môn.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Khối lớp:</label>
                      <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400">
                        <option>Khối 10</option>
                        <option>Khối 11</option>
                        <option>Khối 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kỳ thi:</label>
                      <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400">
                        <option>Kiểm tra Thường xuyên (15p)</option>
                        <option>Kiểm tra Giữa kỳ I</option>
                        <option>Kiểm tra Cuối kỳ I</option>
                        <option>Kiểm tra Giữa kỳ II</option>
                        <option>Kiểm tra Cuối kỳ II</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Thời lượng:</label>
                      <select value={examDuration} onChange={(e) => setExamDuration(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400">
                        <option>15 phút</option>
                        <option>45 phút</option>
                        <option>90 phút</option>
                        <option>120 phút</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tỷ lệ độ khó (NB-TH-VD-VDC):</label>
                      <select value={ratio} onChange={(e) => setRatio(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-400">
                        <option>4-3-2-1</option>
                        <option>3-4-2-1</option>
                        <option>5-3-1-1</option>
                        <option>2-3-3-2 (Mũi nhọn)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mạch kiến thức / Chủ đề cụ thể:</label>
                    <textarea 
                      value={topics} 
                      onChange={(e) => setTopics(e.target.value)} 
                      placeholder="VD: Chương 1: Hàm số lượng giác và Phương trình lượng giác; Chương 2: Dãy số, cấp số cộng, cấp số nhân..." 
                      className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleGenerateMatrixPrompt}
                    className="w-full py-3.5 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                  >
                    ⚡ Sinh Lệnh Cấu Trúc Ma Trận
                  </button>
                </div>

                {/* Khu vực Hiển thị lệnh AI */}
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center border-b border-sky-100 pb-2 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Lệnh trích xuất (Prompt)</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sao chép để giao việc cho Trợ lý AI</p>
                    </div>
                    <button 
                      onClick={handleCopyPrompt} 
                      disabled={!generatedPrompt}
                      className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-700 text-xs font-black uppercase rounded-lg transition-colors disabled:opacity-50"
                    >
                      📋 Copy Lệnh
                    </button>
                  </div>
                  <div className="flex-1 min-h-[250px] relative">
                    <textarea 
                      readOnly 
                      value={generatedPrompt} 
                      placeholder="Kết quả sinh lệnh sẽ hiển thị tại đây..."
                      className="w-full h-full p-5 bg-slate-900 text-emerald-400 font-mono text-[13px] rounded-2xl focus:outline-none shadow-inner resize-none leading-relaxed" 
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}