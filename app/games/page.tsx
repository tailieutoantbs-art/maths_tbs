'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';

export default function GameLobbyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Trạng thái chuyển đổi luồng (Học sinh nhập mã / Giáo viên tạo phòng)
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');

  // State cho Học sinh
  const [pinCode, setPinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // State cho Giáo viên
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState('exam_demo_1'); // Giả lập chọn đề

  // ==========================================
  // LUỒNG 1: HỌC SINH VÀO PHÒNG
  // ==========================================
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim() || !studentName.trim()) {
      showToast('warning', 'Các chiến binh vui lòng nhập đầy đủ Mã phòng và Biệt danh!');
      return;
    }
    setIsJoining(true);
    // TODO: Truy vấn Firebase xem mã PIN có tồn tại không trước khi vào
    setTimeout(() => {
      router.push(`/games/play/${pinCode}?name=${encodeURIComponent(studentName)}`);
    }, 1000);
  };

  // ==========================================
  // LUỒNG 2: GIÁO VIÊN TẠO PHÒNG (HOST)
  // ==========================================
  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      // 1. Sinh ngẫu nhiên mã PIN 6 chữ số
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Lưu phiên Game vào Firebase (Để học sinh có thể dò tìm)
      await addDoc(collection(db, 'live_games'), {
        pin: newPin,
        examId: selectedExamId,
        hostName: 'Giáo viên Toán TBS',
        status: 'waiting', // waiting, playing, finished
        createdAt: serverTimestamp(),
        players: []
      });

      showToast('success', `Đã khởi tạo thành công phòng thi: ${newPin}`);
      
      // 3. Chuyển giáo viên vào trang Quản trị phòng thi (Host)
      router.push(`/games/host/${newPin}`);
    } catch (error) {
      showToast('error', 'Lỗi khi tạo phòng thi. Vui lòng thử lại!');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-500">
      {/* VÒNG TRÒN TRANG TRÍ BACKGROUND */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-sky-300/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="max-w-md w-full z-10">
        
        {/* HEADER CÂU LẠC BỘ */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-block px-4 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/80 shadow-sm mb-2 cursor-pointer" onClick={() => setViewMode(viewMode === 'student' ? 'teacher' : 'student')}>
            <span className="text-xs font-black text-[#0284C7] uppercase tracking-widest hover:text-indigo-600 transition-colors">
              {viewMode === 'student' ? 'CLB Vui Học Toán - TBS' : 'Trung Tâm Điều Hành - TBS'}
            </span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text drop-shadow-sm uppercase tracking-wide transition-all ${viewMode === 'student' ? 'bg-gradient-to-br from-[#0284C7] to-sky-400' : 'bg-gradient-to-br from-indigo-600 to-purple-500'}`}>
            Đấu Trường
            <br />
            Toán Học
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
            {viewMode === 'student' ? 'Sẵn sàng bứt phá giới hạn tư duy!' : 'Thiết lập đấu trường trực tiếp'}
          </p>
        </div>

        {/* KHUNG INTERFACE CHÍNH (LẬT 2 MẶT ẢO) */}
        <div className="bg-white/70 backdrop-blur-xl border-2 border-white/90 p-8 rounded-[2rem] shadow-2xl relative transition-all duration-500 transform">
          
          {viewMode === 'student' ? (
            /* ================= GIAO DIỆN HỌC SINH ================= */
            <form onSubmit={handleJoinGame} className="space-y-6 animate-fadeIn">
              <div className="space-y-2 text-center">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  Mã Phòng Chơi (Game PIN)
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                  placeholder="VD: 123456"
                  maxLength={6}
                  className="w-full text-center text-3xl font-black text-[#0284C7] tracking-[0.25em] p-4 bg-white/80 border-2 border-sky-100 rounded-2xl focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all shadow-inner placeholder:text-slate-200"
                />
              </div>

              <div className="space-y-2 text-center">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  Tên / Biệt danh của bạn
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="VD: Hải Đăng 10A1"
                  maxLength={20}
                  className="w-full text-center text-lg font-bold text-slate-700 p-4 bg-white/80 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all shadow-inner placeholder:text-slate-300"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-4 bg-gradient-to-b from-emerald-400 to-emerald-500 text-white text-lg font-black rounded-2xl shadow-[0_6px_0_0_#047857] active:translate-y-1.5 active:shadow-[0_0px_0_0_#047857] transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 hover:brightness-105"
                >
                  {isJoining ? <span className="animate-pulse">Đang kết nối... 🚀</span> : 'Tham Gia Ngay'}
                </button>
              </div>
            </form>
          ) : (
            /* ================= GIAO DIỆN GIÁO VIÊN TẠO PHÒNG ================= */
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 text-center">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  Chọn Bộ Đề Từ Ngân Hàng
                </label>
                <select 
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full text-center text-sm font-bold text-slate-700 p-4 bg-white/80 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                >
                  <option value="exam_demo_1">Đề kiểm tra 15p - Khảo sát hàm số</option>
                  <option value="exam_demo_2">Đề ôn tập - Xác suất thực nghiệm</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCreateGame}
                  disabled={isCreating}
                  className="w-full py-4 bg-gradient-to-b from-indigo-500 to-purple-600 text-white text-lg font-black rounded-2xl shadow-[0_6px_0_0_#4338CA] active:translate-y-1.5 active:shadow-[0_0px_0_0_#4338CA] transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 hover:brightness-105"
                >
                  {isCreating ? <span className="animate-pulse">Đang sinh mã PIN... ⚙️</span> : 'Phát Hành Mã Game'}
                </button>
              </div>
            </div>
          )}

        </div>
        
        {/* FOOTER & NÚT CHUYỂN ĐỔI LUỒNG */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Nền tảng Gamification © 2026 Tổ Toán TBS
          </p>
          <button 
            onClick={() => setViewMode(viewMode === 'student' ? 'teacher' : 'student')}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline underline-offset-4 transition-colors"
          >
            {viewMode === 'student' ? 'Giáo viên? Nhấn vào đây để tạo phòng' : 'Quay lại màn hình Học sinh'}
          </button>
        </div>

      </div>
    </main>
  );
}