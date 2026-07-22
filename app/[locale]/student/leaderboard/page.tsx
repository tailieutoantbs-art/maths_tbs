'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
  const router = useRouter();
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '10' | '11' | '12'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'students'),
          orderBy('arenaPoints', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let filtered = data;
        if (filter !== 'all') {
          filtered = data.filter(s => s.classroom && s.classroom.startsWith(filter));
        }
        
        setTopStudents(filtered);
      } catch (error) {
        console.error("Lỗi lấy bảng vàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filter]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/student/home')} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-md hover:scale-110 transition-transform">
            ⬅️
          </button>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 uppercase tracking-widest">
              Bảng Vàng Vinh Danh
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              Top các chiến binh sở hữu Điểm EXP cao nhất
            </p>
          </div>
        </div>

        {/* BỘ LỌC */}
        <div className="flex gap-2 bg-white/70 dark:bg-slate-900/70 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit">
          <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${filter === 'all' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Toàn trường</button>
          <button onClick={() => setFilter('10')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${filter === '10' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Khối 10</button>
          <button onClick={() => setFilter('11')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${filter === '11' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Khối 11</button>
          <button onClick={() => setFilter('12')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${filter === '12' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Khối 12</button>
        </div>

        {/* BẢNG XẾP HẠNG */}
        {loading ? (
          <div className="text-center p-12 text-orange-500 font-bold uppercase animate-pulse">Đang nạp dữ liệu Bảng Vàng...</div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-16">Hạng</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Chiến binh</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-24">Lớp</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right w-32">Tổng EXP</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((student, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={student.id} 
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="p-4 text-center">
                      {index === 0 ? <span className="text-3xl drop-shadow-md">👑</span> : 
                       index === 1 ? <span className="text-2xl drop-shadow-md">🥈</span> : 
                       index === 2 ? <span className="text-2xl drop-shadow-md">🥉</span> : 
                       <span className="text-lg font-black text-slate-400 group-hover:text-orange-500">#{index + 1}</span>}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-sm text-slate-700 dark:text-slate-200">{student.fullName || 'Ẩn danh'}</div>
                      <div className="flex gap-1 mt-1">
                        {student.badges?.map((badge: string) => (
                          <span key={badge} className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[9px] font-bold rounded-full uppercase">{badge}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg uppercase">
                        {student.classroom || '???'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-lg font-black text-orange-500 font-mono">
                        {student.arenaPoints?.toLocaleString() || 0} <span className="text-[10px] text-orange-300">EXP</span>
                      </span>
                    </td>
                  </motion.tr>
                ))}
                {topStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest">
                      Chưa có chiến binh nào lọt vào Bảng Vàng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  );
}
