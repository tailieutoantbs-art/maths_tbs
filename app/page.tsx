'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Khối Kính mờ Trung tâm */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-2xl rounded-3xl p-8 md:p-14 max-w-3xl w-full text-center relative z-10 transform transition-all hover:scale-[1.01]">
        
        <div className="inline-block bg-blue-50/50 text-[#0284C7] font-extrabold px-4 py-1.5 rounded-full text-sm mb-6 border border-blue-100 shadow-sm">
          Phiên bản 1.0 (Phát hành trực tuyến)
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] mb-4">
          Hệ Thống Học Tập Toán_TBS
        </h1>
        
        <p className="text-slate-600 mb-10 text-lg font-medium">
          Không gian tương tác trực quan dành cho học sinh THPT
        </p>
        
        {/* Khối hiển thị công thức */}
        <div className="bg-white/80 rounded-2xl p-6 mb-10 border border-blue-100 shadow-inner max-w-xl mx-auto">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            Công thức Newton-Leibniz
          </p>
          <div className="text-2xl md:text-3xl text-slate-800">
            <BlockMath math="\int_{a}^{b} f(x)dx = F(b) - F(a)" />
          </div>
        </div>

        <button 
          onClick={() => router.push('/login')}
          className="bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-bold py-4 px-10 rounded-2xl shadow-[0_6px_0_0_#0369A1] active:translate-y-1.5 active:shadow-[0_0px_0_0_#0369A1] transition-all uppercase tracking-widest text-base md:text-lg hover:brightness-110"
        >
          BẮT ĐẦU TRẢI NGHIỆM 🚀
        </button>

      </div>
    </main>
  );
}