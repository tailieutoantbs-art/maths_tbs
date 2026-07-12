'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface DashboardStats {
  totalLectures: number;
  totalExams: number;
  totalResults: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalLectures: 0,
    totalExams: 0,
    totalResults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const lecturesSnap = await getDocs(collection(db, 'lectures'));
        const examsSnap = await getDocs(collection(db, 'exams'));
        const resultsSnap = await getDocs(collection(db, 'exam_results'));

        setStats({
          totalLectures: lecturesSnap.size,
          totalExams: examsSnap.size,
          totalResults: resultsSnap.size,
        });
      } catch (error) {
        console.error("Lỗi đồng bộ số liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sky-300/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-300/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-8 z-10 relative">
          
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 md:p-8 rounded-[2rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-[#0284C7]/10 text-[#0284C7] text-xs font-black rounded-full uppercase tracking-widest">Không gian làm việc số</span>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] uppercase tracking-wide mt-2">Hệ Thống Học Tập Tương Tác</h1>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Trung tâm quản trị chuyên môn & khảo thí toán TBS</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => router.push('/student/profile')} className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl shadow-[0_4px_0_0_#4C1D95] active:translate-y-1 active:shadow-[0_0px_0_0_#4C1D95] transition-all text-xs uppercase tracking-wider flex items-center gap-2">👤 Hồ Sơ Học Sinh</button>
              <button onClick={() => { if(confirm("Thầy có chắc chắn muốn đăng xuất không?")) router.push('/login'); }} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:text-rose-600 transition-all text-xs uppercase">Đăng Xuất</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-lg flex items-center justify-between group hover:shadow-xl transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kho học liệu số</span>
                <span className="text-sm font-black text-slate-700 block uppercase">Bài Giảng Đã Lưu</span>
              </div>
              <div className="text-3xl font-mono font-black text-[#0284C7] bg-sky-50 px-4 py-2 rounded-2xl border border-sky-100 min-w-[70px] text-center shadow-inner">{loading ? '...' : stats.totalLectures}</div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-lg flex items-center justify-between group hover:shadow-xl transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ngân hàng đề thi</span>
                <span className="text-sm font-black text-slate-700 block uppercase">Đề Khảo Sát</span>
              </div>
              <div className="text-3xl font-mono font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 min-w-[70px] text-center shadow-inner">{loading ? '...' : stats.totalExams}</div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-lg flex items-center justify-between group hover:shadow-xl transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Đánh giá năng lực</span>
                <span className="text-sm font-black text-slate-700 block uppercase">Lượt Học Sinh Làm Bài</span>
              </div>
              <div className="text-3xl font-mono font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 min-w-[70px] text-center shadow-inner">{loading ? '...' : stats.totalResults}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 pl-1">Bàn Điều Khiển Phân Khu Tính Năng</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px]">
                <div className="space-y-2">
                  <div className="text-3xl">📚</div>
                  <h4 className="text-base font-black text-slate-700 uppercase tracking-wide">Kho Bài Giảng</h4>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">Soạn thảo, quản lý cấu trúc bài giảng tích hợp sơ đồ đồ họa đa phương tiện và Cloudinary.</p>
                </div>
                <button onClick={() => router.push('/department/lectures')} className="w-full mt-4 py-3 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all">Truy Cập Ngay</button>
              </div>

              {/* THẺ TÍNH NĂNG MỚI: TRỢ LÝ KẾ HOẠCH CHUYÊN MÔN */}
<div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px] border-blue-200 shadow-blue-50/50">
  <div className="space-y-2">
    <div className="text-3xl">📝</div>
    <h4 className="text-base font-black text-blue-700 uppercase tracking-wide">Trợ Lý Kế Hoạch</h4>
    <p className="text-xs font-semibold text-slate-400 leading-relaxed">Tự động hóa xây dựng Phụ lục I, II, III chuẩn Công văn 05/SGDĐT-GDPT.</p>
  </div>
  <button 
    onClick={() => router.push('/plan-assistant')} 
    className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#1E3A8A] active:translate-y-1 active:shadow-[0_0px_0_0_#1E3A8A] transition-all"
  >
    Soạn Hồ Sơ
  </button>
</div>

              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px]">
                <div className="space-y-2">
                  <div className="text-3xl">📐</div>
                  <h4 className="text-base font-black text-slate-700 uppercase tracking-wide">Ngân Hàng Đề Thi</h4>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">Quản lý và khởi tạo ma trận đề thi trắc nghiệm hỗn hợp MCQ, Đúng/Sai TF, Điền số SA.</p>
                </div>
                <button onClick={() => router.push('/exams')} className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#B45309] active:translate-y-1 active:shadow-[0_0px_0_0_#B45309] transition-all">Truy Cập Ngay</button>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px]">
                <div className="space-y-2">
                  <div className="text-3xl">🎮</div>
                  <h4 className="text-base font-black text-slate-700 uppercase tracking-wide">Đấu Trường Real-time</h4>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">Kích hoạt phòng chơi tương tác trực tiếp cho học sinh với luật chơi Đúng +10, Sai -5.</p>
                </div>
                <button onClick={() => router.push('/games/host')} className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#6B21A8] active:translate-y-1 active:shadow-[0_0px_0_0_#6B21A8] transition-all">Mở Phòng Chơi</button>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px]">
                <div className="space-y-2">
                  <div className="text-3xl">📊</div>
                  <h4 className="text-base font-black text-slate-700 uppercase tracking-wide">Bảng Điểm & Báo Cáo</h4>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">Theo dõi điểm số thực tế của học sinh và kết xuất báo cáo dữ liệu trực tiếp sang Google Sheets.</p>
                </div>
                <button onClick={() => router.push('/exams/results')} className="w-full mt-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#BE123C] active:translate-y-1 active:shadow-[0_0px_0_0_#BE123C] transition-all">Xem Báo Cáo</button>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px]">
                <div className="space-y-2">
                  <div className="text-3xl">📁</div>
                  <h4 className="text-base font-black text-slate-700 uppercase tracking-wide">Kho Tài Liệu Số</h4>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">Lưu trữ chuyên môn: Giáo án Word, PDF, LaTeX dành cho THCS, THPT và Luyện thi THPT Quốc gia.</p>
                </div>
                <button onClick={() => router.push('/documents')} className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-[0_0px_0_0_#047857] transition-all">Truy Cập Kho</button>
              </div>

              {/* THẺ TÍNH NĂNG MỚI: TRỢ LÝ AI SOẠN ĐỀ */}
              <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px] border-purple-200 shadow-purple-50/50">
                <div className="space-y-2">
                  <div className="text-3xl">🔮</div>
                  <h4 className="text-base font-black text-purple-700 uppercase tracking-wide">Trợ Lý AI Soạn Đề</h4>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">Tự động hóa biên soạn câu hỏi chứa LaTeX chuẩn xác theo chuyên đề và mức độ phân hóa.</p>
                </div>
                <button onClick={() => router.push('/ai-assistant')} className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#4C1D95] active:translate-y-1 active:shadow-[0_4px_0_0_#4C1D95] transition-all">Kích Hoạt AI</button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}