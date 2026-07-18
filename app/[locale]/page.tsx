'use client';

import React from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import NewsFeed from '@/components/NewsFeed';
import UsefulLinks from '@/components/UsefulLinks';
import LinkDirectory from '@/components/LinkDirectory';

export default function WelcomePortal() {
  const router = useRouter();
  const t = useTranslations('Index');

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans">
      {/* Vòng tròn trang trí nền */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-4 py-8 md:p-8 relative z-10 flex flex-col min-h-screen">
        
        {/* Header Logo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-white border-2 border-sky-100 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
             <span className="text-2xl absolute text-slate-300">🏫</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#0284C7] tracking-tight leading-tight">
              {t('systemTitlePart1')} {t('systemTitlePart2')}
            </h1>
            <div className="inline-block px-3 py-1 bg-sky-50 border border-sky-100 rounded-full mt-1">
              <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">{t('versionBadge')}</span>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1">
          
          {/* Cột Trái: Đăng nhập (lg:col-span-3 or 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-6 text-center h-fit sticky top-8">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Cổng Đăng Nhập</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">{t('subtitle')}</p>

              {/* Khung Công thức Toán học */}
              <div className="border border-slate-200 rounded-2xl p-4 mb-6 bg-slate-50 relative shadow-inner">
                <div className="text-xl text-slate-700 py-2 overflow-x-auto">
                  <BlockMath math="\int_{a}^{b} f(x)dx = F(b) - F(a)" />
                </div>
              </div>

              {/* Nút bấm phân luồng */}
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => router.push('/student/login')}
                  className="group relative flex items-center justify-start p-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
                  <span className="text-3xl mr-4 relative z-10 bg-white/20 p-2 rounded-lg">🎓</span>
                  <div className="text-left relative z-10">
                    <div className="text-white font-black text-lg uppercase tracking-wider">{t('studentAreaTitle')}</div>
                    <div className="text-sky-100 text-[10px] font-medium">{t('studentAreaDesc')}</div>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/teacher/login')}
                  className="group relative flex items-center justify-start p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md active:scale-[0.98] transition-all overflow-hidden"
                >
                  <span className="text-3xl mr-4 relative z-10 bg-slate-50 group-hover:bg-indigo-50 p-2 rounded-lg transition-colors">👨‍🏫</span>
                  <div className="text-left relative z-10">
                    <div className="text-slate-700 font-black text-lg uppercase tracking-wider group-hover:text-indigo-700 transition-colors">{t('teacherAreaTitle')}</div>
                    <div className="text-slate-400 text-[10px] font-medium group-hover:text-indigo-500 transition-colors">{t('teacherAreaDesc')}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Cột Giữa: Main Feed (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-sky-500">■</span> Bảng Tin Mới
            </h2>
            <NewsFeed />
          </div>

          {/* Cột Phải: Liên Kết Hữu Ích (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <div className="sticky top-8">
              <UsefulLinks />
            </div>
          </div>

        </div>

        {/* Danh Bạ Liên Kết */}
        <LinkDirectory />

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200/50 text-center space-y-1 pb-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {t('footerCopyright')} <span className="text-sky-600 text-[13px] font-extrabold ml-1">{t('footerBrand')}</span>
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t('footerSub')}
          </p>
        </div>

      </div>
    </main>
  );
}