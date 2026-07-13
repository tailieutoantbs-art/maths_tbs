'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GameLobbyPage() {
  const router = useRouter();
  const [pinCode, setPinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pinCode.trim() || !studentName.trim()) {
      alert("Các chiến binh vui lòng nhập đầy đủ Mã phòng và Tên hiển thị nhé!");
      return;
    }

    setIsJoining(true);
    // TODO: Truy vấn Firebase kiểm tra mã PIN có hợp lệ không
    setTimeout(() => {
      router.push(`/games/play/${pinCode}?name=${encodeURIComponent(studentName)}`);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] flex items-center justify-center p-4 relative overflow-hidden">
      {/* VÒNG TRÒN TRANG TRÍ BACKGROUND */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-sky-300/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="max-w-md w-full z-10">
        
        {/* HEADER CÂU LẠC BỘ */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-block px-4 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/80 shadow-sm mb-2">
            <span className="text-xs font-black text-[#0284C7] uppercase tracking-widest">
              CLB Vui Học Toán - TBS
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0284C7] to-sky-400 drop-shadow-sm uppercase tracking-wide">
            Đấu Trường
            <br />
            Toán Học
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
            Sẵn sàng bứt phá giới hạn tư duy!
          </p>
        </div>

        {/* KHUNG NHẬP MÃ PIN */}
        <div className="bg-white/70 backdrop-blur-xl border-2 border-white/90 p-8 rounded-[2rem] shadow-2xl relative">
          
          <form onSubmit={handleJoinGame} className="space-y-6">
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
                className="w-full py-4 bg-gradient-to-b from-emerald-400 to-emerald-500 text-white text-lg font-black rounded-2xl shadow-[0_6px_0_0_#047857] active:translate-y-1.5 active:shadow-[0_0px_0_0_#047857] transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isJoining ? (
                  <span className="animate-pulse">Đang kết nối... 🚀</span>
                ) : (
                  'Tham Gia Ngay'
                )}
              </button>
            </div>
          </form>

        </div>
        
        <div className="text-center mt-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Nền tảng Gamification © 2026 Tổ Toán TBS
          </p>
        </div>

      </div>
    </main>
  );
}