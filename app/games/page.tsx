'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function GameSetupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // --- ĐIỀU HƯỚNG TAB ---
  const [setupMode, setSetupMode] = useState<'live' | 'practice'>('live');

  // ==========================================
  // STATE: TAB 1 - ĐẤU TRƯỜNG ĐỒNG BỘ (LIVE)
  // ==========================================
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [isFetchingExams, setIsFetchingExams] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState(''); 
  const [isCreatingLive, setIsCreatingLive] = useState(false);

  // ==========================================
  // STATE: TAB 2 - XƯỞNG GAME TỰ LUYỆN (PRACTICE)
  // ==========================================
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [isFetchingBank, setIsFetchingBank] = useState(true);
  const [practiceTitle, setPracticeTitle] = useState('Nhiệm vụ: Chinh phục Đại số');
  const [gameGenre, setGameGenre] = useState('tower_defense'); // tower_defense, speed_racer, puzzle
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isCreatingPractice, setIsCreatingPractice] = useState(false);

  // Tải Dữ liệu từ Firebase (Kho Đề Thi & Kho Câu Hỏi)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Tải Kho Đề Thi (Cho Live Mode)
        const qExams = query(collection(db, 'dethi_phongthi'), orderBy('createdAt', 'desc'));
        const snapshotExams = await getDocs(qExams);
        const examsData = snapshotExams.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableExams(examsData);
        if (examsData.length > 0) setSelectedExamId(examsData[0].id);
        setIsFetchingExams(false);

        // 2. Tải Kho Câu Hỏi Lẻ (Cho Practice Mode)
        const qBank = query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'desc'));
        const snapshotBank = await getDocs(qBank);
        const bankData = snapshotBank.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBankQuestions(bankData);
        setIsFetchingBank(false);

      } catch (error) {
        showToast('error', 'Lỗi tải dữ liệu từ trung tâm.');
      }
    };
    fetchData();
  }, []);

  // --- XỬ LÝ KHỞI TẠO LIVE GAME ---
  const handleCreateLiveGame = async () => {
    if (!selectedExamId) {
      showToast('warning', 'Vui lòng chọn đề thi trước!'); return;
    }
    setIsCreatingLive(true);
    try {
      const selectedExam = availableExams.find(exam => exam.id === selectedExamId);
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();

      await addDoc(collection(db, 'live_games'), {
        type: 'live',
        pin: newPin,
        examId: selectedExamId,
        examTitle: selectedExam?.title || 'Đề thi Toán TBS',
        hostName: 'Giáo viên Toán TBS',
        status: 'waiting',
        createdAt: serverTimestamp(),
        players: []
      });

      showToast('success', `Đã khởi tạo phòng thi Live: ${newPin}`);
      router.push(`/games/host/${newPin}`);
    } catch (error) {
      showToast('error', 'Lỗi khởi tạo phòng thi!');
    } finally {
      setIsCreatingLive(false);
    }
  };

  // --- XỬ LÝ CHỌN CÂU HỎI & XUẤT GAME TỰ LUYỆN ---
  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleCreatePracticeGame = async () => {
    if (!practiceTitle.trim()) { showToast('warning', 'Thầy vui lòng đặt tên cho nhiệm vụ!'); return; }
    if (selectedQuestionIds.length === 0) { showToast('warning', 'Vui lòng chọn ít nhất 1 câu hỏi để làm game!'); return; }
    
    setIsCreatingPractice(true);
    try {
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      const selectedQuestions = bankQuestions.filter(q => selectedQuestionIds.includes(q.id));

      await addDoc(collection(db, 'practice_games'), {
        type: 'practice',
        pin: newPin,
        title: practiceTitle,
        genre: gameGenre,
        totalQuestions: selectedQuestions.length,
        questions: selectedQuestions, // Lưu thẳng mảng câu hỏi vào game tự luyện
        createdBy: 'Giáo viên Toán TBS',
        createdAt: serverTimestamp(),
        isActive: true
      });

      showToast('success', `Đã xuất bản Game Tự Luyện. Mã PIN: ${newPin}`);
      // Clear form
      setPracticeTitle('');
      setSelectedQuestionIds([]);
      // Tạm thời hiển thị alert mã PIN (Sau này có thể tạo Modal thông báo đẹp hơn)
      alert(`🎉 XUẤT BẢN THÀNH CÔNG!\n\nMã PIN Game Tự Luyện: ${newPin}\n\nThầy hãy gửi mã này cho học sinh để các em nhập vào màn hình Đấu Trường nhé!`);
    } catch (error) {
      showToast('error', 'Lỗi xuất bản game tự luyện.');
    } finally {
      setIsCreatingPractice(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
        <div className="max-w-4xl w-full z-10 space-y-8">
          
          {/* HEADER TRUNG TÂM */}
          <div className="text-center space-y-2">
            <div className="inline-block px-4 py-1.5 bg-indigo-100 rounded-full mb-2">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                Trung Tâm Điều Hành Gamification
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 drop-shadow-sm uppercase tracking-wide">
              Xưởng Thiết Lập Trò Chơi
            </h1>
          </div>

          {/* THANH ĐIỀU HƯỚNG TAB (LIVE vs PRACTICE) */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mx-auto w-fit">
            <button 
              onClick={() => setSetupMode('live')}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${setupMode === 'live' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              🎤 Đấu Trường Đồng Bộ (Live)
            </button>
            <button 
              onClick={() => setSetupMode('practice')}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${setupMode === 'practice' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              🎮 Xưởng Game Tự Luyện
            </button>
          </div>

          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-xl relative transition-all">
            
            {/* ========================================================= */}
            {/* TAB 1: ĐẤU TRƯỜNG ĐỒNG BỘ */}
            {/* ========================================================= */}
            {setupMode === 'live' && (
              <div className="space-y-6 max-w-md mx-auto animate-fadeIn">
                <div className="text-center mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase">Tạo phòng thi đấu trực tiếp trên lớp. Học sinh sẽ trả lời cùng lúc thông qua máy chiếu.</p>
                </div>
                
                <div className="space-y-2 text-center">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Chọn Bộ Đề Từ Ngân Hàng
                  </label>
                  
                  {isFetchingExams ? (
                    <div className="w-full text-center text-sm font-bold text-slate-500 p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl">
                      <span className="animate-pulse">Đang tải kho đề thi... ⏳</span>
                    </div>
                  ) : availableExams.length === 0 ? (
                    <div className="w-full text-center text-xs font-bold text-rose-500 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl">
                      Chưa có đề thi nào! Thầy hãy vào trang "Ngân hàng đề thi" để đóng gói đề trước nhé.
                    </div>
                  ) : (
                    <select 
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="w-full text-center text-sm font-bold text-slate-700 p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner truncate"
                    >
                      {availableExams.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title || 'Đề thi không tên'} ({exam.totalQuestions} câu)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCreateLiveGame}
                    disabled={isCreatingLive || isFetchingExams || availableExams.length === 0}
                    className="w-full py-4 bg-gradient-to-b from-indigo-500 to-purple-600 text-white text-lg font-black rounded-2xl shadow-[0_6px_0_0_#4338CA] active:translate-y-1.5 active:shadow-[0_0px_0_0_#4338CA] transition-all uppercase tracking-widest flex justify-center items-center gap-2 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingLive ? <span className="animate-spin">⚙️</span> : 'Mở Phòng Thi Đấu'}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: XƯỞNG GAME TỰ LUYỆN */}
            {/* ========================================================= */}
            {setupMode === 'practice' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase">Học sinh sẽ tự chơi theo tiến độ cá nhân để cày điểm và ôn tập kiến thức.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột 1: Cấu hình chung */}
                  <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tên nhiệm vụ / Thử thách:</label>
                      <input 
                        type="text" 
                        value={practiceTitle}
                        onChange={(e) => setPracticeTitle(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        placeholder="VD: Chinh phục Nguyên Hàm cơ bản..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Thể loại Trò chơi:</label>
                      <select 
                        value={gameGenre}
                        onChange={(e) => setGameGenre(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="tower_defense">🛡️ Vượt Ải Kiến Thức (Tower Defense)</option>
                        <option value="speed_racer">🏎️ Phản Xạ Siêu Tốc (Speed Racer)</option>
                        <option value="puzzle">🧩 Giải Mã Mật Thư (Code Breaker)</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-black text-emerald-600 uppercase">Trạng thái rổ câu hỏi:</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">Đã chọn <span className="text-emerald-500 text-xl">{selectedQuestionIds.length}</span> câu hỏi.</p>
                      <button
                        onClick={handleCreatePracticeGame}
                        disabled={isCreatingPractice || selectedQuestionIds.length === 0}
                        className="w-full mt-4 py-3 bg-gradient-to-b from-emerald-400 to-emerald-500 text-white font-black rounded-xl shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-[0_0px_0_0_#059669] transition-all uppercase tracking-widest disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {isCreatingPractice ? 'Đang xuất bản...' : '🚀 Xuất Bản Game'}
                      </button>
                    </div>
                  </div>

                  {/* Cột 2: Chọn câu hỏi từ Ngân hàng */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Trích xuất câu hỏi từ Kho V2:</label>
                    
                    {isFetchingBank ? (
                      <p className="text-xs font-bold text-slate-400 text-center py-10 animate-pulse">Đang nạp ngân hàng câu hỏi...</p>
                    ) : bankQuestions.length === 0 ? (
                      <p className="text-xs font-bold text-rose-500 text-center py-10 bg-rose-50 rounded-xl">Kho câu hỏi trống.</p>
                    ) : (
                      <div className="h-[350px] overflow-y-auto space-y-2 pr-2">
                        {bankQuestions.map((q) => (
                          <label key={q.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedQuestionIds.includes(q.id) ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                            <div className="mt-1">
                              <input 
                                type="checkbox" 
                                checked={selectedQuestionIds.includes(q.id)}
                                onChange={() => toggleQuestionSelection(q.id)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{q.customId || q.type}</span>
                                <span className="text-[9px] font-bold text-slate-400">{q.level}</span>
                              </div>
                              <div className="text-[10px] bg-slate-50 p-1.5 rounded truncate overflow-hidden">
                                <BlockMath math={q.question || ''} />
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
          
          <div className="text-center pb-8">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline underline-offset-4 transition-colors"
            >
              ⬅ Về trang Dashboard quản trị
            </button>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}