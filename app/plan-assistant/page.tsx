'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';

export default function PlanAssistantPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [planType, setPlanType] = useState('LESSON_PLAN_DIGITAL');
  const [inputData, setInputData] = useState('');
  const [referenceSource, setReferenceSource] = useState(''); // State mới lưu Nguồn chuẩn
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!inputData.trim()) {
      showToast('warning', 'Thầy/Cô vui lòng cung cấp dữ liệu đầu vào cho AI!');
      return;
    }

    setLoading(true);
    showToast('info', 'Đang neo dữ liệu và cấu trúc văn bản hành chính...');
    
    try {
      const response = await fetch('/api/plan-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, inputData, referenceSource }) // Gửi kèm nguồn
      });

      const data = await response.json();
      if (data.result) {
        setGeneratedPlan(data.result);
        showToast('success', 'Bản thảo kế hoạch đã hoàn thành dựa trên nguồn chuẩn!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast('error', 'Lỗi kết xuất dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPlan);
    showToast('success', 'Đã sao chép toàn bộ văn bản!');
  };

  const exportToWord = () => {
    if (!generatedPlan) return;
    const formattedText = generatedPlan.split('\n').map(line => {
      if (line.trim() === '') return '<p style="margin: 0 0 6pt 0;">&nbsp;</p>';
      if (line.includes('**')) {
        let boldLine = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        return `<p style="font-family: 'Times New Roman', Times, serif; font-size: 14pt; margin: 0 0 6pt 0;">${boldLine}</p>`;
      }
      return `<p style="font-family: 'Times New Roman', Times, serif; font-size: 14pt; margin: 0 0 6pt 0;">${line}</p>`;
    }).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>@page WordSection1 { size: 21cm 29.7cm; margin: 2cm 2cm 2cm 3cm; } div.WordSection1 { page: WordSection1; }</style>
      </head>
      <body><div class="WordSection1">${formattedText}</div></body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = planType === 'LESSON_PLAN_DIGITAL' ? 'Giao_An_Toan_TBS.doc' : 'Ke_Hoach_Chuyen_Mon_TBS.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Đã tải xuống file Word thành công!');
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-indigo-600 uppercase">
                TẠO PROMT - TBS (Hồ Sơ Chuyên Môn)
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                Có kiểm soát Nguồn dữ liệu (Grounding API)
              </p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase">⬅ Về Dashboard</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl space-y-5">
              <h3 className="text-sm font-black text-slate-700 uppercase border-b border-slate-100 pb-3">1. Thông số & Nguồn Dữ Liệu</h3>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Loại văn bản / Giáo án:</label>
                <select value={planType} onChange={(e) => setPlanType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-200">
                  <option value="LESSON_PLAN_DIGITAL">🌟 Kế hoạch bài dạy tích hợp Năng lực số</option>
                  <option value="APPENDIX1">Phụ lục I: Kế hoạch dạy học của Tổ chuyên môn</option>
                  <option value="APPENDIX2">Phụ lục II: Kế hoạch tổ chức hoạt động giáo dục</option>
                  <option value="APPENDIX3">Phụ lục III: Kế hoạch giáo dục của Giáo viên</option>
                </select>
              </div>

              {/* Ô NHẬP NGUỒN DỮ LIỆU ĐỐI CHIẾU (MỚI) */}
              <div>
                <label className="block text-xs font-black text-emerald-600 uppercase mb-2">
                  📚 Nguồn dữ liệu chuẩn (NotebookLM, YCCĐ, SGK):
                </label>
                <textarea 
                  value={referenceSource}
                  onChange={(e) => setReferenceSource(e.target.value)}
                  placeholder="Thầy dán phần tóm tắt từ NotebookLM, File PDF Yêu cầu cần đạt 2018, hoặc đường link URL để AI bám sát tuyệt đối vào đây..."
                  className="w-full h-28 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-medium focus:outline-none resize-none focus:ring-2 focus:ring-emerald-300 placeholder:text-emerald-400/70"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Yêu cầu cụ thể của GV (Lớp, Bài, Mục tiêu...):</label>
                <textarea 
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="VD: Viết KHBD cho lớp 11A1, nội dung bám sát nguồn tôi cung cấp ở trên..."
                  className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none resize-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <button onClick={handleGenerate} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs uppercase rounded-xl disabled:opacity-60 shadow-[0_4px_0_0_#4C1D95] active:translate-y-1 active:shadow-[0_0px_0_0_#4C1D95]">
                {loading ? '⏳ Đang quét nguồn dữ liệu...' : '⚡ Khởi tạo Văn bản Chính xác'}
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-black text-slate-700 uppercase">2. Bản thảo (Có ghi rõ Nguồn)</h3>
                {generatedPlan && (
                  <div className="flex gap-2">
                    <button onClick={copyToClipboard} className="px-4 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs hover:bg-emerald-200">📋 Copy</button>
                    <button onClick={exportToWord} className="px-4 py-1.5 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-200">💾 Xuất Word</button>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                {generatedPlan ? (
                  <textarea readOnly value={generatedPlan} className="w-full h-full min-h-[400px] p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none resize-none leading-relaxed" />
                ) : (
                  <div className="h-full min-h-[400px] flex items-center justify-center text-slate-400 font-medium text-sm text-center px-8">
                    Văn bản sẽ được khởi tạo tại đây, bám sát 100% tài liệu gốc và có trích dẫn nguồn ở cuối bài.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </AuthGuard>
  );
}