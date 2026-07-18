"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

function TeacherDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
        
        {/* --- KHU VỰC HEADER: THƯƠNG HIỆU TRƯỜNG & TỔ CHUYÊN MÔN --- */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100 gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-indigo-800 uppercase tracking-wide">
              CỔNG CÔNG NGHỆ THÔNG TIN - THẦY HÙNG TBS
            </h1>
            <h2 className="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest mt-1">
              Trung Tâm Điều Hành Chuyên Môn Tổ Toán
            </h2>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-rose-50 text-rose-600 font-bold text-sm uppercase rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
          >
            Đăng xuất 🚪
          </button>
        </div>

        {/* ========================================================= */}
        {/* ============ PHÂN HỆ QUẢN TRỊ / GIÁO VIÊN =============== */}
        {/* ========================================================= */}
        <div className="space-y-8">
          
          {/* NHÓM 1: CÔNG CỤ TRỢ LÝ AI (BIÊN SOẠN & KẾ HOẠCH) */}
          <div>
             <h3 className="text-lg font-black text-indigo-700 mb-4 flex items-center gap-2 border-b-2 border-indigo-50 pb-2">
               🤖 TRUNG TÂM TRỢ LÝ AI & BIÊN SOẠN
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Link href="/ai-assistant" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-purple-500">
                  <div className="text-4xl mb-3">🧠</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Trợ lý AI Năng Lực Số</h4>
                  <p className="text-xs text-slate-500 font-medium">Tích hợp AI thiết kế giáo án bài giảng mang định hướng phát triển năng lực số.</p>
                </Link>

                <Link href="/plan-assistant" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-blue-500">
                  <div className="text-4xl mb-3">📅</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Trợ lý Kế Hoạch</h4>
                  <p className="text-xs text-slate-500 font-medium">Xử lý Phụ lục 1, 2, 3: Lập kế hoạch dạy học, phân phối chương trình và ma trận đề.</p>
                </Link>

                <Link href="/editor" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-indigo-500">
                  <div className="text-4xl mb-3">✍️</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Trình Biên Soạn TBS</h4>
                  <p className="text-xs text-slate-500 font-medium">Không gian soạn thảo văn bản Toán học độc lập, kết xuất file chuẩn Word và LaTeX.</p>
                </Link>
             </div>
          </div>

          {/* NHÓM 2: QUẢN LÝ CHUYÊN MÔN & NGÂN HÀNG ĐỀ */}
          <div>
             <h3 className="text-lg font-black text-emerald-700 mb-4 flex items-center gap-2 border-b-2 border-emerald-50 pb-2 mt-8">
               📚 QUẢN LÝ CHUYÊN MÔN & NGÂN HÀNG ĐỀ
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <Link href="/teacher/news-editor" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-pink-500">
                  <div className="text-4xl mb-3">📢</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Cổng Thông Tin</h4>
                  <p className="text-xs text-slate-500 font-medium">Soạn thảo và đăng tải các bản tin, sự kiện, thông báo mới nhất.</p>
                </Link>

                <Link href="/users" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-sky-500">
                  <div className="text-4xl mb-3">🗂️</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Hồ Sơ & Nhân Sự</h4>
                  <p className="text-xs text-slate-500 font-medium">Quản lý tài khoản học sinh, reset mật khẩu và danh sách cán bộ giáo viên.</p>
                </Link>

                <Link href="/department" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-teal-500">
                  <div className="text-4xl mb-3">🏢</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Tổ Chuyên Môn Toán</h4>
                  <p className="text-xs text-slate-500 font-medium">Quản lý tiến độ nộp kế hoạch và đồng bộ dữ liệu điểm số lên Google Sheets.</p>
                </Link>

                <Link href="/exams" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-emerald-500">
                  <div className="text-4xl mb-3">📝</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Ngân Hàng Đề Thi V2</h4>
                  <p className="text-xs text-slate-500 font-medium">Tạo câu hỏi chuẩn JSON, quản lý đồ thị và đóng gói phôi đề kiểm tra.</p>
                </Link>

                <Link href="/documents" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-green-500">
                  <div className="text-4xl mb-3">📁</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Kho Tài Liệu Chung</h4>
                  <p className="text-xs text-slate-500 font-medium">Hệ thống lưu trữ chuyên đề, đề cương dùng chung cho toàn bộ giáo viên.</p>
                </Link>
             </div>
          </div>

          {/* NHÓM 3: HOẠT ĐỘNG NGOẠI KHÓA & MŨI NHỌN */}
          <div>
             <h3 className="text-lg font-black text-orange-600 mb-4 flex items-center gap-2 border-b-2 border-orange-50 pb-2 mt-8">
               🏆 HOẠT ĐỘNG ĐẶC THÙ & MŨI NHỌN
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <Link href="/games/setup" className="bg-gradient-to-br from-white to-sky-50 p-6 rounded-2xl shadow-sm border border-sky-100 hover:shadow-md transition-all hover:-translate-y-1 group flex items-center gap-6">
                  <div className="text-6xl group-hover:scale-110 transition-transform">🎮</div>
                  <div>
                    <h4 className="font-black text-sky-800 text-xl mb-1 uppercase tracking-wide">CLB VUI HỌC TOÁN - TBS</h4>
                    <p className="text-xs text-slate-600 font-medium">Xưởng điều hành Game: Mở phòng thi đấu trực tiếp (Live) và xuất bản mã Game Tự Luyện.</p>
                  </div>
                </Link>

                <Link href="/olympic" className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-all hover:-translate-y-1 group flex items-center gap-6">
                  <div className="text-6xl group-hover:scale-110 transition-transform">🏅</div>
                  <div>
                    <h4 className="font-black text-orange-800 text-xl mb-1 uppercase tracking-wide">Lộ trình Olympic 30/4</h4>
                    <p className="text-xs text-slate-600 font-medium">Quản lý kho tài nguyên VDC chuyên sâu (Đại số, Hình học, Số học, Tổ hợp) và sinh đề AI.</p>
                  </div>
                </Link>

             </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function ProtectedTeacherDashboard() {
  return (
    <AuthGuard>
      <TeacherDashboard />
    </AuthGuard>
  );
}