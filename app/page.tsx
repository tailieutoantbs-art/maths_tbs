'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function WelcomePortal() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans relative">
      
      {/* Vòng tròn trang trí nền */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      {/* Phần nội dung chính đẩy ra giữa */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-8 md:p-12 max-w-3xl w-full text-center relative z-10 my-auto">
        
        {/* KHU VỰC LOGO CHÍNH THỨC */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-white border-4 border-sky-50 rounded-full flex items-center justify-center shadow-md overflow-hidden relative group">
            <img 
              src="/logo.png" 
              alt="Logo Toán TBS" 
              className="w-full h-full object-cover relative z-10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-4xl absolute text-slate-300 group-hover:scale-110 transition-transform">🏫</span>
          </div>
        </div>

        {/* Badge Phiên bản */}
        <div className="inline-block px-6 py-2 bg-sky-50 border border-sky-100 rounded-full mb-6">
          <span className="text-xs font-black text-sky-600 uppercase tracking-widest">
            Phiên bản 1.0 (Phát hành trực tuyến)
          </span>
        </div>

        {/* Tiêu đề chính */}
        <h1 className="text-4xl md:text-5xl font-black text-[#0284C7] mb-3 tracking-tight">
          Hệ Thống Học Tập<br />Toán_TBS
        </h1>
        <p className="text-slate-500 font-medium text-lg md:text-xl mb-10">
          Không gian tương tác trực quan dành cho học sinh THPT
        </p>

        {/* Khung Công thức Toán học */}
        <div className="border border-slate-200 rounded-3xl p-6 md:p-8 mb-10 bg-white relative shadow-sm">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Công thức Newton-Leibniz
          </span>
          <div className="text-3xl md:text-4xl text-slate-800 py-4 overflow-x-auto">
            <BlockMath math="\int_{a}^{b} f(x)dx = F(b) - F(a)" />
          </div>
        </div>

        {/* Khu vực Nút bấm phân luồng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/student/login')}
            className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0EA5E9] to-[#0284C7] rounded-2xl shadow-[0_6px_0_0_#0369A1] active:translate-y-1.5 active:shadow-[0_0px_0_0_#0369A1] transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="text-3xl mb-2 relative z-10">🎓</span>
            <span className="text-white font-black text-lg uppercase tracking-wider relative z-10">Khu Vực Học Sinh</span>
            <span className="text-sky-100 text-xs font-medium mt-1 relative z-10">Vào thi, luyện tập & trò chơi</span>
          </button>

          <button 
            onClick={() => router.push('/teacher/login')}
            className="group relative flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="text-3xl mb-2 relative z-10">👨‍🏫</span>
            <span className="text-slate-700 font-black text-lg uppercase tracking-wider relative z-10 group-hover:text-indigo-700 transition-colors">Khu Vực Giáo Viên</span>
            <span className="text-slate-400 text-xs font-medium mt-1 relative z-10 group-hover:text-indigo-500 transition-colors">Quản lý chuyên môn & ra đề</span>
          </button>
        </div>

      </div>
      
      {/* --- FOOTER: BẢN QUYỀN THƯƠNG HIỆU THẦY HÙNG TBS --- */}
      {/* Đã sửa lỗi ẩn footer, đảm bảo luôn hiển thị khi cuộn trang */}
      <div className="relative z-10 mt-6 md:mt-8 text-center space-y-1.5 pb-4">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
          © 2026 Bản quyền phần mềm: <span className="text-sky-600 text-[13px] font-extrabold ml-1">Thầy Hùng TBS</span>
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Tổ Toán - Trường TH, THCS và THPT Thanh Bình
        </p>
      </div>

    </main>
  );
}