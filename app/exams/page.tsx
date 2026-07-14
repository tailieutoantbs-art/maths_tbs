'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function QuestionBankPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State cho việc thêm câu hỏi mới
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [level, setLevel] = useState('Nhận biết');
  const [topic, setTopic] = useState('Giải tích 12');

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

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Xử lý tải đồ thị lên máy chủ lưu trữ ảnh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Kết nối trực tiếp vào luồng lưu trữ tài liệu nội bộ
      formData.append('upload_preset', 'TAILIEUTBS');

      // Thay YOUR_CLOUD_NAME bằng tên Cloudinary của thầy trong cấu hình thực tế
      const res = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
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

  // Lưu câu hỏi vào Firestore
  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      showToast('warning', 'Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    try {
      await addDoc(collection(db, 'cauhoi_nganhang'), {
        question: questionText,
        imageUrl: imageUrl,
        options: options,
        correctAnswer: correctAnswer,
        level: level,
        topic: topic,
        type: 'Trắc nghiệm',
        createdBy: 'Giáo viên TBS',
        createdAt: serverTimestamp()
      });
      
      showToast('success', 'Đã lưu câu hỏi vào Ngân hàng V2!');
      // Reset form
      setQuestionText('');
      setImageUrl('');
      setOptions({ A: '', B: '', C: '', D: '' });
      setActiveTab('list');
      fetchQuestions();
    } catch (error) {
      showToast('error', 'Lỗi khi lưu dữ liệu!');
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER TRUNG TÂM */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                Phân hệ Lưu trữ Chuyên môn
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2">
                Ngân Hàng Đề Thi V2 - TBS
              </h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          {/* TAB CHUYỂN ĐỔI */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'list' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              📚 Kho Câu Hỏi
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              ✍️ Thêm Câu Hỏi Mới
            </button>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[600px] relative">
            
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
                    Kho lưu trữ trống. Thầy hãy chuyển sang tab "Thêm Câu Hỏi Mới" nhé.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 uppercase">Câu {idx + 1} | {q.level}</span>
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase">{q.topic}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 mb-3 overflow-x-auto">
                          <BlockMath math={q.question} />
                        </div>
                        {q.imageUrl && (
                          <div className="w-full h-24 relative mb-3 bg-white rounded border border-slate-200 flex items-center justify-center p-1">
                             <img src={q.imageUrl} alt="Đồ thị" className="max-h-full object-contain" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                          <div className={`p-1.5 rounded ${q.correctAnswer === 'A' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>A. {q.options.A}</div>
                          <div className={`p-1.5 rounded ${q.correctAnswer === 'B' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>B. {q.options.B}</div>
                          <div className={`p-1.5 rounded ${q.correctAnswer === 'C' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>C. {q.options.C}</div>
                          <div className={`p-1.5 rounded ${q.correctAnswer === 'D' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-white border border-slate-200'}`}>D. {q.options.D}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: THÊM CÂU HỎI MỚI */}
            {activeTab === 'add' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                {/* Khu vực Nhập liệu */}
                <div className="space-y-5">
                  <h2 className="text-lg font-black text-indigo-700 uppercase tracking-wider border-b border-indigo-50 pb-2">Soạn thảo nội dung</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Chuyên đề:</label>
                      <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Độ khó:</label>
                      <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400">
                        <option>Nhận biết</option>
                        <option>Thông hiểu</option>
                        <option>Vận dụng</option>
                        <option>Vận dụng cao</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nội dung câu hỏi (Hỗ trợ mã LaTeX):</label>
                    <textarea 
                      value={questionText} 
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="VD: Tính đạo hàm của hàm số $y = x^2$..." 
                      className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-400 resize-none"
                    />
                  </div>

                  {/* Khu vực Upload Hình ảnh / Đồ thị */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Đính kèm Đồ thị / Hình vẽ (Tùy chọn):</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer px-4 py-2.5 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 hover:border-slate-400 transition-all flex items-center gap-2">
                        {isUploading ? 'Đang đẩy lên mây... ⏳' : '📤 Chọn file ảnh (png, jpg)'}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                      </label>
                      {imageUrl && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Đã tải ảnh thành công ✓</span>}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Các phương án đáp án:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt} className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50">
                          <div className="px-4 py-3 bg-slate-200 text-slate-600 font-black text-xs">{opt}</div>
                          <input 
                            type="text" 
                            value={options[opt as keyof typeof options]}
                            onChange={(e) => setOptions({...options, [opt]: e.target.value})}
                            className="w-full px-3 py-3 text-sm font-medium bg-transparent focus:outline-none" 
                            placeholder={`Nội dung ${opt}`} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Đáp án đúng:</label>
                    <div className="flex gap-3">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <button 
                          key={opt}
                          onClick={() => setCorrectAnswer(opt)}
                          className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${correctAnswer === opt ? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveQuestion}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase rounded-xl tracking-widest shadow-lg active:translate-y-1 active:shadow-none transition-all mt-4"
                  >
                    💾 Lưu vào Ngân Hàng Đề Thi
                  </button>
                </div>

                {/* Khu vực Xem trước (Preview) */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-inner text-white h-fit sticky top-6">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Bản xem trước hiển thị</h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded uppercase">{level}</span>
                      <span className="text-[10px] font-black bg-slate-700 text-slate-300 px-2 py-1 rounded uppercase">{topic}</span>
                    </div>
                    
                    <div className="text-lg font-medium leading-relaxed overflow-x-auto text-slate-100">
                      {questionText ? <BlockMath math={questionText} /> : <span className="text-slate-600 italic text-sm">Nội dung câu hỏi sẽ hiển thị tại đây...</span>}
                    </div>

                    {imageUrl && (
                      <div className="bg-white rounded-xl p-2 w-full h-40 flex items-center justify-center overflow-hidden">
                        <img src={imageUrl} alt="Preview" className="max-h-full object-contain" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt} className={`p-3 rounded-xl border-2 text-sm font-medium ${correctAnswer === opt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          <strong className="mr-2 text-white">{opt}.</strong> 
                          {options[opt as keyof typeof options] || '...'}
                        </div>
                      ))}
                    </div>
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