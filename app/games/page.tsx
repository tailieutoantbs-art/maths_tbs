'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

export default function GameJoinLobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Lấy tên học sinh tự động từ cổng đăng nhập chuyển qua (nếu có)
  const initialName = searchParams.get('name') || '';
  
  const [pin, setPin] = useState('');
  const [studentName, setStudentName] = useState(initialName);
  const [isJoining, setIsJoining] = useState(false);

  const handleEnterArena = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      showToast('warning', 'Sĩ tử vui lòng điền Mã PIN trận đấu!');
      return;
    }
    if (!studentName.trim()) {
      showToast('warning', 'Vui lòng điền Họ tên hoặc Biệt danh thi đấu!');
      return;
    }

    setIsJoining(true);

    // Giả lập quét phòng thi đấu thời gian thực trên Firebase
    setTimeout(() => {
      setIsJoining(false);
      
      // Chuẩn hóa định dạng PIN tự động viết hoa
      const formattedPin = pin.toUpperCase().trim();
      
      if (formattedPin.startsWith('TBS-') || formattedPin.length === 6) {
        showToast('success', '🚀 Kết nối Đấu trường thành công! Đang tiến vào phòng chờ...');
        // Luồng tiếp theo sẽ chuyển học sinh vào sảnh chờ thi đấu trực tuyến
      } else {
        showToast('error', 'Mã PIN không tồn tại hoặc trận đấu đã kết thúc!');
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      
      {/* Hiệu ứng lưới ma trận toán học chìm ở nền */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-twill.png')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* KHUNG ĐẦU TRƯỜNG CHÍNH */}
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] z-10 text-center space-y-8 animate-fadeIn">
        
        {/* LOGO ĐẤU TRƯỜNG */}
        <div className="space-y-2">
          <div className="text-6xl animate-bounce duration-1000">🎮</div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-sky-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent uppercase tracking-wider">
            CLB VUI HỌC TOÁN
          </h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Trường TH, THCS và THPT Thanh Bình
          </p>
        </div>

        {/* FORM NHẬP MÃ BÁO DANH */}
        <form onSubmit={handleEnterArena} className="space-y-4 text-left">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-purple-300 uppercase tracking-widest block pl-1">
              Mã PIN Trận Đấu:
            </label>
            <input 
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Nhập mã (VD: TBS-123456)"
              className="w-full p-4 bg-slate-950/60 border-2 border-slate-700 rounded-2xl font-black text-xl text-center text-yellow-300 tracking-widest focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all uppercase placeholder:text-sm placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-purple-300 uppercase tracking-widest block pl-1">
              Biệt danh chiến binh:
            </label>
            <input 
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nhập tên hiển thị trên bảng vàng..."
              className="w-full p-4 bg-slate-950/40 border-2 border-slate-700 rounded-2xl font-bold text-sm text-center text-white focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all placeholder:text-slate-500"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isJoining}
            className="w-full py-4 mt-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-base uppercase rounded-2xl tracking-widest shadow-[0_6px_0_0_#4C1D95] active:translate-y-1 active:shadow-[0_0px_0_0_#4C1D95] transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isJoining ? 'Đang tải phòng chờ... ⚡' : 'XUẤT TRẬN TẤN CÔNG 🚀'}
          </button>

        </form>

        {/* QUAY LẠI */}
        <div className="pt-2">
          <button 
            type="button"
            onClick={() => router.push('/student/home')}
            className="text-xs font-bold text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
          >
            ⬅ Trở về Không gian học tập
          </button>
        </div>

      </div>

      {/* FOOTER BẢN QUYỀN */}
      <div className="absolute bottom-6 w-full text-center pointer-events-none opacity-50">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Hệ sinh thái thông minh © 2026 - Phát triển bởi Thầy Hùng TBS
        </p>
      </div>

    </main>
  );
}