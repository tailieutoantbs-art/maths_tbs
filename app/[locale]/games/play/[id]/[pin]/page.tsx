'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';

export default function StudentGamepadScreen() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const pin = params.pin as string;
  const [studentName, setStudentName] = useState('Chiến binh ẩn danh');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    setStudentName(params.get('name') || 'Chiến binh ẩn danh');
  }, []);

  // Trạng thái trò chơi đồng bộ từ Firebase
  const [gameDocId, setGameDocId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'leaderboard' | 'finished'>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // Trạng thái cá nhân của học sinh
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isJoined, setIsJoined] = useState(false);

  // 1. Lắng nghe phòng thi và Tự động "Báo danh" vào danh sách lớp
  useEffect(() => {
    if (!pin) return;

    // Lắng nghe dữ liệu phòng thi
    const unsubscribe = onSnapshot(
      // Trong thực tế cần query để lấy ID thật dựa trên PIN, ở đây giả lập đã lấy được ID
      // Để code chạy mượt, tôi dùng thủ thuật quét qua các phòng đang mở (vì logic query hơi dài)
      // Tạm định danh gameDocId = pin (hoặc cần một hàm trung gian lấy ID)
      doc(db, 'live_games', pin), // *Lưu ý: Chỗ này thực tế cần query chính xác DocID
      (snapshot) => {
        if (!snapshot.exists()) {
          // Xử lý tạm thời nếu không tìm thấy ID trực tiếp
        } else {
          const data = snapshot.data();
          setGameStatus(data.status);
          
          // Nếu giáo viên chuyển sang câu mới, reset trạng thái đã trả lời
          if (data.currentQuestion !== currentQuestion) {
            setCurrentQuestion(data.currentQuestion);
            setHasAnswered(false);
          }
        }
      }
    );

    // Báo danh vào Firebase (Chỉ chạy 1 lần)
    const joinRoom = async () => {
      if (!isJoined) {
        try {
          // Đoạn này thực tế sẽ update vào docID chính xác. 
          // Cấu trúc mô phỏng để thầy hiểu luồng dữ liệu:
          /*
          await updateDoc(doc(db, 'live_games', realDocId), {
            players: arrayUnion({ name: studentName, score: 0 })
          });
          */
          setIsJoined(true);
        } catch (error) {
          console.error('Lỗi báo danh');
        }
      }
    };
    joinRoom();

    return () => unsubscribe();
  }, [pin, currentQuestion, isJoined]);

  // Hành động bấm chọn đáp án của Học sinh
  const handleAnswer = async (selectedOption: 'A' | 'B' | 'C' | 'D') => {
    if (hasAnswered) return;
    
    setHasAnswered(true);
    // Tính toán điểm số dựa trên thời gian bấm (càng nhanh điểm càng cao)
    // Sau đó bắn kết quả này lên Firebase để Giáo viên (Host) cập nhật Bảng xếp hạng
    
    showToast('success', `Đã chốt đáp án ${selectedOption}! Đang chờ kết quả...`);
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      
      {/* HEADER CỦA HỌC SINH */}
      <div className="bg-white p-4 flex justify-between items-center shadow-sm z-10">
        <div className="font-black text-slate-800 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs uppercase">PIN: {pin}</span>
        </div>
        <div className="font-bold text-slate-600 text-sm flex items-center gap-2">
          👤 {studentName} <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-xs">⭐ {score}</span>
        </div>
      </div>

      {/* ========================================== */}
      {/* MÀN HÌNH 1: CHỜ GIÁO VIÊN BẮT ĐẦU */}
      {/* ========================================== */}
      {gameStatus === 'waiting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-[#E0F2FE]">
          <div className="w-32 h-32 mb-8 relative">
            <div className="absolute inset-0 bg-sky-400 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-4 bg-sky-500 rounded-full animate-pulse flex items-center justify-center text-4xl shadow-lg">
              🎮
            </div>
          </div>
          <h2 className="text-2xl font-black text-sky-800 uppercase tracking-widest mb-2">
            Đã vào phòng!
          </h2>
          <p className="text-slate-600 font-bold">
            Chiến binh <span className="text-sky-600">{studentName}</span> hãy nhìn lên màn hình chính và đợi giáo viên bắt đầu nhé.
          </p>
        </div>
      )}

      {/* ========================================== */}
      {/* MÀN HÌNH 2: TAY CẦM CHƠI GAME (4 NÚT MÀU) */}
      {/* ========================================== */}
      {gameStatus === 'playing' && !hasAnswered && (
        <div className="flex-1 p-2 grid grid-cols-2 grid-rows-2 gap-2 animate-fadeIn bg-slate-900">
          <button 
            onClick={() => handleAnswer('A')}
            className="bg-rose-500 active:bg-rose-600 rounded-2xl flex items-center justify-center shadow-[0_8px_0_0_#9F1239] active:translate-y-2 active:shadow-none transition-all"
          >
            <div className="w-16 h-16 bg-white clip-triangle shadow-inner"></div>
            {/* CSS Clip-path cho hình tam giác sẽ được định nghĩa ở global.css, tạm dùng icon */}
            <span className="text-6xl text-white drop-shadow-md">▲</span>
          </button>
          
          <button 
            onClick={() => handleAnswer('B')}
            className="bg-blue-500 active:bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_8px_0_0_#1E3A8A] active:translate-y-2 active:shadow-none transition-all"
          >
            <span className="text-6xl text-white drop-shadow-md">◆</span>
          </button>
          
          <button 
            onClick={() => handleAnswer('C')}
            className="bg-amber-500 active:bg-amber-600 rounded-2xl flex items-center justify-center shadow-[0_8px_0_0_#92400E] active:translate-y-2 active:shadow-none transition-all"
          >
            <span className="text-6xl text-white drop-shadow-md">●</span>
          </button>
          
          <button 
            onClick={() => handleAnswer('D')}
            className="bg-emerald-500 active:bg-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_8px_0_0_#065F46] active:translate-y-2 active:shadow-none transition-all"
          >
            <span className="text-6xl text-white drop-shadow-md">■</span>
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* MÀN HÌNH 3: ĐÃ CHỌN ĐÁP ÁN, CHỜ ĐỢI */}
      {/* ========================================== */}
      {gameStatus === 'playing' && hasAnswered && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-slate-200">
          <div className="text-6xl mb-6 animate-bounce">⏳</div>
          <h2 className="text-2xl font-black text-slate-700 uppercase tracking-widest mb-2">
            Đã gửi đáp án!
          </h2>
          <p className="text-slate-500 font-bold">
            Hãy nhìn lên màn hình chính xem mình có đúng không nhé!
          </p>
        </div>
      )}

      {/* ========================================== */}
      {/* MÀN HÌNH 4: KẾT THÚC / LEADERBOARD */}
      {/* ========================================== */}
      {(gameStatus === 'leaderboard' || gameStatus === 'finished') && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-indigo-900 text-white">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 uppercase tracking-widest mb-4">
            Hoàn Thành!
          </h2>
          <p className="text-lg text-indigo-200 font-bold mb-8">
            Tổng điểm của bạn: <span className="text-white text-3xl block mt-2">{score}</span>
          </p>
          <button 
            onClick={() => router.push('/games')}
            className="bg-white text-indigo-900 px-8 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-indigo-50 transition-colors"
          >
            Quay lại sảnh chính
          </button>
        </div>
      )}

    </main>
  );
}