'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Exam {
  id: string;
  title: string;
  duration: number; // Thời gian làm bài (phút)
  grade: string;    // Khối lớp (10, 11, 12)
  totalQuestions: number;
  createdAt: any;
}

function ExamManagementPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách đề thi từ Firebase thời gian thực
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data: Exam[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Exam);
        });
        setExams(data);
      } catch (error) {
        console.error("Lỗi tải danh sách đề thi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER KÍNH MỜ VỚI KHỐI 3D */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-200/50 rounded-full blur-3xl -z-10"></div>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] uppercase tracking-wide">
              Ngân Hàng Đề Thi
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
              Hệ thống đánh giá năng lực Tổ Toán TBS
            </p>
          </div>

          <div className="flex gap-3 z-10">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase"
            >
              ⬅ Về Dashboard
            </button>
            
            {/* NÚT TẠO ĐỀ MỚI ĐÃ ĐƯỢC KẾT NỐI ĐƯỜNG DẪN THỰC TẾ */}
            <button 
              onClick={() => router.push('/exams/create')}
              className="px-6 py-2.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all text-xs uppercase tracking-wider"
            >
              + Tạo Đề Thi Mới
            </button>
          </div>
        </div>

        {/* BẢNG DANH SÁCH ĐỀ THI TRỰC QUAN */}
        <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl">
          {loading ? (
            <div className="text-center py-10 text-sky-600 font-bold animate-pulse uppercase tracking-wider text-sm">
              Đang kết nối ngân hàng dữ liệu...
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium space-y-4">
              <p>Chưa có đề thi nào được khởi tạo trong hệ thống.</p>
              <button 
                onClick={() => router.push('/exams/create')}
                className="px-4 py-2 bg-white border border-sky-200 text-[#0284C7] font-bold text-xs uppercase rounded-xl hover:bg-sky-50 transition-colors shadow-sm"
              >
                Khởi tạo đề thi đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-sky-100">
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tên mã đề thi</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Khối lớp</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Thời gian</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Số câu hỏi</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-sky-50/50 transition-colors group">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-700 text-sm">{exam.title}</p>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 inline-block">ID: {exam.id}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-bold text-slate-600">Lớp {exam.grade}</td>
                      <td className="py-4 px-4 text-center text-sm font-bold text-[#0284C7]">{exam.duration} phút</td>
                      <td className="py-4 px-4 text-center text-sm font-medium text-slate-500">{exam.totalQuestions} câu</td>
                      <td className="py-4 px-4 text-center space-x-2">
                        <button 
  onClick={() => router.push('/exams/results')}
  className="px-3 py-1.5 bg-sky-100 text-[#0284C7] font-bold rounded-lg hover:bg-sky-200 transition-colors text-xs"
>
  Xem Điểm
</button>
                        <button className="px-3 py-1.5 bg-rose-100 text-rose-600 font-bold rounded-lg hover:bg-rose-200 transition-colors text-xs">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default function ProtectedExamManagement() {
  return (
    <AuthGuard>
      <ExamManagementPage />
    </AuthGuard>
  );
}