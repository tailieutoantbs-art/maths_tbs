'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface Player {
  name: string;
  score: number;
}

interface GameQuestion {
  id: string;
  type: 'MCQ' | 'TF' | 'SA';
  question: string;
  level: string;
  options?: { A: string; B: string; C: string; D: string };
  statements?: { id: string; text: string; correct: boolean }[];
  correctAnswer?: string;
}

export default function GameHostPage() {
  const router = useRouter();
  const [pinCode, setPinCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái điều khiển trận đấu
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 giây mặc định cho mỗi câu hỏi
  const [showAnswer, setShowAnswer] = useState(false);

  // 1. Khởi tạo phòng chơi và tải câu hỏi từ ngân hàng cauhoi_nganhang
  useEffect(() => {
    const initHost = async () => {
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      setPinCode(newPin);

      try {
        // Tải câu hỏi từ ngân hàng dữ liệu
        const qSnapshot = await getDocs(query(collection(db, 'cauhoi_nganhang'), orderBy('createdAt', 'asc')));
        const qList: GameQuestion[] = [];
        qSnapshot.forEach((doc) => {
          qList.push({ id: doc.id, ...doc.data() } as any);
        });
        setQuestions(qList);

        // Tạo phòng chơi trên Firestore
        await setDoc(doc(db, 'game_rooms', newPin), {
          pin: newPin,
          status: 'waiting',
          currentQuestionIndex: 0,
          showAnswer: false,
          createdAt: serverTimestamp(),
          players: []
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khởi tạo Đấu trường:", error);
      }
    };

    initHost();
  }, []);

  // 2. Lắng nghe real-time danh sách học sinh vào phòng và điểm số
  useEffect(() => {
    if (!pinCode) return;

    const unsubscribe = onSnapshot(doc(db, 'game_rooms', pinCode), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayers(data.players || []);
        setGameStatus(data.status);
        setCurrentQuestionIndex(data.currentQuestionIndex || 0);
        setShowAnswer(data.showAnswer || false);
      }
    });

    return () => unsubscribe();
  }, [pinCode]);

  // 3. Bộ đếm ngược thời gian cho câu hỏi đang hiển thị
  useEffect(() => {
    if (gameStatus !== 'playing' || showAnswer || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, showAnswer, timeLeft]);

  // Kích hoạt bắt đầu trận đấu
  const handleStartGame = async () => {
    if (questions.length === 0) {
      alert("Ngân hàng câu hỏi đang trống, không thể bắt đầu trò chơi!");
      return;
    }
    try {
      await updateDoc(doc(db, 'game_rooms', pinCode), {
        status: 'playing',
        currentQuestionIndex: 0,
        showAnswer: false
      });
      setTimeLeft(30); // Đặt thời gian làm bài câu đầu tiên
    } catch (error) {
      console.error(error);
    }
  };

  // Xử lý khi hết giờ câu hỏi
  const handleTimeOut = async () => {
    try {
      await updateDoc(doc(db, 'game_rooms', pinCode), {
        showAnswer: true
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Chuyển sang câu hỏi tiếp theo
  const handleNextQuestion = async () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      // Đã hết câu hỏi -> Kết thúc game
      await updateDoc(doc(db, 'game_rooms', pinCode), {
        status: 'ended'
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'game_rooms', pinCode), {
        currentQuestionIndex: nextIndex,
        showAnswer: false
      });
      setTimeLeft(30); // Reset đồng hồ câu hỏi mới
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-amber-400 font-black text-xl animate-pulse uppercase tracking-widest">
          Đang nén dữ liệu ma trận Đấu Trường...
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#0F172A] text-white flex flex-col relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* TOP BAR CHỨA THÔNG TIN PHÒNG CHƠI */}
        <div className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center z-10 shadow-xl">
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent uppercase tracking-wider">
              Đấu Trường Toán Học — Máy Chiếu Quản Trò
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
              Trung tâm học liệu số Tổ Toán TBS
            </p>
          </div>
          <div className="bg-black/30 px-6 py-2 rounded-2xl border border-amber-400/30 text-center">
            <span className="text-[10px] font-bold text-amber-400 block uppercase tracking-widest">Mã PIN Phòng</span>
            <span className="text-2xl font-black tracking-widest">{pinCode}</span>
          </div>
        </div>

        {/* TRẠNG THÁI 1: CHỜ HỌC SINH TẬP KẾT */}
        {gameStatus === 'waiting' && (
          <div className="flex-grow p-6 z-10 flex flex-col max-w-6xl w-full mx-auto justify-between">
            <div className="flex justify-between items-end border-b border-white/10 pb-4 mt-4">
              <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                Danh sách đấu thủ nhập phòng
                <span className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full">{players.length}</span>
              </h2>
              <button
                onClick={handleStartGame}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl shadow-[0_5px_0_0_#9A3412] active:translate-y-1 active:shadow-[0_0px_0_0_#9A3412] transition-all uppercase tracking-wider text-sm"
              >
                Kích Hoạt Trận Đấu 🏁
              </button>
            </div>

            <div className="flex-grow bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 my-6 overflow-y-auto min-h-[400px]">
              {players.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 animate-pulse">
                  <span className="text-5xl">⏳</span>
                  <p className="text-sm font-bold uppercase tracking-widest">Đang đợi các chiến binh kết nối ô nhập liệu...</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {players.map((p, idx) => (
                    <div key={idx} className="px-5 py-2.5 bg-white/10 border border-white/15 rounded-xl font-bold text-sm shadow-md animate-fadeIn">
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRẠNG THÁI 2: ĐANG DIỄN RA TRẬN ĐẤU (HIỂN THỊ CÂU HỎI TOÁN) */}
        {gameStatus === 'playing' && currentQuestion && (
          <div className="flex-grow p-6 z-10 flex flex-col max-w-5xl w-full mx-auto justify-between space-y-6">
            
            {/* THANH ĐIỀU KHIỂN CÂU HỎI */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-sm font-black text-sky-400 uppercase tracking-wider">
                Câu hỏi {currentQuestionIndex + 1} / {questions.length} — Mức độ: {currentQuestion.level}
              </span>
              
              <div className="flex items-center gap-4">
                <div className="bg-black/40 px-4 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Thời gian:</span>
                  <span className={`font-mono font-black text-xl ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                    {timeLeft}s
                  </span>
                </div>

                {showAnswer && (
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all"
                  >
                    Câu Tiếp Theo ➔
                  </button>
                )}
              </div>
            </div>

            {/* BẢNG HIỂN THỊ CÔNG THỨC TOÁN HỌC KHỔNG LỒ */}
            <div className="flex-grow bg-white text-slate-900 rounded-3xl p-8 flex items-center justify-center shadow-2xl overflow-x-auto border-4 border-white/10">
              <div className="text-center text-xl md:text-2xl font-bold leading-relaxed max-w-3xl">
                <BlockMath math={currentQuestion.question || '\\text{Lỗi đọc cấu trúc câu hỏi}'} />
              </div>
            </div>

            {/* ĐÁP ÁN HIỂN THỊ KHI HẾT GIỜ HOẶC KHÓA ĐỀ */}
            <div className="w-full">
              {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isCorrect = currentQuestion.correctAnswer === key;
                    return (
                      <div 
                        key={key} 
                        className={`p-4 rounded-2xl border text-sm font-bold transition-all flex items-center gap-3 ${
                          showAnswer && isCorrect 
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                            : 'bg-white/10 border-white/10 text-slate-300'
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${showAnswer && isCorrect ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'}`}>{key}</span>
                        <span>{value}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'TF' && currentQuestion.statements && (
                <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                  {currentQuestion.statements.map((st, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 text-xs font-semibold">
                      <span className="text-slate-200"><span className="text-sky-400 font-bold">{st.id})</span> {st.text}</span>
                      {showAnswer && (
                        <span className={`text-[10px] font-black px-2 py-1 rounded ${st.correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {st.correct ? 'ĐÚNG' : 'SAI'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'SA' && showAnswer && (
                <div className="bg-amber-500/20 border border-amber-500/40 p-4 rounded-2xl text-center font-bold text-amber-400 text-sm">
                  🔑 Đáp số chính xác: <span className="bg-white text-slate-900 px-4 py-1.5 rounded-lg ml-2 font-mono text-base shadow-inner border border-amber-300">{currentQuestion.correctAnswer}</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TRẠNG THÁI 3: KẾT THÚC GAME - BẢNG VÀNG VINH DANH */}
        {gameStatus === 'ended' && (
          <div className="flex-grow p-6 z-10 flex flex-col max-w-2xl w-full mx-auto justify-center space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-5xl">🏆</span>
              <h2 className="text-3xl font-black text-amber-400 uppercase tracking-widest">Bảng Vàng Chiến Binh</h2>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Kết quả chung cuộc Đấu trường Toán học TBS</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl divide-y divide-white/5">
              {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-4 px-2">
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${idx === 0 ? 'bg-amber-400 text-slate-900 shadow-md' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-orange-400 text-slate-900' : 'bg-white/10 text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-base text-slate-100">{p.name}</span>
                  </div>
                  <span className="font-mono font-black text-lg text-emerald-400">{p.score} điểm</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs uppercase tracking-widest border border-white/10 transition-all"
            >
              Rời phòng & Về Workspace
            </button>
          </div>
        )}

      </main>
    </AuthGuard>
  );
}