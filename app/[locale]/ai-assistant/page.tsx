'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import { useLocale } from 'next-intl';

export default function AIAssistantPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const locale = useLocale();

  const [grade, setGrade] = useState('Khối 10');
  const [lessonName, setLessonName] = useState('');
  const [digitalSkill, setDigitalSkill] = useState('Sử dụng phần mềm GeoGebra/Desmos');
  const [teachingMethod, setTeachingMethod] = useState('Dạy học dự án (Project-based Learning)');
  const [referenceSource, setReferenceSource] = useState('Sách giáo khoa Toán 2018 (Kết nối tri thức / Chân trời sáng tạo / Cánh diều)');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrompt = () => {
    if (!lessonName.trim()) {
      showToast('warning', 'Thầy cô vui lòng nhập tên bài học/chuyên đề!');
      return;
    }

    setIsGenerating(true);

    // Giả lập độ trễ xử lý để tạo cảm giác AI đang phân tích
    setTimeout(() => {
      const promptText = `Đóng vai là một chuyên gia phương pháp giảng dạy Toán THPT theo Chương trình GDPT 2018. Hãy soạn cho tôi một Kế hoạch bài dạy (Giáo án) chi tiết.

THÔNG TIN BÀI DẠY:
- Môn học: Toán ${grade}
- Tên bài/Chủ đề: ${lessonName}
- Phương pháp chủ đạo: ${teachingMethod}
- Yêu cầu đặc thù: Phải tích hợp rõ ràng yêu cầu phát triển "Năng lực số" thông qua hoạt động: ${digitalSkill}.

CẤU TRÚC YÊU CẦU (Bám sát Công văn 5512/BGDĐT-GDTrH):
1. Mục tiêu bài học (Năng lực Toán học, Năng lực chung, Năng lực số và Phẩm chất).
2. Thiết bị dạy học và Học liệu số.
3. Tiến trình dạy học (Gồm 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng).

NGUỒN TÀI LIỆU THAM KHẢO & ĐỐI CHIẾU:
- Bám sát nội dung từ: ${referenceSource || 'Chương trình GDPT 2018 môn Toán'}
- Vui lòng ghi chú nguồn tham khảo ở cuối giáo án.

YÊU CẦU NGÔN NGỮ (LANGUAGE REQUIREMENT):
${locale === 'en' ? 'TUYỆT ĐỐI sinh toàn bộ giáo án bằng TIẾNG ANH (ENGLISH). Dịch chuẩn các thuật ngữ sư phạm.' : 'Sinh toàn bộ giáo án bằng TIẾNG VIỆT.'}

*Lưu ý: Tại phần mô tả các hoạt động, hãy chỉ rõ cách học sinh tương tác với thiết bị số hoặc phần mềm để hoàn thành nhiệm vụ toán học.*`;

      setGeneratedPrompt(promptText);
      setIsGenerating(false);
      showToast('success', 'Đã thiết kế xong Lệnh Prompt chuẩn hóa!');
    }, 800);
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    showToast('info', 'Đã sao chép lệnh. Sẵn sàng dán vào công cụ AI sinh văn bản!');
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-purple-500">
            <div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                Tổ Toán - TBS
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2 flex items-center gap-2">
                🧠 Trợ Lý AI Thiết Kế Bài Giảng
              </h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN THÔNG SỐ */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Thông số bài dạy</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Định hướng năng lực GDPT 2018</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Khối lớp:</label>
                  <select 
                    value={grade} 
                    onChange={(e) => setGrade(e.target.value)} 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50"
                  >
                    <option>Khối 10</option>
                    <option>Khối 11</option>
                    <option>Khối 12</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Tên bài học / Chuyên đề:</label>
                  <input 
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="VD: Khảo sát sự biến thiên và vẽ đồ thị hàm số..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Yêu cầu tích hợp Năng lực số:</label>
                  <select 
                    value={digitalSkill} 
                    onChange={(e) => setDigitalSkill(e.target.value)} 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50"
                  >
                    <option>Sử dụng phần mềm GeoGebra/Desmos trực quan hóa đồ thị</option>
                    <option>Khai thác thông tin từ Internet và xử lý dữ liệu bảng tính</option>
                    <option>Sử dụng máy tính cầm tay giải quyết vấn đề tối ưu</option>
                    <option>Thiết kế Infographic tổng hợp công thức toán học</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Phương pháp sư phạm:</label>
                  <select 
                    value={teachingMethod} 
                    onChange={(e) => setTeachingMethod(e.target.value)} 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50"
                  >
                    <option>Dạy học giải quyết vấn đề (Problem-Solving)</option>
                    <option>Dạy học dự án (Project-based Learning)</option>
                    <option>Lớp học đảo ngược (Flipped Classroom)</option>
                    <option>Dạy học khám phá (Inquiry-based Learning)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nguồn tài liệu tham khảo (Tùy chọn):</label>
                  <input 
                    type="text"
                    value={referenceSource}
                    onChange={(e) => setReferenceSource(e.target.value)}
                    placeholder="VD: SGK Toán 10 KNTT, Tài liệu nội bộ..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50"
                  />
                </div>

                <button 
                  onClick={handleGeneratePrompt}
                  disabled={isGenerating}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_4px_0_0_#4C1D95] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isGenerating ? 'Đang phân tích sư phạm... ⏳' : '⚡ Sinh lệnh Prompt'}
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: KẾT QUẢ PROMPT & HƯỚNG DẪN */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 flex-1 flex flex-col relative overflow-hidden">
                {/* Trang trí góc */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none"></div>
                
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider">Cấu trúc Lệnh Điều khiển AI</h3>
                    <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">Kết xuất chuẩn đầu vào</p>
                  </div>
                  <button 
                    onClick={handleCopyPrompt}
                    disabled={!generatedPrompt}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-purple-600 hover:text-white text-xs font-black uppercase rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-slate-800"
                  >
                    📋 Sao chép Lệnh
                  </button>
                </div>

                <div className="flex-1 bg-slate-950/50 rounded-2xl p-4 border border-slate-800 relative">
                  {!generatedPrompt && !isGenerating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 font-medium text-sm space-y-3 opacity-60">
                      <span className="text-4xl">🤖</span>
                      <p>Vui lòng nhập thông số bên trái để AI tổng hợp lệnh.</p>
                    </div>
                  )}
                  <textarea 
                    readOnly
                    value={generatedPrompt}
                    className="w-full h-full bg-transparent text-emerald-400 font-mono text-[13px] leading-relaxed resize-none focus:outline-none"
                    placeholder=""
                  />
                </div>
                
                <div className="mt-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    <span className="font-bold text-purple-300">Hướng dẫn sử dụng:</span> Thầy cô hãy bấm <strong className="text-white">Sao chép Lệnh</strong> và dán trực tiếp vào các mô hình ngôn ngữ lớn (như ChatGPT, Claude, hoặc Gemini). AI sẽ hiểu rõ ngữ cảnh sư phạm và tự động sinh ra giáo án hoàn chỉnh, chuẩn mẫu của Bộ GD&ĐT.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </AuthGuard>
  );
}