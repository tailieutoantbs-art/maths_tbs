'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

interface GameQuestion {
  id: string;
  type: 'MCQ' | 'TF' | 'SA';
  question: string;
  level: string;
  options?: { A: string; B: string; C: string; D: string };
  statements?: { id: string; text: string; correct: boolean }[];
  correctAnswer?: string;
}

function PlayerGameInterface() {
  const params = useParams();
  
  const pinCode = params?.id as string;
  const [studentName, setStudentName] = useState('Chiến binh Ẩn danh');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    setStudentName(urlParams.get('name') || 'Chiến binh Ẩn danh');
  }, []);

  // Trạng thái phòng chơi kết nối từ Host
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  // Trạng thái câu trả lời cục bộ của học sinh cho câu hỏi hiện tại
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [processedIndexes, setProcessedIndexes] = useState<number[]>([]);
  const [scoreFeedback, setScoreFeedback] = useState<number | null>(null);

  // 1. Kiểm tra phòng và lắng nghe trạng thái đồng bộ real-time từ Host
  useEffect(() => {
    if (!pinCode) return;

    const roomRef = doc(db, 'game_rooms', pinCode);

    const joinRoom = async () => {
      if (joined) return;
      try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) {
          alert(`Mã phòng [${pinCode}] không tồn tại!`);
          window.location.href = '/games';
          return;
        }

        // Tải luôn danh sách câu hỏi đồng bộ với kho dữ liệu để xử lý tính điểm nhanh
        const qSnapshot = await getDoc(doc(db, 'game_rooms', pinCode)); // Đọc từ host cấu hình
        // Để đảm bảo đồng bộ, học sinh lấy câu hỏi sắp xếp theo thời gian giống hệt Host
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
        const qSnap = await getDocs(query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'asc')));
        const qList: GameQuestion[] = [];
        qSnap.forEach((d) => {
          qList.push({ id: d.id, ...d.data() } as any);
        });
        setQuestions(qList);

        // Đẩy tên vào mảng kết nối công khai
        await updateDoc(roomRef, {
          players: arrayUnion({ name: studentName, score: 0 })
        });
        setJoined(true);
      } catch (error) {
        console.error("Lỗi tham gia đấu trường:", error);
      }
    };

    joinRoom();

    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameStatus(data.status);
        
        // Phát hiện chuyển câu hỏi mới từ Host để reset nút bấm trên điện thoại
        if (data.currentQuestionIndex !== undefined && data.currentQuestionIndex !== currentQuestionIndex) {
          setCurrentQuestionIndex(data.currentQuestionIndex);
          setCurrentAnswer(null); // Reset câu trả lời của câu mới
          setScoreFeedback(null);
        }
        
        setShowAnswer(data.showAnswer || false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pinCode, studentName, joined, currentQuestionIndex]);

  // 2. LOGIC TỰ ĐỘNG CHẤM ĐIỂM KHI MÁY CHIẾU KHÓA ĐỀ (SHOW ANSWER = TRUE)
  useEffect(() => {
    if (showAnswer && !processedIndexes.includes(currentQuestionIndex) && questions[currentQuestionIndex]) {
      const q = questions[currentQuestionIndex];
      let pointsEarned = 0;

      if (q.type === 'MCQ') {
        if (currentAnswer === q.correctAnswer) pointsEarned = 10;
      } else if (q.type === 'TF') {
        // Áp dụng bộ luật Vòng 2: Đúng ý nào +10 điểm, Sai ý nào trừ thẳng 5 điểm
        q.statements?.forEach((st) => {
          const studentStAns = currentAnswer?.[st.id];
          if (studentStAns !== undefined) {
            if (studentStAns === st.correct) pointsEarned += 10;
            else pointsEarned -= 5;
          }
        });
      } else if (q.type === 'SA') {
        if (currentAnswer?.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase()) {
          pointsEarned = 10;
        }
      }

      setScoreFeedback(pointsEarned);

      // Cập nhật điểm số tổng của học sinh lên Firebase phòng chơi
      const syncScoreToFirebase = async () => {
        try {
          const roomRef = doc(db, 'game_rooms', pinCode);
          const roomSnap = await getDoc(roomRef);
          if (roomSnap.exists()) {
            const currentPlayers = roomSnap.data().players || [];
            const updatedPlayers = currentPlayers.map((p: any) => {
              if (p.name === studentName) {
                return { ...p, score: (p.score || 0) + pointsEarned };
              }
              return p;
            });
            await updateDoc(roomRef, { players: updatedPlayers });
          }
        } catch (err) {
          console.error("Lỗi cập nhật bảng vàng:", err);
        }
      };

      syncScoreToFirebase();
      setProcessedIndexes((prev) => [...prev, currentQuestionIndex]);
    }
  }, [showAnswer, currentQuestionIndex, currentAnswer, questions]);

  // Hàm cập nhật đáp án trắc nghiệm Đúng/Sai cho từng ý phát biểu nhỏ
  const handleSelectTF = (statementId: string, value: boolean) => {
    if (showAnswer) return;
    const currentSelection = currentAnswer || {};
    setCurrentAnswer({
      ...currentSelection,
      [statementId]: value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E0F2FE]">
        <div className="text-sky-600 font-bold animate-pulse uppercase tracking-widest text-sm">Đang nạp bảng điều khiển...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="min-h-screen bg-[#E0F2FE] flex flex-col items-center justify-center p-4 text-slate-700">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border-2 border-white/90 p-6 rounded-[2.5rem] shadow-2xl space-y-6">
        
        {/* MINI COMPONENT: THÔNG TIN CHIẾN BINH */}
        <div className="flex justify-between items-center bg-white/40 p-3 px-4 rounded-2xl border border-white/60 shadow-inner text-xs font-bold">
          <span className="text-slate-500">Đấu thủ: <span className="text-[#0284C7] font-black">{studentName}</span></span>
          <span className="text-slate-500">Mã PIN: <span className="text-emerald-600 font-black">{pinCode}</span></span>
        </div>

        {/* DIỄN BIẾN CHÍNH CỦA GAME THEO REAL-TIME */}
        <div className="min-h-[280px] flex flex-col justify-center">
          
          {/* TRẠNG THÁI 1: CHỜ KHỞI ĐỘNG */}
          {gameStatus === 'waiting' && (
            <div className="text-center space-y-3 animate-fadeIn">
              <span className="text-5xl animate-bounce inline-block">🎯</span>
              <h3 className="text-lg font-black text-slate-700 uppercase">Đăng ký giữ chỗ thành công</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thầy đang chờ các chiến binh khác tập kết, hãy chuẩn bị giấy nháp nhé!</p>
            </div>
          )}

          {/* TRẠNG THÁI 2: ĐANG DIỄN RA TRẬN ĐẤU */}
          {gameStatus === 'playing' && currentQuestion && (
            <div className="space-y-4 w-full animate-fadeIn">
              <span className="text-[10px] font-black text-[#0284C7] bg-sky-100 p-1 px-2.5 rounded-md uppercase tracking-wider">
                Câu {currentQuestionIndex + 1} — Điều khiển tay cầm
              </span>

              {/* MÀN HÌNH KHÓA KHI HẾT GIỜ HOẶC XEM ĐÁP ÁN */}
              {showAnswer ? (
                <div className="text-center py-6 space-y-3 bg-white/80 border border-white p-4 rounded-3xl shadow-lg">
                  <span className="text-4xl">{scoreFeedback && scoreFeedback > 0 ? '🎉' : '⏳'}</span>
                  <h4 className="text-base font-black uppercase">Thời gian câu hỏi khép lại!</h4>
                  {scoreFeedback !== null && (
                    <p className={`text-xl font-mono font-black ${scoreFeedback > 0 ? 'text-emerald-600' : scoreFeedback < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                      {scoreFeedback > 0 ? `+${scoreFeedback} Điểm!` : `${scoreFeedback} Điểm`}
                    </p>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhìn lên máy chiếu để xem lời giải chi tiết</p>
                </div>
              ) : (
                /* HIỂN THỊ CÁC NÚT BẤM DỰA VÀO LOẠI CÂU HỎI */
                <div className="w-full pt-2">
                  
                  {/* 2.1 GIAO DIỆN MCQ (4 NÚT KHỐI TO) */}
                  {currentQuestion.type === 'MCQ' && (
                    <div className="grid grid-cols-2 gap-3">
                      {['A', 'B', 'C', 'D'].map((label) => {
                        const isSelected = currentAnswer === label;
                        return (
                          <button
                            key={label}
                            onClick={() => setCurrentAnswer(label)}
                            className={`h-24 font-black text-2xl rounded-2xl border-2 transition-all shadow-md active:scale-95 ${
                              isSelected 
                                ? 'bg-sky-500 text-white border-sky-600 shadow-[0_4px_0_0_#0369A1]' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 2.2 GIAO DIỆN TF (ĐÚNG / SAI 4 Ý ĐỘC LẬP) */}
                  {currentQuestion.type === 'TF' && currentQuestion.statements && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Tick chọn Đúng hoặc Sai cho từng ý dưới đây:</p>
                      {currentQuestion.statements.map((st) => {
                        const ans = currentAnswer?.[st.id];
                        return (
                          <div key={st.id} className="flex justify-between items-center bg-white/90 p-2.5 px-3.5 border border-slate-100 rounded-xl shadow-sm">
                            <span className="text-xs font-black text-slate-600 uppercase">Ý {st.id})</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleSelectTF(st.id, true)}
                                className={`px-4 py-2 text-[10px] font-black rounded-lg border-2 transition-all active:scale-95 ${ans === true ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                              >
                                ĐÚNG
                              </button>
                              <button
                                onClick={() => handleSelectTF(st.id, false)}
                                className={`px-4 py-2 text-[10px] font-black rounded-lg border-2 transition-all active:scale-95 ${ans === false ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                              >
                                SAI
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2.3 GIAO DIỆN SA (ĐIỀN ĐÁP SỐ CHẤM ĐIỂM) */}
                  {currentQuestion.type === 'SA' && (
                    <div className="space-y-3 text-center">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Điền đáp số / giá trị tính được:</label>
                      <input 
                        type="text"
                        value={currentAnswer || ''}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Nhập kết quả số..."
                        className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl text-center text-base font-black text-slate-700 focus:outline-none focus:border-sky-400 shadow-inner"
                      />
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TRẠNG THÁI 3: KẾT THÚC TRẬN ĐẤU */}
          {gameStatus === 'ended' && (
            <div className="text-center space-y-4 animate-fadeIn">
              <span className="text-5xl">🏆</span>
              <h3 className="text-lg font-black text-amber-500 uppercase">Trận đấu khép lại!</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hãy nhìn lên màn hình lớn máy chiếu của Quản trò để vinh danh nhà vô địch Đấu trường!</p>
              <button 
                onClick={() => window.location.href = '/games'}
                className="px-6 py-2 bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-xl text-xs uppercase"
              >
                Rời phòng chơi
              </button>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}

export default function ProtectedPlayerView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#E0F2FE]"></div>}>
      <PlayerGameInterface />
    </Suspense>
  );
}