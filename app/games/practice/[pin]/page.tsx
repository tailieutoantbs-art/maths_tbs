'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function StudentPracticeGameScreen() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const pin = params.pin as string;
  const studentName = searchParams.get('name') || 'Chiến binh';

  const [gameData, setGameData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tiến trình kiểm soát vòng lặp trò chơi
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Truy vấn dữ liệu phiên game tự luyện từ Firebase dựa trên mã PIN
  useEffect(() => {
    if (!pin) return;
    const fetchGame = async () => {
      try {
        const q = query(collection(db, 'practice_games'), where('pin', '==', pin));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          showToast('error', 'Không tìm thấy mã nhiệm vụ tự luyện này!');
          router.push('/games');
          return;
        }
        
        const data = querySnapshot.docs[0].data();
        setGameData(data);
        setQuestions(data.questions || []);
      } catch (error) {
        showToast('error', 'Lỗi kết nối máy chủ trò chơi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGame();
  }, [pin]);

  // Kiểm tra đáp án thời gian thực (Self-paced Feedback Loop)
  const handleCheckAnswer = (optionKey: string) => {
    if (isAnswered) return;
    
    const currentQuestion = questions[currentIndex];
    setSelectedAnswer(optionKey);
    setIsAnswered(true);
    
    const correct = currentQuestion.correctAnswer === optionKey;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 100);
      showToast('success', 'Chính xác! +100 điểm 🎯');
    } else {
      showToast('error', `Chưa chính xác! Đáp án đúng là ${currentQuestion.correctAnswer}`);
    }
  };

  // Điều hướng chuyển câu hỏi
  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 animate-pulse">Đang dịch chuyển vào không gian trò chơi...</p>
        </div>
      </div>
    );
  }

  // MÀN HÌNH KẾT THÚC VÀ TỔNG HỢP ĐIỂM SỐ THEO THỂ LOẠI
  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border-2 border-emerald-500/30 p-8 rounded-[2rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl font-black Bleeding uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            {gameData?.genre === 'tower_defense' ? '🛡️ Vượt Ải Thành Công!' : gameData?.genre === 'speed_racer' ? '🏎️ Cán Đích Xuất Sắc!' : '🔓 Giải Mã Hoàn Tất!'}
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase">
            Chiến binh <span className="text-white">{studentName}</span> đã chinh phục thử thách!
          </p>
          
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng điểm tích lũy</p>
            <p className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{score}</p>
            <p className="text-xs text-slate-500 font-bold pt-2">Độ chính xác: Đúng {score / 100} / {questions.length} câu</p>
          </div>
          
          <button onClick={() => router.push('/games')} className="w-full py-4 bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 font-black text-sm uppercase rounded-xl tracking-widest shadow-lg active:translate-y-0.5 transition-all">
            Quay lại Đấu Trường
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const genre = gameData?.genre;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${genre === 'tower_defense' ? 'bg-slate-900' : genre === 'speed_racer' ? 'bg-zinc-900' : 'bg-indigo-950'}`}>
      
      {/* THANH THÔNG TIN TRÊN CÙNG */}
      <div className="p-4 bg-black/20 backdrop-blur-md border-b border-white/10 flex justify-between items-center text-white z-10">
        <div>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${genre === 'tower_defense' ? 'bg-emerald-500/20 text-emerald-400' : genre === 'speed_racer' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {genre === 'tower_defense' ? '🛡️ Vượt Ải' : genre === 'speed_racer' ? '🏎️ Phản Xạ' : '🧩 Giải Mã'}
          </span>
          <h1 className="text-xs font-black uppercase tracking-wide mt-1.5 inline-block ml-2">{gameData?.title}</h1>
        </div>
        <div className="text-right text-xs font-bold text-slate-300">
          👤 {studentName} | <span className="text-emerald-400">⭐ {score}</span>
        </div>
      </div>

      {/* THANH TIẾN TRÌNH TRỰC QUAN THEO DÕI */}
      <div className="px-4 py-3 bg-black/40 flex justify-between items-center border-b border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
        <span>Tiến trình: Câu {currentIndex + 1}/{questions.length}</span>
        <div className="flex gap-1.5">
          {questions.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-6 h-1.5 rounded transition-all duration-300 ${idx === currentIndex ? 'bg-emerald-400 w-10 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : idx < currentIndex ? 'bg-emerald-600/50' : 'bg-slate-700'}`} 
            />
          ))}
        </div>
      </div>

      {/* KHUNG HIỂN THỊ ĐỀ BÀI TOÁN HỌC */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 flex flex-col justify-between space-y-6">
        
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col justify-center items-center min-h-[220px] relative overflow-hidden">
          <span className="absolute top-4 left-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Nội dung thử thách</span>
          
          <div className="w-full text-center text-slate-900 text-xl md:text-2xl font-bold py-4 overflow-x-auto">
            <BlockMath math={currentQuestion?.question || ''} />
          </div>

          {/* Hiển thị đồ thị / hình vẽ đi kèm câu hỏi nếu có */}
          {currentQuestion?.imageUrl && (
            <div className="my-2 border border-slate-100 rounded-xl p-1 bg-slate-50 max-h-40 overflow-hidden flex justify-center">
              <img src={currentQuestion.imageUrl} alt="Hình vẽ minh họa" className="object-contain h-full max-h-36" />
            </div>
          )}
        </div>

        {/* CÁC KHỐI ĐÁP ÁN ĐỂ LỰA CHỌN TRỰC TIẾP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentQuestion?.options && Object.entries(currentQuestion.options).map(([key, value]: any) => {
            const isSelected = selectedAnswer === key;
            let btnStyle = "bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-400 hover:shadow-md shadow-sm";
            
            // Logic đổi màu phản hồi trạng thái đúng / sai ngay lập tức
            if (isAnswered) {
              if (key === currentQuestion.correctAnswer) {
                btnStyle = "bg-emerald-500 border-emerald-600 text-white shadow-[0_4px_0_0_#059669]";
              } else if (isSelected) {
                btnStyle = "bg-rose-500 border-rose-600 text-white shadow-[0_4px_0_0_#E11D48]";
              } else {
                btnStyle = "bg-slate-100 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed";
              }
            }

            return (
              <button
                key={key}
                disabled={isAnswered}
                onClick={() => handleCheckAnswer(key)}
                className={`p-4 md:p-5 rounded-2xl font-bold text-left text-sm md:text-base transition-all duration-150 flex items-center gap-3 group active:scale-[0.99] ${btnStyle}`}
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-widest transition-colors ${isAnswered ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                  {key}
                </span>
                <span className="flex-1 truncate">{value}</span>
              </button>
            );
          })}
        </div>

        {/* THANH ĐIỀU KHIỂN CHUYỂN CÂU */}
        <div className="h-16 flex justify-end items-center">
          {isAnswered && (
            <button
              onClick={handleNext}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {currentIndex + 1 === questions.length ? 'Xem kết quả 🏁' : 'Câu tiếp theo ⏭️'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}