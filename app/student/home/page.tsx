'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentHomePage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState('Chiến binh TBS');
  const classroom = '10A1'; // Giả lập dữ liệu lớp học

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const nameFromUrl = params.get('name') || 'Chiến binh TBS';
    setStudentName(nameFromUrl);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      
      {/* HEADER KHÔNG GIAN HỌC SINH */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">📐</span>
            <span className="font-black text-sm md:text-base text-blue-600 uppercase tracking-wider">
              TOÁN_TBS STUDENT Portal
            </span>
          </div>
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
            <span className="text-xs font-black text-slate-600 uppercase">{classroom}</span>
            <div className="w-px h-3 bg-slate-300"></div>
            <span className="text-xs font-bold text-slate-700">👤 {studentName}</span>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
        
        {/* BANNER CHÀO MỪNG PHONG CÁCH GAMIFIED */}
        <div className="bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 rounded-[2rem] p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
              Trường TH, THCS và THPT Thanh Bình
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">
              Chào mừng trở lại, {studentName}!
            </h2>
            <p className="text-blue-50 text-xs md:text-sm font-medium opacity-90 leading-relaxed">
              Hôm nay em muốn bứt phá giới hạn tư duy với Đấu trường kịch tính hay thử sức với những chuyên đề chuyên sâu của Đội tuyển Olympic?
            </p>
          </div>

          {/* Chỉ số rèn luyện cá nhân */}
          <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-100">Cấp độ hiện tại</p>
              <p className="text-sm font-black mt-0.5">🏆 Thợ săn Tích phân</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-100">Điểm liên đấu tích lũy</p>
              <p className="text-sm font-black mt-0.5">⭐ 2,450 <span className="text-[10px] font-normal opacity-70">pts</span></p>
            </div>
            <div className="hidden md:block bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-100">Nhiệm vụ tuần này</p>
              <p className="text-sm font-black mt-0.5">🎯 Hoàn thành 2 Game</p>
            </div>
          </div>
        </div>

        {/* CÁC CỬA VÀO HOẠT ĐỘNG CHÍNH */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            🚀 Khởi động Đấu Trường & Thử Thách
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* THẺ 1: CLB VUI HỌC TOÁN */}
            <Link 
              href={`/games?name=${encodeURIComponent(studentName)}`}
              className="group block bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-[5rem] -z-10 group-hover:bg-sky-100/50 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform origin-left">🎮</span>
                <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-sky-100">
                  Gamification
                </span>
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-1.5 group-hover:text-sky-600 transition-colors">
                CLB VUI HỌC TOÁN - TBS
              </h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mb-4">
                Tham gia thi đấu trực tiếp cùng cả lớp hoặc nhận mã nhiệm vụ tự luyện để cày điểm leo rank bảng vàng.
              </p>
              <span className="inline-flex items-center gap-1.5 bg-sky-600 text-white text-xs font-black px-4 py-2 rounded-xl group-hover:bg-sky-700 transition-colors">
                CHƠI NGAY ⏭️
              </span>
            </Link>

            {/* THẺ 2: ĐẤU TRƯỜNG OLYMPIC */}
            <Link 
              href="/olympic"
              className="group block bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[5rem] -z-10 group-hover:bg-orange-100/50 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform origin-left">🏆</span>
                <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-100">
                  Mũi Nhọn VDC
                </span>
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-1.5 group-hover:text-orange-600 transition-colors">
                HỌC SINH GIỎI OLYMPIC 30/4
              </h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mb-4">
                Thử sức với kho tài nguyên câu hỏi Vận dụng cao chia rõ rệt theo 4 mạch toán học chuyên sâu và lời giải chi tiết.
              </p>
              <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl group-hover:bg-orange-700 transition-colors">
                LUYỆN TẬP ⏭️
              </span>
            </Link>

          </div>
        </div>

        {/* CÁC TIỂU KHU HỌC TẬP CHÍNH KHÓA */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">
            📚 Phân hệ học tập chính khóa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
              <span className="text-3xl">📖</span>
              <div>
                <h5 className="font-bold text-slate-800 text-sm">Tài liệu & Chuyên đề</h5>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tải đề cương, bài tập phân phối từ tổ bộ môn.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
              <span className="text-3xl">📝</span>
              <div>
                <h5 className="font-bold text-slate-800 text-sm">Phòng Thi Kiểm Tra</h5>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tham gia làm các bài kiểm tra 15-45 phút lấy điểm thật.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
              <span className="text-3xl">📊</span>
              <div>
                <h5 className="font-bold text-slate-800 text-sm">Học bạ điện tử</h5>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Xem lịch sử điểm số và tiến độ rèn luyện năng lực số.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* NÚT THOÁT RA CỔNG CHÍNH */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center">
        <button 
          onClick={() => router.push('/')}
          className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
        >
          🚪 Đăng xuất khỏi Không gian học tập
        </button>
      </footer>

    </main>
  );
}