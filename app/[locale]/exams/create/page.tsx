'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [examId, setExamId] = useState(`MATH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [grade, setGrade] = useState('12');
  const [duration, setDuration] = useState(90);
  const [loading, setLoading] = useState(false);
  
  // Crop Image State
  const [showCropModal, setShowCropModal] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [croppedBase64, setCroppedBase64] = useState('');

  // AI Generation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiStructure, setAiStructure] = useState<{round: string, count: number, level: string}[]>([
    { round: 'round1', count: 4, level: 'Nhận biết' },
    { round: 'round2', count: 2, level: 'Thông hiểu' },
    { round: 'round3', count: 2, level: 'Vận dụng' }
  ]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiMode, setAiMode] = useState<'api' | 'manual'>('api');
  const [manualJson, setManualJson] = useState('');

  React.useEffect(() => {
    import('mathlive').then((ml) => {
      if (ml.MathfieldElement) {
        ml.MathfieldElement.fontsDirectory = '/mathlive-fonts';
        ml.MathfieldElement.soundsDirectory = '/mathlive-sounds';
      }
    }).catch(console.error);
  }, []);

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
    if (!title || questions.length === 0 || !examId) {
      alert("Vui lòng nhập Mã đề, Tiêu đề và ít nhất 1 câu hỏi.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'exams_2025'), {
        examId,
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

  // Logic xử lý Cắt ảnh
  React.useEffect(() => {
    if (!showCropModal) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
            const blob = e.clipboardData.items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => setImgSrc(event.target?.result as string);
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showCropModal]);

  const getCroppedImg = () => {
    if (!completedCrop || !imgRef.current) return;
    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
    const base64Image = canvas.toDataURL('image/jpeg');
    setCroppedBase64(`![Hình ảnh đồ thị](${base64Image})`);
  };

  const processAiResult = (dataArray: any[]) => {
    const formattedQuestions: Question[] = dataArray.map((aiQ: any, index: number) => {
      const qMap: any = {
        id: Date.now() + index,
        type: aiQ.type,
        content: aiQ.content || "",
        explanation: aiQ.explanation || "",
        mcqOptions: { A: '', B: '', C: '', D: '' },
        mcqCorrect: 'A',
        tfOptions: [
          { id: 'a', text: '', isTrue: true },
          { id: 'b', text: '', isTrue: true },
          { id: 'c', text: '', isTrue: true },
          { id: 'd', text: '', isTrue: true },
        ],
        saCorrect: '',
        laGuide: ''
      };

      if (aiQ.type === 'MCQ') {
        if (aiQ.options && Array.isArray(aiQ.options)) {
          qMap.mcqOptions = {
            A: aiQ.options[0]?.replace(/^A\.\s*/, '') || '',
            B: aiQ.options[1]?.replace(/^B\.\s*/, '') || '',
            C: aiQ.options[2]?.replace(/^C\.\s*/, '') || '',
            D: aiQ.options[3]?.replace(/^D\.\s*/, '') || '',
          };
        }
        const mapIndexToChar = ['A', 'B', 'C', 'D'];
        const correctIndex = parseInt(aiQ.correctAnswer) || 0;
        qMap.mcqCorrect = mapIndexToChar[correctIndex] || 'A';
      } 
      else if (aiQ.type === 'TF') {
        if (aiQ.statements && Array.isArray(aiQ.statements)) {
          qMap.tfOptions = aiQ.statements.map((st: any) => ({
            id: st.id || 'a',
            text: st.text || '',
            isTrue: st.isTrue === true || st.isTrue === 'true'
          }));
        }
      } 
      else if (aiQ.type === 'SA') {
        qMap.saCorrect = aiQ.correctAnswer || '';
      }

      return qMap as Question;
    });

    setQuestions(prev => [...prev, ...formattedQuestions]);
    setShowAiModal(false);
    alert('Đã sinh đề thành công!');
  };

  const generatePromptString = () => {
    let reqR1 = aiStructure.filter((x: any) => x.round === 'round1').map((x: any) => `- ${x.count} câu mức độ ${x.level}`).join('\n');
    let reqR2 = aiStructure.filter((x: any) => x.round === 'round2').map((x: any) => `- ${x.count} câu mức độ ${x.level}`).join('\n');
    let reqR3 = aiStructure.filter((x: any) => x.round === 'round3').map((x: any) => `- ${x.count} câu mức độ ${x.level}`).join('\n');

    let reqStr = "";
    if(reqR1) reqStr += "\n\nPHẦN I (Trắc nghiệm 4 lựa chọn):\n" + reqR1;
    if(reqR2) reqStr += "\n\nPHẦN II (Trắc nghiệm Đúng/Sai):\n" + reqR2;
    if(reqR3) reqStr += "\n\nPHẦN III (Trả lời ngắn):\n" + reqR3;

    if(!reqStr) reqStr = "\n\n- Không có yêu cầu cụ thể, vui lòng bóc tách toàn bộ tài liệu nguồn.";

    return `Bạn là một chuyên gia toán học và giáo viên THPT. Hãy sinh ra một bộ đề thi môn Toán theo ĐÚNG cấu trúc năm 2025 từ Yêu cầu/Chủ đề/Nội dung sau:
NỘI DUNG YÊU CẦU: ${aiTopic}

CẤU TRÚC SỐ LƯỢNG VÀ MỨC ĐỘ YÊU CẦU:
${reqStr}

QUY TẮC ĐỊNH DẠNG DỮ LIỆU BẮT BUỘC:
1. TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON MẢNG CÁC CÂU HỎI (Không kèm markdown, không giải thích gì bên ngoài JSON).
2. TẤT CẢ công thức Toán học phải chuẩn LaTeX và được bọc trong dấu $...$ hoặc $$...$$. 
3. CHÚ Ý QUAN TRỌNG: Vì trả về chuỗi JSON, BẮT BUỘC NHÂN ĐÔI DẤU GẠCH CHÉO NGƯỢC (ví dụ: \\\\frac, \\\\log, \\\\sqrt, \\\\mathbb{R}) để JSON.parse không bị lỗi.
4. Phần "explanation" (Lời giải chi tiết): Trình bày khoa học, ngắt ý rõ ràng bằng \\n\\n.

CHUẨN ĐẦU RA JSON (Array of objects):
[
  {
    "id": "tạo_id_ngẫu_nhiên",
    "type": "MCQ",
    "content": "Nội dung câu hỏi trắc nghiệm...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "0", // index của đáp án đúng (0, 1, 2, 3)
    "explanation": "Lời giải chi tiết..."
  },
  {
    "id": "tạo_id_ngẫu_nhiên",
    "type": "TF",
    "content": "Nội dung/Ngữ cảnh chung của câu hỏi Đúng/Sai...",
    "statements": [
      { "id": "a", "text": "Ý a...", "isTrue": true },
      { "id": "b", "text": "Ý b...", "isTrue": false },
      { "id": "c", "text": "Ý c...", "isTrue": true },
      { "id": "d", "text": "Ý d...", "isTrue": false }
    ],
    "explanation": "Lời giải chi tiết cho 4 ý..."
  },
  {
    "id": "tạo_id_ngẫu_nhiên",
    "type": "SA",
    "content": "Nội dung câu hỏi trả lời ngắn...",
    "correctAnswer": "Đáp án",
    "explanation": "Lời giải chi tiết..."
  }
]`;
  };

  const handleManualAI = () => {
    try {
      if (!manualJson) return alert('Vui lòng dán dữ liệu JSON từ AI!');
      let cleanJson = manualJson;
      if (cleanJson.startsWith('\`\`\`json')) {
        cleanJson = cleanJson.replace(/\`\`\`json\n/g, '').replace(/\`\`\`/g, '');
      } else if (cleanJson.startsWith('\`\`\`')) {
        cleanJson = cleanJson.replace(/\`\`\`\n/g, '').replace(/\`\`\`/g, '');
      }
      const parsedData = JSON.parse(cleanJson.trim());
      processAiResult(parsedData);
      setManualJson('');
    } catch (err: any) {
      alert('Lỗi biên dịch JSON: ' + err.message);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic) return alert('Vui lòng nhập chủ đề!');
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/generate-exam-2025', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          aiStructure: aiStructure
        })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        processAiResult(data.result);
      } else {
        throw new Error(data.error || 'Lỗi sinh đề');
      }
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
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
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowAiModal(true)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase flex items-center gap-2 hover:scale-105">
                <span>🤖</span> Sinh Đề AI
              </button>
              <button onClick={() => setShowCropModal(true)} className="px-5 py-2.5 bg-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-200 transition-all text-xs uppercase flex items-center gap-1 shadow-sm border border-rose-200">
                <span>✂️</span> Cắt Ảnh
              </button>
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

          {/* TIÊU ĐỀ & MÃ ĐỀ & THÔNG TIN CHUNG */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tiêu Đề Bài Thi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg font-black text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner"
                  placeholder="VD: Kiểm tra Giữa kỳ 1 Toán 12..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mã Đề (Exam ID)</label>
                <input
                  type="text"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value.toUpperCase())}
                  className="w-full text-lg font-black text-blue-600 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner text-center uppercase"
                  placeholder="VD: MATH-1234"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Khối Lớp</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold shadow-inner focus:outline-none">
                  <option value="10">Lớp 10</option>
                  <option value="11">Lớp 11</option>
                  <option value="12">Lớp 12</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Thời gian (Phút)</label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm font-bold shadow-inner"
                />
              </div>
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
                    <math-field
                      math-virtual-keyboard-policy="manual"
                      value={q.saCorrect}
                      onInput={(e: any) => updateQuestionCommon(index, 'saCorrect', e.target.value)}
                      className="w-full md:w-1/3 p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm font-bold text-emerald-700"
                    ></math-field>
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

      {/* CROP IMAGE MODAL */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-rose-100">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-rose-500 uppercase tracking-widest">✂️ Studio Cắt Ảnh Nhanh</h3>
              <button onClick={() => setShowCropModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-700 font-black">X</button>
            </div>
            
            <div className="space-y-6">
              {!imgSrc ? (
                <div className="border-4 border-dashed border-rose-200 rounded-3xl p-12 text-center bg-rose-50/50">
                  <span className="text-4xl block mb-4">📋</span>
                  <p className="text-sm font-black text-rose-500 uppercase tracking-widest mb-2">Nhấn Ctrl+V để dán ảnh vào đây</p>
                  <p className="text-xs font-bold text-slate-400">Hỗ trợ dán trực tiếp từ Zalo, Word hoặc phím PrintScreen</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 overflow-auto max-h-[50vh] border-2 border-slate-200 rounded-2xl bg-slate-50">
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
                      <img src={imgSrc} ref={imgRef} alt="Ảnh gốc" className="max-w-full" />
                    </ReactCrop>
                  </div>
                  <div className="w-full md:w-80 space-y-4">
                    <button onClick={getCroppedImg} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-colors">
                      📸 Cắt & Trích Xuất
                    </button>
                    {croppedBase64 && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase">Mã nhúng Markdown (Copy dán vào câu hỏi):</label>
                        <textarea readOnly value={croppedBase64} className="w-full h-32 p-3 bg-slate-800 text-rose-300 font-mono text-[10px] rounded-xl focus:outline-none" />
                        <button onClick={() => {
                          navigator.clipboard.writeText(croppedBase64);
                          alert('Đã copy mã nhúng!');
                        }} className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase rounded-xl">
                          Copy Mã
                        </button>
                      </div>
                    )}
                    <button onClick={() => { setImgSrc(''); setCroppedBase64(''); }} className="w-full py-2 bg-white border-2 border-slate-200 text-slate-500 font-bold text-xs uppercase rounded-xl hover:bg-slate-50">
                      Tải ảnh khác
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATOR MODAL */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-lg w-full text-slate-800 relative border-4 border-blue-100"
            >
              <h2 className="text-2xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
                🤖 AI Tự Động Sinh Đề 2025
              </h2>
              <div className="flex gap-2 border-b pb-4 mb-4">
                <button 
                  onClick={() => setAiMode('api')} 
                  className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-colors ${aiMode === 'api' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  ⚡ API Trực Tiếp
                </button>
                <button 
                  onClick={() => setAiMode('manual')} 
                  className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-colors ${aiMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  📝 Dán Dữ Liệu
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase mb-2">Chủ đề / Yêu cầu</label>
                  <input 
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="VD: Cực trị hàm số bậc 3"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold shadow-inner"
                    disabled={isGeneratingAi}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black text-slate-600 uppercase">Cấu Trúc Sinh Đề</label>
                    <button 
                      onClick={() => setAiStructure([...aiStructure, { round: 'round1', count: 1, level: 'Nhận biết' }])}
                      className="px-3 py-1 bg-slate-100 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200"
                      disabled={isGeneratingAi}
                    >
                      + Thêm Lệnh
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {aiStructure.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 w-6 text-center">{idx+1}</span>
                        
                        <input 
                          type="number" min={1} value={rule.count} 
                          onChange={e => {
                            const newArr = [...aiStructure];
                            newArr[idx].count = Number(e.target.value);
                            setAiStructure(newArr);
                          }}
                          className="w-14 p-2 text-center text-xs font-bold border rounded-lg focus:outline-none"
                          disabled={isGeneratingAi}
                        />
                        
                        <select 
                          value={rule.round}
                          onChange={e => {
                            const newArr = [...aiStructure];
                            newArr[idx].round = e.target.value;
                            setAiStructure(newArr);
                          }}
                          className="flex-[2] p-2 text-xs font-bold border rounded-lg focus:outline-none"
                          disabled={isGeneratingAi}
                        >
                          <option value="round1">P1. Trắc nghiệm</option>
                          <option value="round2">P2. Đúng/Sai</option>
                          <option value="round3">P3. Trả lời ngắn</option>
                        </select>
                        
                        <select 
                          value={rule.level}
                          onChange={e => {
                            const newArr = [...aiStructure];
                            newArr[idx].level = e.target.value;
                            setAiStructure(newArr);
                          }}
                          className="flex-[2] p-2 text-xs font-bold border rounded-lg focus:outline-none"
                          disabled={isGeneratingAi}
                        >
                          <option value="Nhận biết">Nhận biết</option>
                          <option value="Thông hiểu">Thông hiểu</option>
                          <option value="Vận dụng">Vận dụng</option>
                          <option value="Vận dụng cao">Vận dụng cao</option>
                        </select>

                        <button 
                          onClick={() => {
                            const newArr = [...aiStructure];
                            newArr.splice(idx, 1);
                            setAiStructure(newArr);
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"
                          disabled={isGeneratingAi}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {aiStructure.length === 0 && (
                      <div className="text-center p-4 text-xs text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed">
                        Chưa có lệnh sinh đề nào
                      </div>
                    )}
                  </div>
                </div>

                {aiMode === 'manual' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(generatePromptString()); alert('Đã sao chép câu lệnh Prompt!'); }} className="flex-1 py-2 border-2 border-indigo-400 bg-white text-indigo-600 font-black text-xs rounded-xl hover:bg-indigo-50">Copy Lệnh</button>
                        <button onClick={() => window.open('https://gemini.google.com/', '_blank')} className="flex-1 py-2 bg-slate-700 text-white font-black text-xs rounded-xl hover:bg-slate-800">Mở Web AI</button>
                      </div>
                      <textarea 
                        readOnly 
                        value={generatePromptString()} 
                        className="w-full h-24 p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-mono outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">Dán Kết Quả JSON (từ AI)</label>
                      <textarea 
                        value={manualJson}
                        onChange={(e) => setManualJson(e.target.value)}
                        placeholder="Dán nội dung JSON vào đây..."
                        className="w-full h-28 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none resize-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t mt-4">
                  <button 
                    onClick={() => setShowAiModal(false)}
                    disabled={isGeneratingAi}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors uppercase text-xs"
                  >
                    Đóng
                  </button>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAi}
                    className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isGeneratingAi ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang sáng tác...</span>
                      </>
                    ) : (
                      '⚡ Bắt Đầu Sinh Đề'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AuthGuard>
  );
}