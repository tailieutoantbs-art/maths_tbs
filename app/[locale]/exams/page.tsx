'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface MatrixRow {
  id: string;
  topic: string;
  mcq_nb: number; mcq_th: number; mcq_vd: number;
  tf_nb: number; tf_th: number; tf_vd: number;
  sa_nb: number; sa_th: number; sa_vd: number;
}

export default function QuestionBankPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'matrix' | 'exams2025' | 'ai_generator'>('list');
  const [questions, setQuestions] = useState<any[]>([]);
  const [exams2025, setExams2025] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State cho việc thêm câu hỏi mới
  const [questionType, setQuestionType] = useState('MCQ');
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [level, setLevel] = useState('Nhận biết');
  const [topic, setTopic] = useState('Giải tích 12');
  
  // Matrix State
  const [matrixTitle, setMatrixTitle] = useState('Đề Khảo sát Toán theo cấu trúc CV 7991');
  const [matrixGrade, setMatrixGrade] = useState('12');
  const [matrixDuration, setMatrixDuration] = useState('90');
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([
    { id: '1', topic: 'Giải tích 12', mcq_nb: 2, mcq_th: 1, mcq_vd: 1, tf_nb: 1, tf_th: 0, tf_vd: 0, sa_nb: 0, sa_th: 1, sa_vd: 0 }
  ]);
  const [generatedExam, setGeneratedExam] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Tải danh sách câu hỏi từ Firebase
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuestions(data);
    } catch (error) {
      showToast('error', 'Lỗi kết nối đến Ngân hàng đề thi.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExams2025 = async () => {
    try {
      const q = query(collection(db, 'exams_2025'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExams2025(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchExams2025();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cosodulieuhungtbs';
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dlqjlzekw';
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        showToast('success', 'Đã tải đồ thị lên đám mây thành công!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      showToast('error', 'Lỗi tải ảnh. Vui lòng kiểm tra lại thiết lập máy chủ.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      showToast('warning', 'Vui lòng nhập nội dung câu hỏi!');
      return;
    }
    try {
      await addDoc(collection(db, 'cauhoi_nganhang'), {
        question: questionText,
        imageUrl: imageUrl,
        options: questionType === 'MCQ' ? options : null,
        correctAnswer: correctAnswer,
        level: level,
        topic: topic,
        type: questionType === 'MCQ' ? 'Trắc nghiệm' : questionType,
        createdBy: 'Giáo viên TBS',
        createdAt: serverTimestamp()
      });
      
      showToast('success', 'Đã lưu câu hỏi vào Ngân hàng V2!');
      setQuestionText('');
      setImageUrl('');
      setOptions({ A: '', B: '', C: '', D: '' });
      setActiveTab('list');
      fetchQuestions();
    } catch (error) {
      showToast('error', 'Lỗi khi lưu dữ liệu!');
    }
  };

  const addMatrixRow = () => {
    setMatrixRows([...matrixRows, {
      id: Date.now().toString(),
      topic: 'Chuyên đề mới',
      mcq_nb: 0, mcq_th: 0, mcq_vd: 0,
      tf_nb: 0, tf_th: 0, tf_vd: 0,
      sa_nb: 0, sa_th: 0, sa_vd: 0
    }]);
  };

  const removeMatrixRow = (id: string) => {
    setMatrixRows(matrixRows.filter(r => r.id !== id));
  };

  const updateMatrixRow = (id: string, field: keyof MatrixRow, value: string | number) => {
    setMatrixRows(matrixRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const generateExamFromMatrix = async () => {
    setIsGenerating(true);
    setGeneratedExam(null);
    try {
      const q = query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allQ = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const selectedQuestions: any[] = [];
      const warnings: string[] = [];

      matrixRows.forEach(row => {
        const pool = allQ.filter((q: any) => q.topic?.toLowerCase().includes(row.topic.toLowerCase()));
        
        const extract = (typeLabel: string, levelLabel: string, count: number) => {
          if (count <= 0) return;
          const matches = pool.filter((q: any) => {
            const isMatchLevel = q.level === levelLabel;
            let isMatchType = false;
            if (typeLabel === 'MCQ' && (q.type === 'MCQ' || q.type === 'Trắc nghiệm')) isMatchType = true;
            if (typeLabel === 'TF' && q.type === 'TF') isMatchType = true;
            if (typeLabel === 'SA' && q.type === 'SA') isMatchType = true;
            return isMatchLevel && isMatchType;
          }).sort(() => 0.5 - Math.random());

          if (matches.length < count) {
            warnings.push(`Chuyên đề "${row.topic}" thiếu ${count - matches.length} câu ${typeLabel} (${levelLabel}).`);
          }
          selectedQuestions.push(...matches.slice(0, count));
        };

        extract('MCQ', 'Nhận biết', row.mcq_nb);
        extract('MCQ', 'Thông hiểu', row.mcq_th);
        extract('MCQ', 'Vận dụng', row.mcq_vd);

        extract('TF', 'Nhận biết', row.tf_nb);
        extract('TF', 'Thông hiểu', row.tf_th);
        extract('TF', 'Vận dụng', row.tf_vd);

        extract('SA', 'Nhận biết', row.sa_nb);
        extract('SA', 'Thông hiểu', row.sa_th);
        extract('SA', 'Vận dụng', row.sa_vd);
      });

      if (warnings.length > 0) {
        showToast('warning', `Thiếu hụt dữ liệu kho: \n${warnings.join('\n')}`);
      }

      if (selectedQuestions.length === 0) {
        showToast('error', 'Không tìm thấy câu hỏi nào phù hợp với ma trận!');
        setIsGenerating(false);
        return;
      }

      setGeneratedExam({
        title: matrixTitle,
        grade: matrixGrade,
        duration: matrixDuration,
        questions: selectedQuestions
      });
      
      showToast('success', `Đã bốc thành công ${selectedQuestions.length} câu hỏi theo ma trận!`);
    } catch (e) {
      showToast('error', 'Lỗi khởi tạo đề thi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishToArena = async () => {
    if (!generatedExam) return;
    try {
      const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      await addDoc(collection(db, 'game_rooms'), {
        pin: pinCode,
        title: generatedExam.title,
        mode: 'Ma Trận CV 7991',
        targetClass: 'Tất cả',
        duration: Number(generatedExam.duration),
        status: 'waiting',
        currentQuestionIndex: 0,
        showAnswer: false,
        createdAt: serverTimestamp(),
        players: [],
        questions: generatedExam.questions
      });
      showToast('success', `Đã phát sóng Phòng Thi! Mã PIN: ${pinCode}`);
      router.push(`/games/host?pin=${pinCode}`);
    } catch (error) {
      showToast('error', 'Lỗi phát sóng.');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || '';
        if (encoded.length % 4 > 0) encoded += '='.repeat(4 - (encoded.length % 4));
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerateExamAI = async () => {
    if (!aiTopic.trim() && !aiFile) {
      showToast('warning', 'Vui lòng nhập nội dung, Link hoặc tải File lên!');
      return;
    }
    setAiIsGenerating(true);
    setAiResult(null);

    let fileData = '';
    let mimeType = '';
    if (aiFile) {
      try {
        fileData = await fileToBase64(aiFile);
        mimeType = aiFile.type;
      } catch (error) {
        showToast('error', 'Lỗi đọc file!');
        setAiIsGenerating(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/generate-exam-multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          fileData,
          mimeType,
          aiStructure: []
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setAiResult({
        title: 'Đề Sinh Tự Động Từ AI',
        grade: '12',
        duration: '90',
        questions: data.result,
        stats: {
          mcq: data.result.filter((q:any) => q.type==='MCQ').length,
          tf: data.result.filter((q:any) => q.type==='TF').length,
          sa: data.result.filter((q:any) => q.type==='SA').length
        }
      });
      showToast('success', 'Đã khởi tạo đề thành công!');
    } catch(e: any) {
      showToast('error', e.message || 'Lỗi kết nối AI');
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleSaveAiResult = async () => {
    if (!aiResult) return;
    try {
      await addDoc(collection(db, 'exams_2025'), {
        ...aiResult,
        createdAt: serverTimestamp()
      });
      showToast('success', 'Đã lưu đề thi AI vào danh sách!');
      setAiResult(null);
      setAiTopic('');
      setAiFile(null);
      setActiveTab('exams2025');
      fetchExams2025();
    } catch(e) {
      showToast('error', 'Lỗi khi lưu đề thi.');
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                Phân hệ Lưu trữ Chuyên môn
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2">
                Trung Tâm Khảo Thí & Ngân Hàng Đề
              </h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors">
                ⬅ Về Dashboard
              </button>
            </div>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
            <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'list' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              📚 Kho Câu Hỏi
            </button>
            <button onClick={() => setActiveTab('exams2025')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'exams2025' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-orange-500'}`}>
              📄 Đề Thi AI 2025
            </button>
            <button onClick={() => setActiveTab('add')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>
              ✍️ Thêm Câu Hỏi Mới
            </button>
            <button onClick={() => setActiveTab('matrix')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'matrix' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:text-rose-600'}`}>
              🎯 Tạo Đề Từ Ma Trận (CV 7991)
            </button>
            <button onClick={() => setActiveTab('ai_generator')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'ai_generator' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:text-cyan-600'}`}>
              🤖 Tạo Đề AI (File/Ảnh)
            </button>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[600px] relative">
            
            {/* TAB: DANH SÁCH ĐỀ THI 2025 */}
            {activeTab === 'exams2025' && (
              <div className="space-y-4 animate-fadeIn">
                 <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-lg font-black text-slate-700 uppercase tracking-wider">Danh Sách Đề Thi 2025 (Đã Lưu)</h2>
                  <span className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full">Tổng: {exams2025.length} đề</span>
                </div>
                {exams2025.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="text-4xl mb-4">🗂️</div>
                    Chưa có đề thi nào được tạo và lưu từ công cụ Tạo Đề 2025.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams2025.map((exam) => (
                      <div key={exam.id} className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                              Đề Thi Toán 2025
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {exam.createdAt ? new Date(exam.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa tạo'}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-slate-800 mb-2 leading-snug line-clamp-2">
                            {exam.title || 'Đề thi chưa đặt tên'}
                          </h3>
                          <div className="space-y-1 mb-6">
                            <p className="text-xs font-bold text-slate-500">Phần I: {exam.stats?.mcq || 0} câu</p>
                            <p className="text-xs font-bold text-slate-500">Phần II: {exam.stats?.tf || 0} câu</p>
                            <p className="text-xs font-bold text-slate-500">Phần III: {exam.stats?.sa || 0} câu</p>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t pt-4">
                          <button onClick={() => alert('Đang phát triển xem chi tiết đề...')} className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 uppercase">Xem / Sửa</button>
                          <button onClick={() => alert('Đang phát triển tính năng In Đề PDF...')} className="flex-1 py-2 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-700 uppercase shadow-md shadow-indigo-200">In Đề PDF</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: KHO CÂU HỎI */}
            {activeTab === 'list' && (
              <div className="space-y-4 animate-fadeIn">
                 <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-lg font-black text-slate-700 uppercase tracking-wider">Danh sách dữ liệu đã số hóa</h2>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">Tổng: {questions.length} câu</span>
                </div>
                {isLoading ? (
                  <div className="py-20 text-center animate-pulse text-slate-400 font-bold">Đang truy xuất dữ liệu từ máy chủ...</div>
                ) : questions.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    Kho lưu trữ trống. Thầy hãy chuyển sang tab "Thêm Câu Hỏi Mới".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 uppercase">{q.type === 'MCQ' || q.type === 'Trắc nghiệm' ? 'MCQ' : q.type} | {q.level}</span>
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase">{q.topic}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 mb-3 overflow-x-auto">
                          <BlockMath math={q.question || ''} />
                        </div>
                        {q.imageUrl && (
                          <div className="w-full h-24 relative mb-3 bg-white rounded border border-slate-200 flex items-center justify-center p-1">
                             <img src={q.imageUrl} alt="Đồ thị" className="max-h-full object-contain" />
                          </div>
                        )}
                        {q.options && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                            <div className={`p-1.5 rounded ${q.correctAnswer === 'A' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>A. {q.options.A}</div>
                            <div className={`p-1.5 rounded ${q.correctAnswer === 'B' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>B. {q.options.B}</div>
                            <div className={`p-1.5 rounded ${q.correctAnswer === 'C' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>C. {q.options.C}</div>
                            <div className={`p-1.5 rounded ${q.correctAnswer === 'D' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>D. {q.options.D}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: THÊM CÂU HỎI MỚI */}
            {activeTab === 'add' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                <div className="space-y-5">
                  <h2 className="text-lg font-black text-indigo-700 uppercase tracking-wider border-b border-indigo-50 pb-2">Soạn thảo nội dung</h2>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Định dạng (CV 7991):</label>
                      <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                        <option value="MCQ">Trắc nghiệm nhiều lựa chọn (MCQ)</option>
                        <option value="TF">Đúng/Sai (TF)</option>
                        <option value="SA">Trả lời ngắn (SA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Chuyên đề:</label>
                      <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Độ khó:</label>
                      <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                        <option>Nhận biết</option>
                        <option>Thông hiểu</option>
                        <option>Vận dụng</option>
                        <option>Vận dụng cao</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nội dung câu hỏi (LaTeX):</label>
                    <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none resize-none" />
                  </div>

                  <div>
                    <label className="cursor-pointer px-4 py-2.5 bg-slate-100 border-2 border-dashed rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 flex w-fit">
                      {isUploading ? 'Đang tải... ⏳' : '📤 Tải Đồ thị (Ảnh)'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                    </label>
                  </div>
                  
                  {questionType === 'MCQ' && (
                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-3">Các phương án đáp án:</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <div key={opt} className="flex bg-slate-50 border rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-slate-200 font-black text-xs">{opt}</div>
                            <input type="text" value={options[opt as keyof typeof options]} onChange={(e) => setOptions({...options, [opt]: e.target.value})} className="w-full px-3 py-3 text-sm font-medium bg-transparent focus:outline-none" />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 pt-3">Đáp án đúng:</label>
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <button key={opt} onClick={() => setCorrectAnswer(opt)} className={`w-10 h-10 rounded-xl font-black ${correctAnswer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(questionType === 'TF' || questionType === 'SA') && (
                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Đáp án đúng (Kết quả chính xác):</label>
                      <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Nhập kết quả cuối cùng..." className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold focus:outline-none" />
                    </div>
                  )}

                  <button onClick={handleSaveQuestion} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase rounded-xl shadow-lg mt-4">
                    💾 Lưu vào Kho
                  </button>
                </div>
                
                <div className="bg-slate-900 rounded-3xl p-6 shadow-inner text-white h-fit sticky top-6">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Bản xem trước</h3>
                  <div className="text-lg font-medium leading-relaxed overflow-x-auto text-slate-100">
                    {questionText ? <BlockMath math={questionText} /> : <span className="text-slate-600 italic text-sm">Hiển thị tại đây...</span>}
                  </div>
                  {imageUrl && <img src={imageUrl} alt="Preview" className="max-h-40 mt-4 rounded-xl object-contain bg-white p-2" />}
                </div>
              </div>
            )}

            {/* TAB 3: MA TRẬN CV 7991 */}
            {activeTab === 'matrix' && (
              <div className="animate-fadeIn space-y-6">
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-rose-700 uppercase mb-1">Tên Kỳ thi / Mã đề:</label>
                    <input type="text" value={matrixTitle} onChange={(e) => setMatrixTitle(e.target.value)} className="w-full p-3 bg-white border border-rose-200 rounded-xl font-bold focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-rose-700 uppercase mb-1">Lớp:</label>
                    <select value={matrixGrade} onChange={(e) => setMatrixGrade(e.target.value)} className="w-full p-3 bg-white border border-rose-200 rounded-xl font-bold focus:outline-none">
                      <option>10</option><option>11</option><option>12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-rose-700 uppercase mb-1">Thời gian (Phút):</label>
                    <input type="number" value={matrixDuration} onChange={(e) => setMatrixDuration(e.target.value)} className="w-full p-3 bg-white border border-rose-200 rounded-xl font-bold focus:outline-none" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-4" rowSpan={2}>Chuyên đề (Topic)</th>
                          <th className="p-2 border-l border-slate-600 text-center" colSpan={3}>Phần 1: Trắc nghiệm (MCQ)</th>
                          <th className="p-2 border-l border-slate-600 text-center bg-slate-700" colSpan={3}>Phần 2: Đúng/Sai (TF)</th>
                          <th className="p-2 border-l border-slate-600 text-center" colSpan={3}>Phần 3: Trả lời ngắn (SA)</th>
                          <th className="p-4 border-l border-slate-600" rowSpan={2}></th>
                        </tr>
                        <tr className="bg-slate-700">
                          <th className="p-2 text-center border-l border-slate-600">NB</th><th className="p-2 text-center">TH</th><th className="p-2 text-center">VD</th>
                          <th className="p-2 text-center border-l border-slate-600 bg-slate-600">NB</th><th className="p-2 text-center bg-slate-600">TH</th><th className="p-2 text-center bg-slate-600">VD</th>
                          <th className="p-2 text-center border-l border-slate-600">NB</th><th className="p-2 text-center">TH</th><th className="p-2 text-center">VD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matrixRows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 border-r border-slate-100">
                              <input type="text" value={row.topic} onChange={(e) => updateMatrixRow(row.id, 'topic', e.target.value)} className="w-40 md:w-full p-2 bg-slate-100 rounded-lg text-xs font-bold focus:outline-none" />
                            </td>
                            {/* MCQ */}
                            <td className="p-2 text-center"><input type="number" min="0" value={row.mcq_nb} onChange={(e) => updateMatrixRow(row.id, 'mcq_nb', Number(e.target.value))} className="w-12 text-center bg-slate-100 rounded p-1" /></td>
                            <td className="p-2 text-center"><input type="number" min="0" value={row.mcq_th} onChange={(e) => updateMatrixRow(row.id, 'mcq_th', Number(e.target.value))} className="w-12 text-center bg-slate-100 rounded p-1" /></td>
                            <td className="p-2 text-center border-r border-slate-100"><input type="number" min="0" value={row.mcq_vd} onChange={(e) => updateMatrixRow(row.id, 'mcq_vd', Number(e.target.value))} className="w-12 text-center bg-slate-100 rounded p-1" /></td>
                            {/* TF */}
                            <td className="p-2 text-center bg-amber-50/30"><input type="number" min="0" value={row.tf_nb} onChange={(e) => updateMatrixRow(row.id, 'tf_nb', Number(e.target.value))} className="w-12 text-center bg-white border border-amber-200 rounded p-1" /></td>
                            <td className="p-2 text-center bg-amber-50/30"><input type="number" min="0" value={row.tf_th} onChange={(e) => updateMatrixRow(row.id, 'tf_th', Number(e.target.value))} className="w-12 text-center bg-white border border-amber-200 rounded p-1" /></td>
                            <td className="p-2 text-center border-r border-slate-100 bg-amber-50/30"><input type="number" min="0" value={row.tf_vd} onChange={(e) => updateMatrixRow(row.id, 'tf_vd', Number(e.target.value))} className="w-12 text-center bg-white border border-amber-200 rounded p-1" /></td>
                            {/* SA */}
                            <td className="p-2 text-center bg-emerald-50/30"><input type="number" min="0" value={row.sa_nb} onChange={(e) => updateMatrixRow(row.id, 'sa_nb', Number(e.target.value))} className="w-12 text-center bg-white border border-emerald-200 rounded p-1" /></td>
                            <td className="p-2 text-center bg-emerald-50/30"><input type="number" min="0" value={row.sa_th} onChange={(e) => updateMatrixRow(row.id, 'sa_th', Number(e.target.value))} className="w-12 text-center bg-white border border-emerald-200 rounded p-1" /></td>
                            <td className="p-2 text-center bg-emerald-50/30"><input type="number" min="0" value={row.sa_vd} onChange={(e) => updateMatrixRow(row.id, 'sa_vd', Number(e.target.value))} className="w-12 text-center bg-white border border-emerald-200 rounded p-1" /></td>
                            
                            <td className="p-3 text-center">
                              <button onClick={() => removeMatrixRow(row.id)} className="text-rose-500 hover:text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded">X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <button onClick={addMatrixRow} className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs">+ Thêm Chuyên Đề</button>
                    <button onClick={generateExamFromMatrix} disabled={isGenerating} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase shadow-md transition-all">
                      {isGenerating ? 'Đang duyệt kho...' : '⚙️ Tự động Bốc Đề Từ Ma Trận'}
                    </button>
                  </div>
                </div>

                {generatedExam && (
                  <div className="bg-emerald-50 border-2 border-emerald-400 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-3">
                      <h3 className="font-black text-emerald-800 text-lg">Phôi Đề Thành Công: {generatedExam.title}</h3>
                      <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold">Gồm {generatedExam.questions.length} câu</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                      {generatedExam.questions.map((q: any, i: number) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-emerald-200 text-xs flex gap-2 items-start">
                          <span className="font-black text-emerald-600 whitespace-nowrap">Câu {i+1} [{q.type} - {q.level}]:</span>
                          <span className="truncate overflow-hidden font-mono" title={q.question}>{q.question}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 flex gap-4">
                      <button onClick={publishToArena} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-600/30">
                        🚀 Khởi tạo Phòng Thi / Đấu Trường ngay
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: TẠO ĐỀ AI (MULTIMODAL) */}
            {activeTab === 'ai_generator' && (
              <div className="animate-fadeIn space-y-6">
                <div className="bg-cyan-50 border border-cyan-200 p-6 rounded-3xl gap-6 flex flex-col md:flex-row">
                  <div className="flex-1 space-y-4">
                    <h2 className="text-lg font-black text-cyan-800 uppercase tracking-wider border-b border-cyan-200 pb-2">1. Dữ Liệu Nguồn</h2>
                    <div>
                      <label className="block text-xs font-black text-cyan-700 uppercase mb-2">Tải Lên File (PDF, Hình Ảnh):</label>
                      <input 
                        type="file" 
                        accept="application/pdf,image/png,image/jpeg,image/webp" 
                        onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200 cursor-pointer"
                      />
                      {aiFile && <p className="mt-2 text-xs font-medium text-cyan-600">Đã chọn: {aiFile.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-black text-cyan-700 uppercase mb-2">Hoặc Nhập Nội Dung / Link / Yêu cầu cụ thể:</label>
                      <textarea 
                        value={aiTopic} 
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Nhập yêu cầu sinh đề, hoặc paste Link/nội dung văn bản vào đây..." 
                        className="w-full h-32 p-4 bg-white border border-cyan-200 rounded-xl text-sm focus:outline-none resize-none shadow-inner" 
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 flex flex-col justify-end">
                    <button 
                      onClick={handleGenerateExamAI} 
                      disabled={aiIsGenerating} 
                      className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl uppercase tracking-widest shadow-lg transition-all disabled:opacity-50"
                    >
                      {aiIsGenerating ? 'AI đang phân tích... ⏳' : '✨ Yêu Cầu AI Khởi Tạo'}
                    </button>
                  </div>
                </div>

                {aiResult && (
                  <div className="bg-white border-2 border-cyan-200 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-black text-slate-800 text-lg">Kết Quả Phân Tích & Sinh Đề</h3>
                      <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-lg text-xs font-bold">Tổng: {aiResult.questions.length} câu</span>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                      {aiResult.questions.map((q: any, i: number) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-cyan-700 uppercase text-xs">Câu {i+1} [{q.type}]</span>
                          </div>
                          <div className="font-medium text-slate-800 mb-3 whitespace-pre-wrap"><BlockMath math={q.content || ''} /></div>
                          {q.type === 'MCQ' && q.options && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt: string, idx: number) => (
                                <div key={idx} className={`p-2 rounded ${String(q.correctAnswer) === String(idx) ? 'bg-cyan-100 text-cyan-800 font-bold border border-cyan-300' : 'bg-white border border-slate-200'}`}>{opt}</div>
                              ))}
                            </div>
                          )}
                          {q.type === 'TF' && q.statements && (
                            <div className="space-y-2 text-xs">
                              {q.statements.map((st: any, idx: number) => (
                                <div key={idx} className="flex justify-between p-2 bg-white border border-slate-200 rounded">
                                  <span>{st.text}</span>
                                  <span className={`font-bold ${st.isTrue ? 'text-emerald-600' : 'text-rose-600'}`}>{st.isTrue ? 'Đúng' : 'Sai'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'SA' && (
                            <div className="mt-2 text-xs p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-bold">
                              Đáp án: {q.correctAnswer}
                            </div>
                          )}
                          <details className="mt-3 text-xs">
                            <summary className="cursor-pointer font-bold text-slate-500 hover:text-slate-700">Xem lời giải chi tiết</summary>
                            <div className="mt-2 p-3 bg-white border border-slate-200 rounded text-slate-600 whitespace-pre-wrap">
                              {q.explanation || 'Không có lời giải.'}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 flex gap-4">
                      <button onClick={() => setAiResult(null)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm uppercase transition-colors">
                        Hủy Bỏ
                      </button>
                      <button onClick={handleSaveAiResult} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-sm uppercase tracking-widest shadow-md">
                        💾 Lưu Thành Đề Thi 2025
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </AuthGuard>
  );
}