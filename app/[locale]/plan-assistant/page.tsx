'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PlanAssistantPage() {
  const t = useTranslations('PlanAssistant');
  const locale = useLocale();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'phuluc1' | 'phuluc2' | 'phuluc3' | 'pdf2latex'>('phuluc3');
  const [rightTab, setRightTab] = useState<'prompt' | 'result' | 'preview'>('result');

  // --- STATE FOR PDF TO LATEX ---
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [addSolutions, setAddSolutions] = useState(false);

  // --- GENERAL/METADATA STATES ---
  const [schoolName, setSchoolName] = useState('Cổng Công Nghệ Thông Tin - Thầy Hùng TBS');
  const [departmentName, setDepartmentName] = useState('Tổ Toán & Tin Học');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [grade, setGrade] = useState('Khối 10');
  const [referenceSource, setReferenceSource] = useState('NotebookLM / SGK Toán học Chương trình GDPT 2018');

  // --- STATE FOR PHỤ LỤC 1 ---
  const [pl1Subject, setPl1Subject] = useState('Toán học');
  const [pl1ClassesCount, setPl1ClassesCount] = useState('6');
  const [pl1StudentsCount, setPl1StudentsCount] = useState('210');
  const [pl1TeachersCount, setPl1TeachersCount] = useState('4');
  const [pl1Equipment, setPl1Equipment] = useState('Máy chiếu, bảng tương tác, phần mềm GeoGebra, Desmos');
  const [pl1CurriculumInput, setPl1CurriculumInput] = useState('');

  // --- STATE FOR PHỤ LỤC 2 ---
  const [pl2ActivityInput, setPl2ActivityInput] = useState('');

  // --- STATE FOR PHỤ LỤC 3 ---
  const [examType, setExamType] = useState('Giữa kỳ I');
  const [examDuration, setExamDuration] = useState('90 phút');
  const [ratio, setRatio] = useState('4-3-2-1');
  const [topics, setTopics] = useState('');

  // --- OUTPUT STATES ---
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sinh prompt tự động
  const handleGeneratePrompt = (tab: typeof activeTab) => {
    let promptText = '';
    if (tab === 'phuluc1') {
      if (!pl1CurriculumInput.trim()) {
        showToast('warning', 'Thầy vui lòng nhập thông tin phân phối chương trình dự kiến!');
        return '';
      }
      promptText = `Bạn là tổ trưởng chuyên môn Toán cấp THPT. Hãy tạo "KẾ HOẠCH DẠY HỌC CỦA TỔ CHUYÊN MÔN" theo đúng format Phụ lục I của Công văn số 05/SGDĐT-GDPT ngày 04 tháng 01 năm 2021.

THÔNG TIN ĐẶC ĐIỂM TÌNH HÌNH:
- Trường: ${schoolName}
- Tổ chuyên môn: ${departmentName}
- Môn học: ${pl1Subject}
- Khối lớp: ${grade}
- Năm học: ${academicYear}
- Số lớp: ${pl1ClassesCount}
- Số học sinh: ${pl1StudentsCount}
- Số giáo viên trong tổ: ${pl1TeachersCount}
- Thiết bị dạy học: ${pl1Equipment}

DỰ KIẾN PHÂN PHỐI CHƯƠNG TRÌNH & CHUYÊN ĐỀ DẠY HỌC:
${pl1CurriculumInput}

YÊU CẦU ĐẦU RA:
1. Trình bày đầy đủ Phụ lục I với các mục tiêu kiến thức và phân phối chương trình chi tiết.
2. Trình bày bảng Thiết bị dạy học và Thiết bị phòng học bộ môn.
3. Kế hoạch kiểm tra đánh giá định kỳ rõ ràng.`;
    } else if (tab === 'phuluc2') {
      if (!pl2ActivityInput.trim()) {
        showToast('warning', 'Thầy vui lòng nhập các chủ đề/hoạt động giáo dục dự kiến!');
        return '';
      }
      promptText = `Bạn là tổ trưởng chuyên môn Toán cấp THPT. Hãy tạo "KẾ HOẠCH TỔ CHỨC CÁC HOẠT ĐỘNG GIÁO DỤC CỦA TỔ CHUYÊN MÔN" theo đúng format Phụ lục II của Công văn số 05/SGDĐT-GDPT ngày 04 tháng 01 năm 2021.

THÔNG TIN ĐẦU VÀO:
- Trường: ${schoolName}
- Tổ chuyên môn: ${departmentName}
- Khối lớp: ${grade}
- Năm học: ${academicYear}

DỮ LIỆU HOẠT ĐỘNG GIÁO DỤC DỰ KIẾN:
${pl2ActivityInput}

YÊU CẦU ĐẦU RA:
Hãy lập bảng kế hoạch chi tiết cho các hoạt động giáo dục của khối lớp (chủ đề, yêu cầu cần đạt, số tiết, thời điểm, địa điểm, chủ trì, phối hợp, điều kiện thực hiện).`;
    } else if (tab === 'phuluc3') {
      if (!topics.trim()) {
        showToast('warning', 'Thầy vui lòng nhập các chủ đề kiến thức cần kiểm tra!');
        return '';
      }
      promptText = `Bạn là tổ trưởng chuyên môn Toán cấp THPT. Hãy lập Khung Ma trận và Bản đặc tả đề kiểm tra môn Toán theo đúng chuẩn Công văn 3175/BGDĐT-GDTrH.

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
    }
    setGeneratedPrompt(promptText);
    return promptText;
  };

  const handleGeneratePromptClick = () => {
    const prompt = handleGeneratePrompt(activeTab);
    if (prompt) {
      setRightTab('prompt');
      showToast('success', 'Đã tổng hợp cấu trúc Lệnh Prompt thành công!');
    }
  };

  const handleCallAIAssistant = async () => {
    const prompt = handleGeneratePrompt(activeTab);
    if (!prompt) return;

    setIsGenerating(true);
    setAiResponse('');
    setRightTab('preview');
    showToast('info', 'Trợ lý AI đang xử lý lập kế hoạch chuyên sâu... ⚙️');

    try {
      const planTypeMap: Record<string, string> = {
        phuluc1: 'APPENDIX1',
        phuluc2: 'APPENDIX2',
        phuluc3: 'APPENDIX3',
        pdf2latex: 'PDF2LATEX',
      };

      const res = await fetch('/api/plan-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: planTypeMap[activeTab],
          inputData: prompt,
          referenceSource: referenceSource,
          locale: locale,
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setAiResponse(data.result);
        showToast('success', 'Trợ lý AI đã xuất bản kế hoạch thành công! 🚀');
      } else {
        throw new Error(data.error || 'Gặp sự cố khi sinh tài liệu.');
      }
    } catch (error: any) {
      console.error(error);
      showToast('error', error.message || 'Lỗi kết nối API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    showToast('info', 'Đã sao chép Lệnh Prompt vào khay nhớ tạm!');
  };

  const handleCopyResult = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    showToast('success', 'Đã sao chép toàn bộ bản kế hoạch AI vào khay nhớ tạm!');
  };

  const handleCallPdfToLatex = async () => {
    if (!pdfFile) {
      showToast('warning', 'Vui lòng chọn một tệp PDF!');
      return;
    }

    setIsGenerating(true);
    setAiResponse('');
    setRightTab('result'); // Default to raw code so they can see the LaTeX code
    showToast('info', 'Trợ lý AI đang phân tích PDF và trích xuất LaTeX... ⏳');

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('addSolutions', addSolutions.toString());
      formData.append('locale', locale);

      const res = await fetch('/api/pdf2latex', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setAiResponse(data.result);
        showToast('success', 'Trích xuất PDF sang LaTeX thành công! 🚀');
      } else {
        throw new Error(data.error || 'Gặp sự cố khi xử lý PDF.');
      }
    } catch (error: any) {
      console.error(error);
      showToast('error', error.message || 'Lỗi kết nối API PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToBank = async () => {
    if (!aiResponse) return;
    try {
      showToast('info', 'Đang lưu vào Ngân hàng đề...');
      const docRef = await addDoc(collection(db, 'olympic_nganhang'), {
        title: 'Trích xuất từ PDF - ' + (pdfFile?.name || 'Tài liệu mới'),
        latexCode: aiResponse,
        createdAt: serverTimestamp(),
        source: 'AI Assistant',
        topic: 'Chưa phân loại'
      });
      showToast('success', `Đã lưu thành công! (ID: ${docRef.id})`);
    } catch (error) {
      console.error('Lỗi khi lưu vào Firestore:', error);
      showToast('error', 'Lỗi khi lưu vào Ngân hàng đề.');
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER */}
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-md">
                {t('title')}
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                {t('subtitle')}
              </h1>
            </div>
            <button 
              onClick={() => router.push('/teacher/dashboard')} 
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          {/* THANH ĐIỀU HƯỚNG TAB */}
          <div className="bg-white/70 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200/50 flex flex-wrap gap-2">
            <button 
              onClick={() => { setActiveTab('phuluc1'); setGeneratedPrompt(''); setAiResponse(''); }} 
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'phuluc1' ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t('tabPhuLuc1')}
            </button>
            <button 
              onClick={() => { setActiveTab('phuluc2'); setGeneratedPrompt(''); setAiResponse(''); }} 
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'phuluc2' ? 'bg-emerald-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t('tabPhuLuc2')}
            </button>
            <button 
              onClick={() => { setActiveTab('phuluc3'); setGeneratedPrompt(''); setAiResponse(''); }} 
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'phuluc3' ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t('tabPhuLuc3')}
            </button>
            <button 
              onClick={() => { setActiveTab('pdf2latex'); setGeneratedPrompt(''); setAiResponse(''); }} 
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'pdf2latex' ? 'bg-orange-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t('tabPdf2Latex')}
            </button>
          </div>

          {/* NỘI DUNG CHÍNH (HAI CỘT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT TRÁI: FORM ĐẦU VÀO */}
            <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 h-fit">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                  {activeTab === 'phuluc1' && 'Thông số Kế hoạch dạy học'}
                  {activeTab === 'phuluc2' && 'Thông số Tổ chức hoạt động'}
                  {activeTab === 'phuluc3' && 'Thông số Ma trận đề thi'}
                  {activeTab === 'pdf2latex' && 'Cấu hình Trích xuất PDF'}
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  Cung cấp các thông tin cơ bản để AI lập kế hoạch
                </p>
              </div>

              {/* THÔNG TIN CHUNG */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Đơn vị hành chính</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Trường:</label>
                    <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Tổ chuyên môn:</label>
                    <input type="text" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Năm học:</label>
                    <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 text-center" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Khối lớp:</label>
                    <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                      <option>Khối 10</option>
                      <option>Khối 11</option>
                      <option>Khối 12</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* INPUT CỦA PHỤ LỤC 1 */}
              {activeTab === 'phuluc1' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Môn học:</label>
                      <input type="text" value={pl1Subject} onChange={(e) => setPl1Subject(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Số lượng giáo viên:</label>
                      <input type="number" value={pl1TeachersCount} onChange={(e) => setPl1TeachersCount(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:border-indigo-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tổng số lớp học:</label>
                      <input type="number" value={pl1ClassesCount} onChange={(e) => setPl1ClassesCount(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tổng số học sinh:</label>
                      <input type="number" value={pl1StudentsCount} onChange={(e) => setPl1StudentsCount(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:border-indigo-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Thiết bị dạy học chủ đạo:</label>
                    <input type="text" value={pl1Equipment} onChange={(e) => setPl1Equipment(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Dự kiến phân bổ chương trình:</label>
                    <textarea 
                      value={pl1CurriculumInput} 
                      onChange={(e) => setPl1CurriculumInput(e.target.value)} 
                      placeholder="VD: Chương 1: Hàm số lượng giác (15 tiết) - Yêu cầu nhận biết các dạng đồ thị. Chương 2: Tổ hợp và xác suất (20 tiết) - Sử dụng Excel giải bài toán thống kê..." 
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* INPUT CỦA PHỤ LỤC 2 */}
              {activeTab === 'phuluc2' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Dự kiến hoạt động giáo dục / Ngoại khóa:</label>
                    <textarea 
                      value={pl2ActivityInput} 
                      onChange={(e) => setPl2ActivityInput(e.target.value)} 
                      placeholder="VD: 1. Câu lạc bộ Đỉnh cao toán học: Trải nghiệm thực tế đo đạc khoảng cách, thời điểm tuần 12, địa điểm sân bóng, chủ trì Thầy Hùng, phối hợp thầy cô tổ Lý.&#10;2. Ngày hội khoa học STEM: Chế tạo mô hình khối tròn xoay, tuần 20..." 
                      className="w-full h-44 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-400 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* INPUT CỦA PHỤ LỤC 3 */}
              {activeTab === 'phuluc3' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kỳ thi:</label>
                      <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-400">
                        <option>Kiểm tra Thường xuyên (15p)</option>
                        <option>Kiểm tra Giữa kỳ I</option>
                        <option>Kiểm tra Cuối kỳ I</option>
                        <option>Kiểm tra Giữa kỳ II</option>
                        <option>Kiểm tra Cuối kỳ II</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Thời lượng làm bài:</label>
                      <select value={examDuration} onChange={(e) => setExamDuration(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-400">
                        <option>15 phút</option>
                        <option>45 phút</option>
                        <option>90 phút</option>
                        <option>120 phút</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tỷ lệ độ khó (NB-TH-VD-VDC):</label>
                      <select value={ratio} onChange={(e) => setRatio(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-400">
                        <option>4-3-2-1</option>
                        <option>3-4-2-1</option>
                        <option>5-3-1-1</option>
                        <option>2-3-3-2 (Mũi nhọn)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nguồn dữ liệu đối chiếu:</label>
                      <input type="text" value={referenceSource} onChange={(e) => setReferenceSource(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mạch kiến thức cần kiểm tra:</label>
                    <textarea 
                      value={topics} 
                      onChange={(e) => setTopics(e.target.value)} 
                      placeholder="VD: Chương 1: Hàm số lượng giác và Phương trình lượng giác; Chương 2: Cấp số cộng, cấp số nhân..." 
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* INPUT CỦA PDF TO LATEX */}
              {activeTab === 'pdf2latex' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tệp PDF đầu vào:</label>
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="addSolutions" 
                      checked={addSolutions} 
                      onChange={(e) => setAddSolutions(e.target.checked)}
                      className="mt-1 w-4 h-4 text-orange-600 rounded border-orange-300 focus:ring-orange-500"
                    />
                    <div>
                      <label htmlFor="addSolutions" className="text-xs font-black text-orange-800 uppercase tracking-wider block cursor-pointer">Tự động bổ sung lời giải chi tiết</label>
                      <p className="text-[10px] font-medium text-orange-600 mt-0.5">AI sẽ tự động giải các bài toán và bọc trong môi trường {"\\begin{solution}"}. Lưu ý: Việc này có thể mất nhiều thời gian hơn.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* NÚT TÁC VỤ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activeTab !== 'pdf2latex' ? (
                  <button 
                    onClick={handleGeneratePromptClick}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex justify-center items-center gap-1.5"
                  >
                    ⚡ Sinh Lệnh Copy
                  </button>
                ) : (
                  <div className="hidden sm:block"></div>
                )}
                <button 
                  onClick={activeTab === 'pdf2latex' ? handleCallPdfToLatex : handleCallAIAssistant}
                  disabled={isGenerating}
                  className={`w-full py-3.5 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex justify-center items-center gap-1.5 disabled:opacity-50 ${
                    activeTab === 'pdf2latex' ? 'bg-orange-600 hover:bg-orange-700 sm:col-span-1' :
                    activeTab === 'phuluc1' ? 'bg-indigo-600 hover:bg-indigo-700' : 
                    activeTab === 'phuluc2' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isGenerating ? 'AI đang xử lý... ⏳' : activeTab === 'pdf2latex' ? 'Trích xuất mã LaTeX 🚀' : 'Gửi Trợ lý AI Xử lý 🚀'}
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: KẾT QUẢ PROMPT & AI PLAN RESULT */}
            <div className="lg:col-span-7 flex flex-col h-full space-y-4">
              
              {/* TAB CHUYỂN ĐỔI BÊN PHẢI */}
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit flex gap-1">
                <button 
                  onClick={() => setRightTab('result')}
                  className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${rightTab === 'result' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  📄 {activeTab === 'pdf2latex' ? 'Mã LaTeX Gốc' : 'Bản Kế Hoạch AI sinh ra'}
                </button>
                <button 
                  onClick={() => setRightTab('preview')}
                  className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${rightTab === 'preview' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  👁️ Xem Trước (Preview)
                </button>
                <button 
                  onClick={() => setRightTab('prompt')}
                  className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${rightTab === 'prompt' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  📋 Lệnh Prompt trích xuất
                </button>
              </div>

              {/* PANEL HIỂN THỊ CHÍNH */}
              <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 flex-1 flex flex-col min-h-[500px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full pointer-events-none"></div>

                {rightTab === 'prompt' ? (
                  <div className="flex flex-col h-full flex-1">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
                      <div>
                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Cấu trúc Lệnh Prompt</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Sao chép để tự dán vào các chatbot ngoài</p>
                      </div>
                      <button 
                        onClick={handleCopyPrompt} 
                        disabled={!generatedPrompt}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-lg transition-colors disabled:opacity-50"
                      >
                        📋 Copy Lệnh
                      </button>
                    </div>
                    <div className="flex-1 bg-slate-950/40 rounded-2xl p-4 border border-slate-800/80">
                      <textarea 
                        readOnly 
                        value={generatedPrompt} 
                        placeholder="Thầy vui lòng nhập nội dung ở bên trái rồi bấm 'Sinh Lệnh Copy'..."
                        className="w-full h-[400px] bg-transparent text-emerald-400 font-mono text-[12px] leading-relaxed resize-none focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full flex-1">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
                      <div>
                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                          {rightTab === 'preview' ? 'Bản xem trước trực quan' : activeTab === 'pdf2latex' ? 'Mã LaTeX trích xuất' : 'Bản kế hoạch giáo dục số'}
                        </h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Kết quả sinh tự động từ Gemini AI</p>
                      </div>
                      <div className="flex gap-2">
                        {activeTab === 'pdf2latex' && (
                          <button 
                            onClick={handleSaveToBank} 
                            disabled={!aiResponse}
                            className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 text-[10px] font-black uppercase rounded-lg transition-colors disabled:opacity-50"
                          >
                            💾 Lưu Ngân Hàng Đề
                          </button>
                        )}
                        <button 
                          onClick={handleCopyResult} 
                          disabled={!aiResponse}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-black uppercase rounded-lg transition-colors disabled:opacity-50"
                        >
                          📋 Copy Bản Kế Hoạch
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 bg-slate-950/40 rounded-2xl p-5 border border-slate-800/80 overflow-y-auto max-h-[500px]">
                      {isGenerating ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 text-slate-500 font-bold">
                          <span className="text-4xl animate-spin block">⚙️</span>
                          <p className="text-xs uppercase tracking-widest text-indigo-300 animate-pulse">Trợ lý AI đang thu thập dữ liệu chuyên môn và lập kế hoạch...</p>
                        </div>
                      ) : aiResponse ? (
                        rightTab === 'preview' ? (
                          <article className="prose prose-invert prose-sm max-w-none text-slate-300 text-[13px] leading-relaxed overflow-x-auto p-2">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {aiResponse
                                .replace(/^```[a-z]*\n?/gi, '')
                                .replace(/\n?```$/gi, '')
                                .replace(/[\s\S]*?\\begin{document}/, '')
                                .replace(/\\end{document}[\s\S]*/, '')
                                .replace(/\\section\*{([^}]+)}/gi, '## $1\n')
                                .replace(/\\subsection\*{([^}]+)}/gi, '### $1\n')
                                .replace(/\\begin{question}/gi, '### ❓ Câu hỏi:\n')
                                .replace(/\\end{question}/gi, '\n---\n')
                                .replace(/\\begin{solution}/gi, '#### 💡 Lời giải:\n')
                                .replace(/\\end{solution}/gi, '\n')
                                .replace(/\\begin{enumerate}/gi, '')
                                .replace(/\\end{enumerate}/gi, '')
                                .replace(/\\begin{itemize}/gi, '')
                                .replace(/\\end{itemize}/gi, '')
                                .replace(/\\item/gi, '- ')
                                .replace(/\\textbf{([^}]+)}/gi, '**$1**')
                                .replace(/\\textit{([^}]+)}/gi, '*$1*')
                                .replace(/\\begin{align\*?}/gi, '$$\\begin{aligned}')
                                .replace(/\\end{align\*?}/gi, '\\end{aligned}$$')
                                .replace(/\\begin{equation\*?}/gi, '$$')
                                .replace(/\\end{equation\*?}/gi, '$$')
                                .replace(/\\\[/g, '$$')
                                .replace(/\\\]/g, '$$')
                                .replace(/\\\(/g, '$')
                                .replace(/\\\)/g, '$')}
                            </ReactMarkdown>
                          </article>
                        ) : (
                          <textarea 
                            readOnly 
                            value={aiResponse.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '')} 
                            className="w-full h-full min-h-[400px] bg-transparent text-emerald-400 font-mono text-[12px] leading-relaxed resize-none focus:outline-none"
                          />
                        )
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-500 font-bold space-y-2 opacity-65">
                          <span className="text-4xl">📄</span>
                          <p className="text-xs uppercase tracking-widest">Kế hoạch AI sẽ được xuất bản tại đây</p>
                          <p className="text-[10px] text-slate-600 font-medium">Bấm "Gửi Trợ lý AI Xử lý" ở cột trái để tạo dữ liệu</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-start gap-2.5">
                  <span className="text-sm">💡</span>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    <span className="font-bold text-slate-300">Hướng dẫn nhanh:</span> Thầy có thể sinh prompt để copy dán ngoài, hoặc bấm <strong className="text-white">Gửi Trợ lý AI Xử lý</strong> để hệ thống tự động thiết lập và trình bày bản kế hoạch đúng quy chuẩn ngay tại giao diện này.
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