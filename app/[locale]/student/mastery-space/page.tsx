'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function MasterySpacePage() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const q = query(collection(db, 'interactive_modules'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data: any[] = [];
        snap.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setModules(data);
      } catch (error) {
        console.error("Lỗi tải modules:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModules();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 pt-24 font-sans relative overflow-hidden">
      {/* Gamified Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px]"></div>
        {/* Lưới giả lập không gian */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col h-full gap-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              Mastery Space (Không Gian Rèn Luyện)
            </h1>
            <p className="text-gray-400 text-lg">Chinh phục các thử thách tương tác và nhận điểm EXP.</p>
          </div>
          <button 
            onClick={() => router.push('/student')}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 backdrop-blur-md"
          >
            Về Trang Chủ
          </button>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm">
            <p className="text-xl mb-4">Chưa có nhiệm vụ tương tác nào được tạo.</p>
            <p className="text-sm">Giáo viên của bạn có thể tạo chúng trong Interactive Studio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all cursor-pointer overflow-hidden shadow-xl"
                onClick={() => router.push(`/student/mastery-space/${mod.id}`)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[50px] group-hover:bg-emerald-500/30 transition-all"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
                      {mod.topic || 'Chưa phân loại'}
                    </span>
                    <span className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                      <i className="fa-solid fa-star"></i> +EXP
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                    {mod.storyContext || 'Hoàn thành bài tập để nhận thưởng.'}
                  </p>
                  
                  <button className="w-full py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 group-hover:from-emerald-500 group-hover:to-cyan-500 text-emerald-300 group-hover:text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    Bắt đầu nhiệm vụ
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
