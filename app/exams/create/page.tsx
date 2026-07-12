'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Định nghĩa kiểu dữ liệu cho từng loại câu hỏi
interface Question {
  id: number;
  type: 'MCQ' | 'TF' | 'SA' | 'LA';
  content: string; // Nội dung câu hỏi (hỗ trợ LaTeX)
  mcqOptions: { A: string; B: string; C: string; D: string };
  mcqCorrect: string;
  tfOptions: { id: string; text: string; isTrue: boolean }[];
  saCorrect: string;
  laGuide: string; // Hướng dẫn chấm tự luận
}

export default function CreateExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('12');
  const [duration, setDuration] = useState(90);
  const [loading, setLoading] = useState(false);
  
  // Khởi tạo danh sách câu hỏi với 1 câu MCQ mặc định
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: Date.now(),
      type: 'MCQ',
      content: '',
      mcqOptions: { A: '', B: '', C: '', D: '' },
      mcqCorrect: 'A',
      tfOptions: [
        { id: 'a', text: '', isTrue: true },
        { id: 'b', text: '', isTrue: true },
        { id: 'c', text: '', isTrue: true },
        { id: 'd', text: '', isTrue: true },
      ],
      saCorrect: '',
      laGuide: '',
    }
  ]);

  // Hàm thêm câu hỏi mới
  const addQuestion = (type: 'MCQ' | 'TF' | 'SA' | 'LA') => {
    setQuestions([...questions, {
      id: Date.now() + Math.random(),
      type,
      content: '',
      mcqOptions: { A: '', B: '', C: '', D: '' },
      mcqCorrect: 'A',
      tfOptions: [
        { id: 'a', text: '', isTrue: true },
        { id: 'b', text: '', isTrue: true },
        { id: 'c', text: '', isTrue: true },
        { id: 'd', text: '', isTrue: true },
      ],
      saCorrect: '',
      laGuide: '',
    }]);
  };

  // Hàm xóa câu hỏi
  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  // Hàm cập nhật trường dữ liệu chung của câu hỏi
  const updateQuestionCommon = (index: number, key: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [key]: value };
    setQuestions(updated);
  };

  // Hàm cập nhật tùy chọn cho MCQ
  const updateMcqOption = (index: number, label: 'A' | 'B' | 'C' | 'D', value: string) => {
    const updated = [...questions];
    updated[index].mcqOptions[label] = value;
    setQuestions(updated);
  };

  // Hàm cập nhật tùy chọn cho Đúng/Sai (TF)
  const updateTfOption = (qIndex: number, optIndex: number, field: 'text' | 'isTrue', value: any) => {
    const updated = [...questions];
    updated[qIndex].tfOptions[optIndex] = { ...updated[qIndex].tfOptions[optIndex], [field]: value };
    setQuestions(updated);
  };

  // Lưu đề thi lên Firebase
  const handleSaveExam = async () => {
    if (!title.trim()) {
      alert('Thầy vui lòng nhập Tên/Mã đề thi!');
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      await addDoc(collection(db, 'exams'), {
        title,
        grade,
        duration: Number(duration),
        totalQuestions: questions.length,
        questions: questions.map((q) => {
          // Lọc bớt các trường thừa tùy theo loại câu để database sạch sẽ
          const base = { type: q.type, content: q.content };
          if (q.type === 'MCQ') return { ...base, options: q.mcqOptions, correctAnswer: q.mcqCorrect };
          if (q.type === 'TF') return { ...base, subQuestions: q.tfOptions.map(o => ({ label: o.id, text: o.text, correctAnswer: o.isTrue })) };
          if (q.type === 'SA') return { ...base, correctAnswer: q.saCorrect };
          return { ...base, gradingGuide: q.laGuide };
        }),
        createdAt: serverTimestamp(),
      });

      alert('🎉 Khởi tạo ngân hàng đề thi thành công!');
      router.push('/exams');
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi đồng bộ dữ liệu đề thi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* HEADER TRẠM BIÊN SOẠN */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] uppercase tracking-wide">
                Trạm Soạn Thảo Đề Thi
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                Tổ hợp cấu trúc MCQ - TF - SA - LA | Toán TBS
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.back()} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase">
                Hủy
              </button>
              <button 
                onClick={handleSaveExam}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all text-xs uppercase tracking-wider"
              >
                {loading ? 'Đang đóng gói...' : '💾 Lưu Vào Ngân Hàng'}
              </button>
            </div>
          </div>

          {/* CẤU HÌNH THÔNG TIN CHUNG CỦA ĐỀ */}
          <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Tên đề / Mã đề thi:</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Đề khảo sát chất lượng Chương 1 - Mã 101"
                className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm font-bold shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Khối lớp:</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl text-sm font-bold shadow-inner focus:outline-none">
                <option value="10">Khối lớp 10</option>
                <option value="11">Khối lớp 11</option>
                <option value="12">Khối lớp 12</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Thời gian làm bài (Phút):</label>
              <input 
                type="number" 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm font-bold shadow-inner"
              />
            </div>
          </div>

          {/* DANH SÁCH CÂU HỎI */}
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl relative group">
                
                {/* THANH ĐIỀU HƯỚNG ĐẦU CÂU HỎI */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-sky-50">
                  <span className="text-sm font-black text-[#0284C7] uppercase tracking-wide">
                    Câu hỏi {index + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black bg-sky-100 text-[#0284C7] px-3 py-1 rounded-lg uppercase">
                      {q.type === 'MCQ' ? 'Trắc nghiệm 4 lựa chọn' : q.type === 'TF' ? 'Đúng / Sai' : q.type === 'SA' ? 'Trả lời ngắn' : 'Tự luận (LA)'}
                    </span>
                    <button 
                      onClick={() => removeQuestion(index)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-md transition-colors"
                    >
                      Xóa câu
                    </button>
                  </div>
                </div>

                {/* Ô NHẬP ĐỀ BÀI (HỖ TRỢ LA-TEX) */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nội dung câu hỏi (Nhập được công thức toán dạng $...$ hoặc $$...$$):</label>
                  <textarea 
                    rows={2}
                    value={q.content}
                    onChange={(e) => updateQuestionCommon(index, 'content', e.target.value)}
                    placeholder="VD: Cho hàm số $y=f(x)$ liên tục trên $\mathbb{R}$..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm font-medium shadow-sm"
                  />
                </div>

                {/* HIỂN THỊ BIẾN ĐỔI FORM THEO LOẠI CÂU HỎI */}
                
                {/* 1. ĐỊNH DẠNG MCQ */}
                {q.type === 'MCQ' && (
                  <div className="space-y-3 bg-sky-50/40 p-4 rounded-2xl border border-sky-100">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Các phương án nhiễu & Đáp án đúng:</p>
                    {['A', 'B', 'C', 'D'].map((label) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-500 w-4">{label}.</span>
                        <input 
                          type="text"
                          value={(q.mcqOptions as any)[label]}
                          onChange={(e) => updateMcqOption(index, label as any, e.target.value)}
                          placeholder={`Nội dung phương án ${label}`}
                          className="flex-grow p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => updateQuestionCommon(index, 'mcqCorrect', label)}
                          className={`px-3 py-2 text-xs font-black rounded-lg border transition-all ${q.mcqCorrect === label ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                        >
                          Chốt {label}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. ĐỊNH DẠNG ĐÚNG / SAI (TF) */}
                {q.type === 'TF' && (
                  <div className="space-y-3 bg-amber-50/30 p-4 rounded-2xl border border-amber-100">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Thiết lập 4 ý trắc nghiệm độc lập:</p>
                    {q.tfOptions.map((opt, optIdx) => (
                      <div key={opt.id} className="flex items-center gap-3">
                        <span className="font-black text-sm text-slate-500 w-6 uppercase">{opt.id})</span>
                        <input 
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateTfOption(index, optIdx, 'text', e.target.value)}
                          placeholder={`Nhập nội dung mệnh đề ý ${opt.id})`}
                          className="flex-grow p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none"
                        />
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={() => updateTfOption(index, optIdx, 'isTrue', true)}
                            className={`px-3 py-1.5 text-xs font-black rounded-lg border transition-all ${opt.isTrue ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'}`}
                          >
                            Đúng
                          </button>
                          <button 
                            type="button"
                            onClick={() => updateTfOption(index, optIdx, 'isTrue', false)}
                            className={`px-3 py-1.5 text-xs font-black rounded-lg border transition-all ${!opt.isTrue ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200'}`}
                          >
                            Sai
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. ĐỊNH DẠNG TRẢ LỜI NGẮN (SA) */}
                {q.type === 'SA' && (
                  <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Kết quả / Đáp số chính xác (Hệ thống tự động chấm điểm):</label>
                    <input 
                      type="text"
                      value={q.saCorrect}
                      onChange={(e) => updateQuestionCommon(index, 'saCorrect', e.target.value)}
                      placeholder="VD: 12 hoặc -1/2 hoặc Căn 3"
                      className="w-full md:w-1/3 p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm font-bold text-emerald-700"
                    />
                  </div>
                )}

                {/* 4. ĐỊNH DẠNG TỰ LUẬN TRÌNH BÀY CHI TIẾT (LA) */}
                {q.type === 'LA' && (
                  <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">Khung sườn đáp án / Hướng dẫn chấm (Dành cho giáo viên xem lại):</label>
                    <textarea 
                      rows={3}
                      value={q.laGuide}
                      onChange={(e) => updateQuestionCommon(index, 'laGuide', e.target.value)}
                      placeholder="Thầy nhập các bước biến đổi chính hoặc biểu điểm chấm tự luận tại đây..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm font-medium"
                    />
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* BÀN ĐIỀU KHIỂN THÊM CÂU HỎI MỚI */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-center items-center gap-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider sm:mr-2">Thêm câu hỏi tiếp theo:</span>
            <div className="flex flex-wrap gap-2 justify-center">
              <button onClick={() => addQuestion('MCQ')} className="px-4 py-2 bg-sky-100 text-[#0284C7] text-xs font-black rounded-xl hover:bg-sky-200 border border-sky-200 transition-all shadow-sm">+ Thêm MCQ</button>
              <button onClick={() => addQuestion('TF')} className="px-4 py-2 bg-amber-100 text-amber-700 text-xs font-black rounded-xl hover:bg-amber-200 border border-amber-200 transition-all shadow-sm">+ Thêm Đúng/Sai (TF)</button>
              <button onClick={() => addQuestion('SA')} className="px-4 py-2 bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl hover:bg-emerald-200 border border-emerald-200 transition-all shadow-sm">+ Thêm Trả lời ngắn (SA)</button>
              <button onClick={() => addQuestion('LA')} className="px-4 py-2 bg-purple-100 text-purple-700 text-xs font-black rounded-xl hover:bg-purple-200 border border-purple-200 transition-all shadow-sm">+ Thêm Tự luận (LA)</button>
            </div>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}