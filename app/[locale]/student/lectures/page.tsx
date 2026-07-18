'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentGuard from '@/components/StudentGuard';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function StudentLecturesPage() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const q = query(
          collection(db, 'lectures'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLectures(data);
      } catch (error) {
        console.error("Lỗi khi tải bài giảng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  return (
    <StudentGuard>
      <div className="min-h-screen bg-[#eaf4fb] p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide">Kho Tài Liệu Số</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Bài giảng và đề cương ôn tập dành cho học sinh</p>
            </div>
            <Link href="/student" className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors">
              ⬅ Quay lại
            </Link>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-slate-400 font-bold animate-pulse">Đang tải tài liệu...</p>
              </div>
            ) : lectures.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <span className="text-4xl mb-2">📚</span>
                <p className="text-slate-500 font-bold">Chưa có bài giảng nào được xuất bản.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lectures.map(lecture => (
                  <div key={lecture.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase">Bài Giảng</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{lecture.title || 'Tài liệu không tên'}</h3>
                    <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">
                      {lecture.description || 'Không có mô tả cho tài liệu này.'}
                    </p>
                    <a 
                      href={lecture.fileUrl || '#'} 
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase transition-colors"
                    >
                      Tải Xuống / Xem
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </StudentGuard>
  );
}
