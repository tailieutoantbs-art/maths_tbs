'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function AdvancedExamsControlCenter() {
  const router = useRouter();
  const { showToast } = useToast();

  // --- TRẠNG THÁI HỆ THỐNG PHÂN TẦNG ---
  const [activeTab, setActiveTab] = useState<'create' | 'explorer' | 'matrix'>('explorer');

  // --- KHO DỮ LIỆU CHÍNH & BỘ LỌC TÌM KIẾM ---
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);
  const [isFetchingBank, setIsFetchingBank] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');

  // --- HỘP CHỌN CÂU HỎI ĐỂ TRÍCH XUẤT ĐỀ THI ---
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  
  // --- THÔNG SỐ ĐỀ THI ĐƯỢC XUẤT ---
  const [testTitle, setTestTitle] = useState('ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN - TBS');
  const [testDuration, setTestDuration] = useState(45);
  const [testCode, setTestCode] = useState('TBS-101');
  const [isPublishingTest, setIsPublishingTest] = useState(false);

  // --- CHỈNH SỬA TRỰC TIẾP TRÊN PHÔI ĐỀ THI (INLINE EDITING) ---
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState('');

  // ==========================================
  // STATE CỦA TAB 3: BIÊN SOẠN AI
  // ==========================================
  const [topic, setTopic] = useState('');
  const [examConfig, setExamConfig] = useState({
    MCQ: { count: 0, level: 'Thông hiểu' },
    TF: { count: 0, level: 'Thông hiểu' },
    SA: { count: 0, level: 'Vận dụng' },
    LA: { count: 0, level: 'Vận dụng cao' }
  });
  const [referenceSource, setReferenceSource] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // ==========================================
  // CÁC HÀM XỬ LÝ ĐÃ ĐƯỢC BỔ SUNG ĐẦY ĐỦ
  // ==========================================

  // Hàm cập nhật cấu hình cho Tab 3
  const updateConfig = (type: 'MCQ' | 'TF' | 'SA' | 'LA', field: 'count' | 'level', value: any) => {
    setExamConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: field === 'count' ? Number(value) : value }
    }));
  };

  // Hàm copy lệnh cho Tab 3
  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    showToast('info', 'Đã sao chép Prompt vào khay nhớ tạm!');
  };

  // Tải toàn bộ kho dữ liệu câu hỏi từ Firebase
  const loadBankQuestions = async () => {
    setIsFetchingBank(true);
    try {
      const q = query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBankQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      showToast('error', 'Không thể tải kho câu hỏi.');
    } finally {
      setIsFetchingBank(false);
    }
  };

  useEffect(() => {
    loadBankQuestions();
  }, []);

  // Bộ lọc thông minh thời gian thực (Real-time Multi-factor Filtering)
  useEffect(() => {
    let result = bankQuestions;

    if (filterType !== 'ALL') {
      result = result.filter(q => q.type === filterType);
    }
    if (filterLevel !== 'ALL') {
      result = result.filter(q => q.level === filterLevel);
    }
    if (searchTerm.trim() !== '') {
      result = result.filter(q => 
        (q.question && q.question.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.source && q.source.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredQuestions(result);
  }, [searchTerm, filterType, filterLevel, bankQuestions]);

  // Thống kê nhanh các chỉ số kho hàng (Data Analytics Counter)
  const getStats = () => {
    return {
      total: bankQuestions.length,
      mcq: bankQuestions.filter(q => q.type === 'MCQ').length,
      tf: bankQuestions.filter(q => q.type === 'TF').length,
      sa: bankQuestions.filter(q => q.type === 'SA').length,
      la: bankQuestions.filter(q => q.type === 'LA').length,
    };
  };

  const stats = getStats();

  // Chọn/Bỏ chọn câu hỏi để trích xuất đề
  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredQuestions.map(q => q.id);
    setSelectedQuestionIds(prev => {
      const uniqueIds = new Set([...prev, ...allFilteredIds]);
      return Array.from(uniqueIds);
    });
    showToast('success', `Đã chọn thêm ${filteredQuestions.length} câu vào phôi đề thi!`);
  };

  // Tính năng xóa câu hỏi lỗi thời khỏi kho hệ thống
  const handleDeleteQuestion = async (id: string) => {
    if(!window.confirm("Thầy có chắc chắn muốn xóa vĩnh viễn câu hỏi này khỏi kho lưu trữ?")) return;
    try {
      await deleteDoc(doc(db, 'cauhoi_nganhang', id));
      showToast('success', 'Đã xóa câu hỏi thành công.');
      setBankQuestions(prev => prev.filter(q => q.id !== id));
      setSelectedQuestionIds(prev => prev.filter(item => item !== id));
    } catch (error) {
      showToast('error', 'Xóa thất bại.');
    }
  };

  // Kích hoạt chế độ sửa nhanh nội dung câu hỏi bị lệch mã LaTeX
  const startInlineEdit = (id: string, currentText: string) => {
    setEditingQuestionId(id);
    setEditTextValue(currentText);
  };

  const saveInlineEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'cauhoi_nganhang', id), {
        question: editTextValue
      });
      showToast('success', 'Cập nhật mã nội dung thành công!');
      setBankQuestions(prev => prev.map(q => q.id === id ? { ...q, question: editTextValue } : q));
      setEditingQuestionId(null);
    } catch (error) {
      showToast('error', 'Không thể lưu chỉnh sửa.');
    }
  };

  // Tạo cấu trúc Prompt AI
  const handleGeneratePrompt = () => {
    if (!topic.trim()) { showToast('warning', 'Vui lòng điền chủ đề kiến thức!'); return; }
    let requestedTypes = [];
    let jsonTemplateExamples = [];

    if (examConfig.MCQ.count > 0) {
      requestedTypes.push(`- ${examConfig.MCQ.count} câu Trắc nghiệm 4 lựa chọn (MCQ) - Mức độ: ${examConfig.MCQ.level}`);
      jsonTemplateExamples.push(`  { "type": "MCQ", "question": "Nội dung câu hỏi chứa LaTeX", "level": "${examConfig.MCQ.level}", "options": { "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D" }, "correctAnswer": "A", "source": "Nguồn" }`);
    }
    if (examConfig.TF.count > 0) {
      requestedTypes.push(`- ${examConfig.TF.count} câu Trắc nghiệm Đúng/Sai (TF) - Mức độ: ${examConfig.TF.level}`);
      jsonTemplateExamples.push(`  { "type": "TF", "question": "Câu hỏi gốc chứa LaTeX", "level": "${examConfig.TF.level}", "statements": [ { "id": "a", "text": "Phát biểu a", "correct": true }, { "id": "b", "text": "Phát biểu b", "correct": false }, { "id": "c", "text": "Phát biểu c", "correct": true }, { "id": "d", "text": "Phát biểu d", "correct": false } ], "source": "Nguồn" }`);
    }
    if (examConfig.SA.count > 0) {
      requestedTypes.push(`- ${examConfig.SA.count} câu Trả lời ngắn (SA) - Mức độ: ${examConfig.SA.level}`);
      jsonTemplateExamples.push(`  { "type": "SA", "question": "Câu hỏi điền số chứa LaTeX", "level": "${examConfig.SA.level}", "correctAnswer": "Giá trị số", "source": "Nguồn" }`);
    }
    if (examConfig.LA.count > 0) {
      requestedTypes.push(`- ${examConfig.LA.count} câu Tự luận (LA) - Mức độ: ${examConfig.LA.level}`);
      jsonTemplateExamples.push(`  { "type": "LA", "question": "Câu tự luận chứa LaTeX", "level": "${examConfig.LA.level}", "correctAnswer": "Hướng dẫn giải chi tiết", "source": "Nguồn" }`);
    }

    const promptText = `Bạn là chuyên gia biên soạn đề thi môn Toán cấp THPT. Hãy tạo mảng JSON gồm các câu hỏi về chủ đề "${topic}".\nMA TRẬN YÊU CẦU:\n${requestedTypes.join('\n')}\nNGUỒN THAM CHIẾU:\n${referenceSource.trim() ? referenceSource : 'Chuẩn GDPT môn Toán.'}\n\nYÊU CẦU MÃ: Công thức Toán viết bằng LaTeX (Ví dụ: \\\\int x dx). Trả về duy nhất mảng JSON thuần không bọc markdown.\n\nCẤU TRÚC MẪU:\n[\n${jsonTemplateExamples.join(',\n')}\n]`;
    setGeneratedPrompt(promptText);
    showToast('success', 'Đã tạo xong Prompt cấu trúc ma trận!');
  };

  const handleParseJSON = () => {
    try {
      const cleanedInput = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedInput);
      setGeneratedQuestions(Array.isArray(parsedData) ? parsedData : [parsedData]);
      showToast('success', 'Dịch thành công cấu trúc câu hỏi!');
    } catch (error) {
      showToast('error', 'Lỗi định dạng JSON!');
    }
  };

  const handleSaveAllToBank = async () => {
    if (generatedQuestions.length === 0) return;
    try {
      for (const q of generatedQuestions) {
        await addDoc(collection(db, 'cauhoi_nganhang'), { ...q, createdAt: serverTimestamp() });
      }
      showToast('success', `Đã đồng bộ thành công ${generatedQuestions.length} câu vào hệ thống kho!`);
      setGeneratedQuestions([]);
      loadBankQuestions();
    } catch (error) {
      showToast('error', 'Trục trặc lưu kho.');
    }
  };

  // XUẤT ĐỀ THI VÀ GIAO CHO HỌC SINH
  const handlePublishExam = async () => {
    if (selectedQuestionIds.length === 0) {
      showToast('warning', 'Thầy chưa chọn câu hỏi nào để đóng gói đề thi!');
      return;
    }
    setIsPublishingTest(true);
    try {
      const selectedQuestionsDetails = bankQuestions.filter(q => selectedQuestionIds.includes(q.id));
      
      const examPayload = {
        title: testTitle,
        duration: testDuration,
        code: testCode,
        totalQuestions: selectedQuestionsDetails.length,
        questions: selectedQuestionsDetails,
        createdAt: serverTimestamp(),
        isActive: true
      };

      await addDoc(collection(db, 'dethi_phongthi'), examPayload);
      showToast('success', '🚀 Đề thi đã được xuất bản và đẩy sang Không Gian Rèn Luyện của học sinh!');
      setSelectedQuestionIds([]);
      setActiveTab('explorer');
    } catch (error) {
      showToast('error', 'Xuất bản đề thi thất bại.');
    } finally {
      setIsPublishingTest(false);
    }
  };


  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-700 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* --- TOP BRANDING HEADER --- */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                TRƯỜNG TH, THCS VÀ THPT THANH BÌNH
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2">
                Hệ Thống Điều Phối & Quản Trị Ngân Hàng Đề - TBS
              </h1>
            </div>
            <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm">
              ⬅ Về Dashboard
            </button>
          </div>

          {/* --- TẦNG BÁO CÁO CHỈ SỐ KHO TÀI NGUYÊN (ANALYTICS) --- */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Tổng Quy Mô Kho</span>
              <span className="text-2xl font-black text-blue-600 mt-2">{stats.total} <span className="text-xs font-normal text-slate-400">câu</span></span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Trắc Nghiệm (MCQ)</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.mcq}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Đúng / Sai (TF)</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.tf}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Trả Lời Ngắn (SA)</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.sa}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Tự Luận (LA)</span>
              <span className="text-xl font-black text-slate-700 mt-2">{stats.la}</span>
            </div>
          </div>

          {/* --- THANH TAB NAVEGATION HỆ THỐNG --- */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('explorer')} className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'explorer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              🗂️ 1. Khai Thác & Bộ Lọc Đa Tầng ({filteredQuestions.length})
            </button>
            <button onClick={() => setActiveTab('matrix')} className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all relative ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              🛠️ 2. Đóng Gói Phôi Đề & Xem Trước
              {selectedQuestionIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {selectedQuestionIds.length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('create')} className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase transition-all ${activeTab === 'create' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              🤖 3. Nạp Câu Hỏi Mới Bằng AI
            </button>
          </div>

          {/* ================= TAB 1: BỘ LỌC ĐA TẦNG VÀ KHAI THÁC NGÂN HÀNG ============= */}
          {activeTab === 'explorer' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Nhập từ khóa tìm kiếm..." 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 font-bold"
                  />
                </div>
                <div>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                    <option value="ALL">TẤT CẢ CÁC DẠNG</option>
                    <option value="MCQ">MCQ (4 Lựa chọn)</option>
                    <option value="TF">TF (Đúng/Sai)</option>
                    <option value="SA">SA (Đáp số ngắn)</option>
                    <option value="LA">LA (Tự luận cấu trúc)</option>
                  </select>
                </div>
                <div>
                  <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                    <option value="ALL">TẤT CẢ MỨC ĐỘ</option>
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSelectAllFiltered} disabled={filteredQuestions.length === 0} className="w-full md:w-auto px-4 py-2.5 bg-blue-50 text-blue-600 font-black text-xs uppercase rounded-xl border border-blue-200 hover:bg-blue-100 disabled:opacity-40">
                    ➕ Thêm tất cả kết quả vào đề
                  </button>
                </div>
              </div>

              {isFetchingBank ? (
                <div className="bg-white p-12 text-center rounded-2xl shadow-sm font-bold text-slate-400 animate-pulse">
                  Đang truy vấn cơ sở dữ liệu kho câu hỏi...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuestions.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q.id);
                    return (
                      <div key={q.id} className={`bg-white border p-5 rounded-2xl transition-all relative group flex flex-col justify-between ${isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:shadow-sm'}`}>
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : q.type === 'TF' ? 'bg-amber-100 text-amber-700' : q.type === 'SA' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                              {q.type}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">{q.level}</span>
                          </div>

                          <div className="text-sm font-medium text-slate-800 my-4 overflow-x-auto text-center py-2 bg-slate-50 rounded-xl">
                            <BlockMath math={q.question || ''} />
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 italic max-w-[120px] truncate">Nguồn: {q.source || 'GDPT 2018'}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Xóa vĩnh viễn">
                              🗑️
                            </button>
                            <button 
                              onClick={() => toggleSelectQuestion(q.id)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-blue-600 text-white shadow-sm'}`}
                            >
                              {isSelected ? 'Bỏ chọn' : 'Chọn câu này'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredQuestions.length === 0 && (
                    <div className="col-span-full bg-white p-12 text-center rounded-2xl text-slate-400 font-bold">
                      Không tìm thấy câu hỏi nào khớp với bộ lọc hiện tại.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: ĐÓNG GÓI PHÔI ĐỀ THI & XEM TRƯỚC/CHỈNH SỬA ============ */}
          {activeTab === 'matrix' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                  <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider border-b border-indigo-50 pb-3">
                    Tham Số Đóng Gói
                  </h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Tiêu đề đề thi chính thức:</label>
                    <input type="text" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none shadow-inner" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Mã đề thi:</label>
                      <input type="text" value={testCode} onChange={(e) => setTestCode(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Thời gian (Phút):</label>
                      <input type="number" value={testDuration} onChange={(e) => setTestDuration(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none shadow-inner" />
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-4 rounded-xl text-xs text-indigo-800 space-y-2 font-medium">
                    <p>📊 <strong>Quy mô cấu trúc đang chọn:</strong></p>
                    <p>• Số lượng câu: <strong>{selectedQuestionIds.length}</strong> câu hỏi toán học.</p>
                    <p>• Trạng thái đồng bộ: Đã kết nối với phân khu Phòng Thi Số Học Sinh.</p>
                  </div>

                  <button
                    onClick={handlePublishExam}
                    disabled={isPublishingTest || selectedQuestionIds.length === 0}
                    className={`w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all ${isPublishingTest || selectedQuestionIds.length === 0 ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'}`}
                  >
                    🚀 XUẤT BẢN & GIAO ĐỀ CHO HỌC SINH
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                  <div className="p-8 border-b border-gray-100 space-y-6 bg-slate-50/50">
                    <div className="flex justify-between items-start border-b-2 border-dashed border-slate-300 pb-4 text-center">
                      <div className="w-1/2 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-500">TRƯỜNG TH, THCS VÀ THPT THANH BÌNH</p>
                        <p className="text-xs font-black uppercase text-indigo-700 tracking-wide">TỔ TOÁN HỌC - TBS</p>
                      </div>
                      <div className="w-1/2 space-y-1">
                        <p className="text-xs font-black text-slate-700 uppercase">{testTitle}</p>
                        <p className="text-[10px] font-bold text-slate-500">Thời gian làm bài: {testDuration} phút | Mã Đề: {testCode}</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 italic">
                      Thầy có thể bấm trực tiếp nút chỉnh sửa bút chì kế bên mỗi câu để viết lại đề bài hoặc tinh chỉnh mã toán LaTeX trực tiếp trên phôi in đề thi này.
                    </div>
                  </div>

                  <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-white">
                    {selectedQuestionIds.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 opacity-60 py-20">
                        <span className="text-5xl">📄</span>
                        <p className="text-xs font-bold uppercase tracking-wider">Phôi Đề Đang Trống. Mời thầy chọn câu hỏi ở Tab 1.</p>
                      </div>
                    ) : (
                      bankQuestions
                        .filter(q => selectedQuestionIds.includes(q.id))
                        .map((q, index) => (
                          <div key={q.id} className="space-y-3 relative group border border-slate-100 p-4 rounded-xl hover:border-indigo-300 transition-colors">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-indigo-600">Câu {index + 1}:</span>
                              <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startInlineEdit(q.id, q.question)} className="text-blue-600 font-bold hover:underline">✏️ Sửa câu này</button>
                                <button onClick={() => toggleSelectQuestion(q.id)} className="text-rose-500 font-bold hover:underline">❌ Loại bỏ</button>
                              </div>
                            </div>

                            {editingQuestionId === q.id ? (
                              <div className="space-y-2 mt-2">
                                <textarea
                                  value={editTextValue}
                                  onChange={(e) => setEditTextValue(e.target.value)}
                                  className="w-full p-3 bg-slate-50 border border-indigo-300 rounded-xl text-xs font-mono focus:outline-none"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => saveInlineEdit(q.id)} className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded uppercase">Lưu lại</button>
                                  <button onClick={() => setEditingQuestionId(null)} className="px-3 py-1 bg-slate-200 text-slate-600 font-bold text-[10px] rounded uppercase">Hủy</button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-800 text-center py-2 bg-slate-50/50 rounded-lg">
                                <BlockMath math={q.question || ''} />
                              </div>
                            )}

                            {q.type === 'MCQ' && q.options && (
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pl-4">
                                {Object.entries(q.options).map(([key, value]: any) => (
                                  <p key={key} className={q.correctAnswer === key ? 'text-emerald-600 font-black' : ''}>
                                    <span className="font-bold mr-1">{key}.</span> {value}
                                  </p>
                                ))}
                              </div>
                            )}

                            {q.type === 'TF' && q.statements && (
                              <div className="space-y-1 text-xs text-slate-600 pl-4">
                                {q.statements.map((st: any, i: number) => (
                                  <p key={i}>
                                    • Ý {st.id}): {st.text} ➔ <span className={st.correct ? 'text-emerald-600 font-black' : 'text-rose-500 font-black'}>{st.correct ? 'ĐÚNG' : 'SAI'}</span>
                                  </p>
                                ))}
                              </div>
                            )}

                            {q.type === 'SA' && (
                              <p className="text-xs text-slate-600 pl-4 italic">
                                🔑 Đáp số ngắn: <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">{q.correctAnswer}</span>
                              </p>
                            )}

                            {q.type === 'LA' && (
                              <div className="text-xs text-slate-600 pl-4 bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                                <p className="font-bold text-purple-600">🔑 Lời giải tự luận tham chiếu:</p>
                                <p className="mt-1 whitespace-pre-wrap">{q.correctAnswer}</p>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: BIÊN SOẠN & NẠP CÂU HỎI MỚI BẰNG AI ============= */}
          {activeTab === 'create' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl space-y-5">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider border-b border-emerald-100 pb-3">Thiết Lập Ma Trận Sinh Đề</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Chủ đề chi tiết:</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="VD: Khảo sát và vẽ đồ thị hàm số phân thức..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm font-bold shadow-inner" />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Số lượng cho từng dạng thức:</label>
                    {['MCQ', 'TF', 'SA', 'LA'].map((t) => (
                      <div key={t} className="flex items-center gap-3">
                        <span className="w-20 font-bold text-xs text-slate-700">{t === 'MCQ' ? 'Trắc nghiệm:' : t === 'TF' ? 'Đúng/Sai:' : t === 'SA' ? 'Trả lời ngắn:' : 'Tự luận:'}</span>
                        <input type="number" min="0" value={(examConfig as any)[t].count} onChange={(e) => updateConfig(t as any, 'count', e.target.value)} className="w-16 p-2 rounded-lg border border-slate-300 text-sm text-center" />
                        <select value={(examConfig as any)[t].level} onChange={(e) => updateConfig(t as any, 'level', e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-300 text-xs">
                          <option>Nhận biết</option><option>Thông hiểu</option><option>Vận dụng</option><option>Vận dụng cao</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1.5">📚 Nguồn dữ liệu SGK đối chiếu:</label>
                    <textarea value={referenceSource} onChange={(e) => setReferenceSource(e.target.value)} placeholder="Dán nội dung bài tập chuẩn để AI chống chế dữ liệu..." className="w-full h-24 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-medium focus:outline-none resize-none" />
                  </div>
                  <button onClick={handleGeneratePrompt} className="w-full py-3 bg-emerald-100 text-emerald-700 font-extrabold rounded-xl hover:bg-emerald-200 text-xs uppercase tracking-wider">⚡ Khởi Tạo Lệnh Prompt</button>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-sky-100 pb-3">
                    <h3 className="text-xs font-black text-sky-700 uppercase tracking-wider">Copy Lệnh Gửi Trợ Lý AI</h3>
                    <button onClick={handleCopyPrompt} disabled={!generatedPrompt} className="px-4 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md disabled:opacity-50">📋 Copy Prompt</button>
                  </div>
                  <textarea readOnly value={generatedPrompt} className="w-full h-32 p-4 bg-slate-800 text-emerald-400 font-mono text-[11px] rounded-xl focus:outline-none shadow-inner resize-none" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4">
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider border-b border-amber-100 pb-3">Dán dữ liệu JSON AI kết xuất</h3>
                  <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='Dán mảng JSON câu hỏi trả về vào đây...' className="w-full h-32 p-4 bg-amber-50 border border-amber-100 font-mono text-[11px] rounded-xl focus:outline-none resize-none" />
                  <button onClick={handleParseJSON} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-xl text-xs uppercase shadow-[0_4px_0_0_#9A3412] active:translate-y-1 active:shadow-none transition-all">🧩 Biên Dịch Khối Dữ Liệu</button>
                </div>

                {generatedQuestions.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-2xl space-y-4 border-2 border-emerald-400">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                      <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider">Duyệt nhanh danh sách chờ ({generatedQuestions.length} câu)</h3>
                      <button onClick={handleSaveAllToBank} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors">💾 LƯU ĐỒNG LOẠT VÀO KHO</button>
                    </div>
                    
                    <div className="max-h-[450px] overflow-y-auto pr-2 space-y-4">
                      {generatedQuestions.map((q, idx) => (
                        <div key={idx} className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">{q.type}</span>
                          <div className="text-xs text-center font-medium bg-white p-2 rounded border"><BlockMath math={q.question || ''} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </AuthGuard>
  );
}