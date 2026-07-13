'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function GameHostScreen() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const pin = params.pin as string;

  // Trạng thái chung của phòng thi
  const [gameDocId, setGameDocId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'leaderboard' | 'finished'>('waiting');
  const [examTitle, setExamTitle] = useState('Đang tải dữ liệu...');
  
  // Dữ liệu người chơi
  const [players, setPlayers] = useState<any[]>([]);
  
  // Điều khiển trò chơi
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);

  // Lắng nghe dữ liệu phòng thi theo thời gian thực (Real-time Listener)
  useEffect(() => {
    if (!pin) return;

    const q = query(collection(db, 'live_games'), where('pin', '==', pin));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        showToast('error', 'Phòng thi không tồn tại hoặc đã bị đóng!');
        router.push('/games/setup');
        return;
      }

      const docData = snapshot.docs[0];
      const data = docData.data();
      
      setGameDocId(docData.id);
      setGameStatus(data.status || 'waiting');
      setExamTitle(data.examTitle || 'Đấu Trường Toán Học TBS');
      setPlayers(data.players || []);
      
      // Nếu phòng đang ở trạng thái chờ và chưa tải câu hỏi, tiến hành nạp câu hỏi từ dethi_phongthi
      if (data.status === 'waiting' && questions.length === 0 && data.examId) {
        // Trong thực tế, chúng ta sẽ query lấy detail của examId. 
        // Ở đây giả lập nạp số lượng câu hỏi để khởi tạo giao diện
        setTotalQuestions(data.totalQuestions || 10);
      }
    });

    return () => unsubscribe();
  }, [pin]);

  // Hành động của Giáo viên
  const handleStartGame = async () => {
    if (players.length === 0) {
      if(!window.confirm('Chưa có chiến binh nào vào phòng! Thầy vẫn muốn bắt đầu chứ?')) return;
    }
    
    if (gameDocId) {
      await updateDoc(doc(db, 'live_games', gameDocId), {
        status: 'playing',
        currentQuestion: 0,
        questionStartTime: new Date().getTime()
      });
    }
  };

  const handleNextQuestion = async () => {
    if (gameDocId) {
      // Giả lập chuyển câu hỏi hoặc kết thúc
      if (currentQuestionIndex + 1 >= totalQuestions) {
        await updateDoc(doc(db, 'live_games', gameDocId), { status: 'leaderboard' });
      } else {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        await updateDoc(doc(db, 'live_games', gameDocId), {
          currentQuestion: nextIdx,
          questionStartTime: new Date().getTime()
        });
      }
    }
  };

  const handleEndGame = async () => {
    if (gameDocId) {
      await updateDoc(doc(db, 'live_games', gameDocId), { status: 'finished' });
      router.push('/games/setup');
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative overflow-hidden">
      {/* TRANG TRÍ BACKGROUND ESPORTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none"></div>

      {/* HEADER: THANH TRẠNG THÁI TRÊN CÙNG */}
      <div className="flex justify-between items-center p-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-10">
        <div>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 uppercase tracking-widest">
            {examTitle}
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase mt-1">Trường TH, THCS & THPT Thanh Bình</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 border border-slate-600 px-4 py-2 rounded-xl flex items-center gap-3 shadow-inner">
            <span className="text-2xl">👥</span>
            <span className="text-2xl font-black text-emerald-400">{players.length}</span>
          </div>
          <button onClick={() => router.push('/games/setup')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            Đóng Phòng
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* MÀN HÌNH 1: PHÒNG CHỜ (LOBBY) */}
      {/* ========================================== */}
      {gameStatus === 'waiting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 space-y-12 animate-fadeIn">
          
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 p-12 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-lg font-bold text-indigo-300 uppercase tracking-[0.3em] mb-4">Mã Phòng Thi Đấu (Game PIN)</p>
            <h2 className="text-8xl md:text-9xl font-black text-white tracking-[0.2em] drop-shadow-[0_0_20px_rgba(79,70,229,0.5)]">
              {pin}
            </h2>
            <p className="mt-6 text-sm font-bold text-slate-300">
              Truy cập <span className="text-cyan-400">hethongtoan-tbs.com/games</span> để vào phòng
            </p>
          </div>

          <div className="w-full max-w-5xl">
            <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
              <h3 className="text-xl font-black uppercase text-slate-300">Chiến binh đã sẵn sàng</h3>
              <button 
                onClick={handleStartGame}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-900 px-8 py-3 rounded-2xl font-black text-lg uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                Bắt Đầu Ngay 🚀
              </button>
            </div>
            
            {players.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-bold text-lg animate-pulse">
                Đang chờ học sinh quét mã và nhập tên...
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center max-h-[300px] overflow-y-auto p-2">
                {players.map((p, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-indigo-500/30 px-6 py-3 rounded-xl font-black text-lg animate-bounce-in shadow-lg">
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MÀN HÌNH 2: ĐANG THI ĐẤU (PLAYING) */}
      {/* ========================================== */}
      {gameStatus === 'playing' && (
        <div className="flex-1 flex flex-col p-8 z-10 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg border border-indigo-400">
              Câu hỏi {currentQuestionIndex + 1} / {totalQuestions}
            </span>
            <div className="bg-slate-800 px-6 py-2 rounded-full font-black text-xl text-cyan-400 border border-slate-600">
              ⏳ 00:30
            </div>
          </div>

          {/* Khung hiển thị câu hỏi TO & RÕ */}
          <div className="flex-1 bg-white text-slate-900 rounded-[2rem] p-10 flex flex-col justify-center items-center shadow-2xl relative">
            <p className="text-3xl md:text-4xl font-bold text-center leading-relaxed max-w-4xl">
              {/* Giả lập câu hỏi LaTeX */}
              <BlockMath math={`\\int_{0}^{\\pi} \\sin(x) dx`} />
              <span className="block mt-6 text-xl text-slate-500 font-medium font-sans">Giá trị của tích phân trên là bao nhiêu?</span>
            </p>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-slate-400 font-bold text-lg">
              Đã nhận: <span className="text-white text-2xl ml-2 font-black">0 / {players.length}</span> câu trả lời
            </div>
            <button 
              onClick={handleNextQuestion}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg uppercase tracking-wider hover:bg-blue-500 transition-colors shadow-lg"
            >
              Tiếp Tục ⏭️
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MÀN HÌNH 3: BẢNG XẾP HẠNG (LEADERBOARD) */}
      {/* ========================================== */}
      {(gameStatus === 'leaderboard' || gameStatus === 'finished') && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 animate-fadeIn">
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 uppercase tracking-widest mb-12 drop-shadow-lg">
            BẢNG VÀNG VINH DANH
          </h2>
          
          <div className="flex items-end gap-6 mb-12 h-64">
            {/* Top 2 */}
            <div className="w-32 bg-slate-700/80 rounded-t-2xl flex flex-col items-center justify-end p-4 border border-slate-500 h-[70%] shadow-2xl relative">
              <span className="absolute -top-12 text-4xl">🥈</span>
              <span className="font-black text-xl truncate w-full text-center">Hải Đăng</span>
              <span className="text-slate-400 font-bold text-sm mt-1">2450 điểm</span>
            </div>
            {/* Top 1 */}
            <div className="w-40 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-2xl flex flex-col items-center justify-end p-4 border border-amber-300 h-[100%] shadow-[0_0_30px_rgba(245,158,11,0.3)] relative z-10">
              <span className="absolute -top-16 text-6xl">👑</span>
              <span className="font-black text-2xl truncate w-full text-center text-slate-900">Minh Tú</span>
              <span className="text-slate-900/80 font-black text-base mt-1">3200 điểm</span>
            </div>
            {/* Top 3 */}
            <div className="w-32 bg-slate-800/80 rounded-t-2xl flex flex-col items-center justify-end p-4 border border-slate-600 h-[50%] shadow-2xl relative">
              <span className="absolute -top-10 text-3xl">🥉</span>
              <span className="font-black text-xl truncate w-full text-center">Thanh Tùng</span>
              <span className="text-slate-400 font-bold text-sm mt-1">1800 điểm</span>
            </div>
          </div>

          <button 
            onClick={handleEndGame}
            className="bg-slate-700 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-600 transition-colors"
          >
            Trở về Trung Tâm Điều Hành
          </button>
        </div>
      )}

    </main>
  );
}