'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function StudentLoginPage() {
  const router = useRouter();
  const t = useTranslations('StudentLogin');
  
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // States for Change Password flow
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [foundStudent, setFoundStudent] = useState<any>(null);
  
  const performFirebaseInit = async (studentData: any) => {
    try {
      const studentRef = doc(db, 'students', studentData.id);
      const studentSnap = await getDoc(studentRef);
      
      const sessionData = {
        fullName: studentData.name,
        studentId: studentData.id,
        classroom: studentData.class,
        isGuest: false,
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
      console.error('Lỗi kết nối Firebase:', error);
      alert('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !password.trim()) {
      alert(t('alertEmptyFields'));
      return;
    }

    setIsLoading(true);
    
    try {
      const savedStudents = localStorage.getItem('tbs_students');
      let studentsList: any[] = [];
      if (savedStudents) {
        studentsList = JSON.parse(savedStudents);
      }
      
      const st = studentsList.find(s => s.id.toUpperCase() === studentId.toUpperCase());
      
      if (!st) {
        alert('Mã học sinh không tồn tại trên hệ thống!');
        setIsLoading(false);
        return;
      }
      
      // Check password
      const isPassCorrect = st.passChanged ? st.password === password : st.defaultPass === password;
      
      if (!isPassCorrect) {
        alert('Mật khẩu không chính xác!');
        setIsLoading(false);
        return;
      }
      
      setFoundStudent(st);
      
      if (!st.passChanged) {
        setIsFirstLogin(true);
        setIsLoading(false);
        return;
      }
      
      await performFirebaseInit(st);
      
    } catch (error) {
      console.error('Lỗi xác thực:', error);
      alert('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    setIsLoading(true);
    try {
      const savedStudents = localStorage.getItem('tbs_students');
      if (savedStudents) {
        const studentsList = JSON.parse(savedStudents);
        const updatedList = studentsList.map((s: any) => {
          if (s.id === foundStudent.id) {
            return { ...s, password: newPassword, passChanged: true };
          }
          return s;
        });
        localStorage.setItem('tbs_students', JSON.stringify(updatedList));
      }
      
      await performFirebaseInit({...foundStudent, password: newPassword, passChanged: true});
      
    } catch(err) {
      console.error(err);
      alert('Đã xảy ra lỗi. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const sessionData = {
      fullName: 'Khách',
      studentId: 'GUEST',
      classroom: 'Guest',
      isGuest: true,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_session', JSON.stringify(sessionData));
      localStorage.setItem('studentName', sessionData.fullName);
      localStorage.setItem('studentClass', sessionData.classroom);
    }
    router.push('/student/home');
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
            {!isFirstLogin ? t('pageTitle') : t('changePasswordTitle')}
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
            {!isFirstLogin ? t('subtitle') : t('changePasswordSubtitle')}
          </p>
        </div>

        {/* Thông tin học sinh nếu đã xác thực thành công (chờ đổi pass) */}
        {foundStudent && isFirstLogin && (
          <div className="bg-sky-50 dark:bg-slate-900/50 p-4 rounded-xl border border-sky-100 dark:border-slate-800 text-left">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Xin chào, <span className="font-bold text-sky-600 dark:text-sky-400">{foundStudent.name}</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Lớp: <span className="font-bold">{foundStudent.class}</span>
            </p>
          </div>
        )}

        {!isFirstLogin ? (
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block pl-1">{t('studentIdLabel')}</label>
              <input 
                type="text" 
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder={t('studentIdPlaceholder')} 
                className="w-full p-3.5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl font-bold text-sm text-center text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block pl-1">{t('passwordLabel')}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')} 
                className="w-full p-3.5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl font-bold text-sm text-center text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-2 bg-gradient-to-b from-sky-400 to-blue-500 text-white font-black text-sm uppercase rounded-2xl tracking-widest shadow-[0_5px_0_0_#0284C7] active:translate-y-1 active:shadow-[0_0px_0_0_#0284C7] transition-all flex justify-center items-center"
            >
              {isLoading ? t('authenticating') : t('enterPortal')}
            </button>
            
            <div className="pt-2 text-center">
              <button 
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t('guestLogin') || 'Đăng nhập với tư cách Khách'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block pl-1">{t('newPasswordLabel')}</label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')} 
                className="w-full p-3.5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl font-bold text-sm text-center text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block pl-1">{t('confirmPasswordLabel')}</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')} 
                className="w-full p-3.5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl font-bold text-sm text-center text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:focus:ring-sky-900/30 transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-2 bg-gradient-to-b from-sky-400 to-blue-500 text-white font-black text-sm uppercase rounded-2xl tracking-widest shadow-[0_5px_0_0_#0284C7] active:translate-y-1 active:shadow-[0_0px_0_0_#0284C7] transition-all flex justify-center items-center"
            >
              {isLoading ? t('authenticating') : t('changePasswordBtn')}
            </button>
          </form>
        )}

        <div className="pt-2">
          <button onClick={() => router.push('/')} className="text-xs font-bold text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 underline underline-offset-4 transition-colors">
            {t('backToMain')}
          </button>
        </div>
      </div>
    </main>
  );
}