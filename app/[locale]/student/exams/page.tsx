'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function StudentExamsLobby() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinArena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('Mã đấu trường phải gồm 6 chữ số.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'arenas'), where('pinCode', '==', pin));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Mã đấu trường không tồn tại hoặc đã hết hạn.');
        setIsLoading(false);
        return;
      }

      // Valid PIN
      router.push(`/student/exams/room?pin=${pin}`);
    } catch (err) {
      console.error('Lỗi khi tham gia đấu trường:', err);
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-700 dark:text-slate-300 transition-colors duration-500 overflow-hidden relative">
      
      {/* Background decorations */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-orange-300/30 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-300/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.push('/student/home')}
            className="text-2xl hover:scale-110 transition-transform"
          >
            ⬅️
          </button>
          <span className="font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Phòng Thi Thực Tế
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md w-full p-8 md:p-10 text-center space-y-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl"
        >
          <div className="space-y-4">
            <span className="text-6xl inline-block animate-bounce">⚔️</span>
            <h1 className="text-3xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500">
              Sảnh Đấu Trường
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              Nhập mã PIN gồm 6 chữ số do giáo viên cung cấp để tham gia làm bài.
            </p>
          </div>

          <form onSubmit={handleJoinArena} className="space-y-6">
            <div>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full text-center text-4xl tracking-[1em] font-black font-mono p-4 bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all text-slate-800 dark:text-white"
              />
            </div>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm font-bold bg-red-100/50 dark:bg-red-500/10 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading || pin.length !== 6}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-lg uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang kết nối...' : 'Tham Gia Ngay'}
            </button>
          </form>
        </motion.div>
      </main>

    </div>
  );
}