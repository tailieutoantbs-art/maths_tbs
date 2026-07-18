'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function StudentLoginPage() {
  const router = useRouter();
  const t = useTranslations('StudentLogin');
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [classroom, setClassroom] = useState('10A1');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentId.trim()) {
      alert('Vui lòng nhập đầy đủ Họ Tên và Mã Học Sinh');
      return;
    }

    setIsLoading(true);
    
    try {
      const studentRef = doc(db, 'students', studentId.toUpperCase());
      const studentSnap = await getDoc(studentRef);
      
      const sessionData = {
        fullName: fullName.trim(),
        studentId: studentId.toUpperCase(),
        classroom,
      };

      if (!studentSnap.exists()) {
        await setDoc(studentRef, {
          ...sessionData,
          arenaPoints: 0,
          level: 'Tân binh',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } else {
        await setDoc(studentRef, {
          ...sessionData,
          lastLogin: serverTimestamp(),
        }, { merge: true });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('student_session', JSON.stringify(sessionData));
        localStorage.setItem('studentName', sessionData.fullName);
        localStorage.setItem('studentClass', sessionData.classroom);
      }
      router.push('/student/home');
    } catch (error) {
      console.error('Lỗi đăng nhập học sinh:', error);
      alert('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] dark:bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-10 left-10 w-72 h-72 bg-sky-300/30 dark:bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="glass-card max-w-md w-full p-8 z-10 text-center space-y-6">
        <div>
          <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-3 py-1 rounded-full uppercase tracking-widest">
            {t('systemName')}
          </span>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide mt-3">
            {t('pageTitle')}
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block pl-1">{t('fullNameLabel')}</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('fullNamePlaceholder')} 
              className="w-full p-3.5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block pl-1">{t('studentIdLabel')}</label>
              <input 
                type="text" 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder={t('studentIdPlaceholder')} 
                className="w-full p-3.5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl font-bold text-sm text-center text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block pl-1">{t('classLabel')}</label>
              <select 
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl font-bold text-sm text-center text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 transition-all"
              >
                <option>10A1</option><option>10A2</option>
                <option>11A1</option><option>11A2</option>
                <option>12A1</option><option>12A2</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-gradient-to-b from-sky-400 to-blue-500 text-white font-black text-sm uppercase rounded-2xl tracking-widest shadow-[0_5px_0_0_#0284C7] active:translate-y-1 active:shadow-[0_0px_0_0_#0284C7] transition-all flex justify-center items-center"
          >
            {isLoading ? t('authenticating') : t('enterPortal')}
          </button>
        </form>

        <div className="pt-2">
          <button onClick={() => router.push('/')} className="text-xs font-bold text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 underline underline-offset-4 transition-colors">
            {t('backToMain')}
          </button>
        </div>
      </div>
    </main>
  );
}