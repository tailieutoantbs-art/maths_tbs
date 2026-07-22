'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function StudentHomePage() {
  const router = useRouter();
  const t = useTranslations('StudentHome');
  const [studentName, setStudentName] = useState('');
  const [classroom, setClassroom] = useState('10A1');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionStr = localStorage.getItem('student_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setStudentName(session.fullName);
        setClassroom(session.classroom || '10A1');
      } catch (e) {
        console.error(e);
      }
    } else {
      const nameFromUrl = new URLSearchParams(window.location.search).get('name');
      setStudentName(nameFromUrl || 'Chiến binh TBS');
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-700 dark:text-slate-300 transition-colors duration-500">
      
      {/* HEADER KHÔNG GIAN HỌC SINH */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">📐</span>
            <span className="font-black text-sm md:text-base text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {t('portalName')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">{classroom}</span>
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">👤 {studentName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
        
        {/* BANNER CHÀO MỪNG PHONG CÁCH GAMIFIED */}
        <div className="bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 dark:from-blue-900 dark:via-sky-800 dark:to-cyan-900 rounded-[2rem] p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
              IT Education Portal - Mr. Hung TBS
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">
              {t('welcomeBack', { name: studentName })}
            </h2>
            <p className="text-blue-50 text-xs md:text-sm font-medium opacity-90 leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          {/* Chỉ số rèn luyện cá nhân */}
          <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-100">{t('currentLevelLabel')}</p>
              <p className="text-sm font-black mt-0.5">{t('currentLevelValue')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-100">{t('arenaPointsLabel')}</p>
              <p className="text-sm font-black mt-0.5">⭐ 2,450 <span className="text-[10px] font-normal opacity-70">{t('pts')}</span></p>
            </div>
            <div className="hidden md:block bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-100">{t('weeklyQuestLabel')}</p>
              <p className="text-sm font-black mt-0.5">{t('weeklyQuestValue')}</p>
            </div>
          </div>
        </div>

        {/* CÁC CỬA VÀO HOẠT ĐỘNG CHÍNH */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            {t('arenaTitle')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* THẺ 1: CLB VUI HỌC TOÁN */}
            <Link 
              href={`/games?name=${encodeURIComponent(studentName)}`}
              className="group block glass-card p-6 border-2 border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-900/20 rounded-bl-[5rem] -z-10 group-hover:bg-sky-100/50 dark:group-hover:bg-sky-800/40 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform origin-left">🎮</span>
                <span className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-sky-100 dark:border-sky-800">
                  {t('gamificationBadge')}
                </span>
              </div>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                {t('clubTitle')}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                {t('clubDesc')}
              </p>
              <span className="inline-flex items-center gap-1.5 bg-sky-600 text-white text-xs font-black px-4 py-2 rounded-xl group-hover:bg-sky-700 transition-colors">
                {t('playNow')}
              </span>
            </Link>

            {/* THẺ 2: ĐẤU TRƯỜNG OLYMPIC */}
            <Link 
              href="/olympic"
              className="group block glass-card p-6 border-2 border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-900/20 rounded-bl-[5rem] -z-10 group-hover:bg-orange-100/50 dark:group-hover:bg-orange-800/40 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform origin-left">🏆</span>
                <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-100 dark:border-orange-800">
                  {t('vdcBadge')}
                </span>
              </div>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {t('olympicTitle')}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                {t('olympicDesc')}
              </p>
              <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl group-hover:bg-orange-700 transition-colors">
                {t('practiceNow')}
              </span>
            </Link>

          </div>
        </div>

        {/* CÁC TIỂU KHU HỌC TẬP CHÍNH KHÓA */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">
            {t('coreLearningTitle')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-4">
              <span className="text-3xl">📖</span>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('docsTitle')}</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t('docsDesc')}</p>
              </div>
            </div>
            <div className="glass-card p-5 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-4">
              <span className="text-3xl">📝</span>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('examRoomTitle')}</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t('examRoomDesc')}</p>
              </div>
            </div>
            <Link href="/student/leaderboard" className="glass-card p-5 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-4 hover:border-orange-400 dark:hover:border-orange-500 transition-colors group">
              <span className="text-3xl group-hover:scale-110 transition-transform">📊</span>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('reportCardTitle')} (Bảng Vàng)</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tra cứu điểm số & Thứ hạng</p>
              </div>
            </Link>
          </div>
        </div>

      </div>

      {/* NÚT THOÁT RA CỔNG CHÍNH */}
      <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 py-4 text-center mt-auto">
        <button 
          onClick={() => router.push('/')}
          className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          {t('logout')}
        </button>
      </footer>

    </main>
  );
}