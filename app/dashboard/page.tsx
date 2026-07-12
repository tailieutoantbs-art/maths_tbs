"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function UnifiedDashboard() {
  // Biến trạng thái giả lập phân quyền. 
  // Thực tế sẽ được bảo vệ bởi components/AuthGuard.tsx và components/StudentGuard.tsx
  const [role, setRole] = useState<'teacher' | 'student'>('teacher'); 

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- KHU VỰC HEADER: THƯƠNG HIỆU TRƯỜNG --- */}
        <div className="text-center space-y-2 mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-800 uppercase tracking-wide">
            TRƯỜNG TH, THCS VÀ THPT THANH BÌNH
          </h1>
          <h2 className="text-lg md:text-xl font-bold text-gray-600">
            HỆ SINH THÁI GIÁO DỤC TOÁN HỌC - TBS
          </h2>
          
          {/* Nút Toggle Test Giao Diện */}
          <div className="mt-6 flex justify-center gap-4">
            <button 
              onClick={() => setRole('teacher')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${role === 'teacher' ? 'bg-indigo-600 text-white scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Góc nhìn Quản trị / Giáo viên
            </button>
            <button 
              onClick={() => setRole('student')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${role === 'student' ? 'bg-blue-500 text-white scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Góc nhìn Học sinh
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ============ PHÂN HỆ QUẢN TRỊ / GIÁO VIÊN =============== */}
        {/* ========================================================= */}
        {role === 'teacher' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* NHÓM 1: TRỢ LÝ TRÍ TUỆ NHÂN TẠO (AI) */}
            <div>
               <h3 className="text-xl font-extrabold text-indigo-700 mb-4 flex items-center gap-2 border-b-2 border-indigo-100 pb-2">
                 🤖 TRUNG TÂM TRỢ LÝ AI & BIÊN SOẠN
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Link href="/ai-assistant" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group">
                    <div className="text-3xl mb-3">🧠</div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Trợ lý AI Toán Học</h4>
                    <p className="text-sm text-gray-500">Tương tác AI giải toán, sinh câu hỏi và gợi ý phương pháp giải chuyên sâu.</p>
                  </Link>

                  <Link href="/plan-assistant" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group">
                    <div className="text-3xl mb-3">📅</div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Trợ lý Kế Hoạch (Plan)</h4>
                    <p className="text-sm text-gray-500">Tự động lập phân phối chương trình và xây dựng giáo án giảng dạy tối ưu.</p>
                  </Link>

                  <Link href="/editor" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-indigo-500">
                    <div className="text-3xl mb-3">✍️</div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Công cụ Biên Soạn - TBS</h4>
                    <p className="text-sm text-gray-500">Trình soạn thảo chuyên nghiệp, hỗ trợ xuất file chuẩn Microsoft Word và LaTeX.</p>
                  </Link>
               </div>
            </div>

            {/* NHÓM 2: QUẢN LÝ CHUYÊN MÔN & TÀI LIỆU */}
            <div>
               <h3 className="text-xl font-extrabold text-blue-700 mb-4 flex items-center gap-2 border-b-2 border-blue-100 pb-2">
                 📚 QUẢN LÝ CHUYÊN MÔN
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Link href="/department" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group">
                    <div className="text-3xl mb-3">🏢</div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Tổ Chuyên Môn Toán</h4>
                    <p className="text-sm text-gray-500">Quản lý nhân sự, phân công giảng dạy và theo dõi tiến độ chung của tổ.</p>
                  </Link>

                  <Link href="/documents" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group">
                    <div className="text-3xl mb-3">📁</div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Kho Tài Liệu Chung</h4>
                    <p className="text-sm text-gray-500">Hệ thống lưu trữ chuyên đề, đề cương dùng chung cho toàn bộ giáo viên.</p>
                  </Link>

                  <Link href="/exams" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group">
                    <div className="text-3xl mb-3">📝</div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Quản Lý Đề Thi</h4>
                    <p className="text-sm text-gray-500">Biên soạn, trộn đề và lưu trữ các bài kiểm tra định kỳ của học sinh.</p>
                  </Link>
               </div>
            </div>

            {/* NHÓM 3: HOẠT ĐỘNG NGOẠI KHÓA & MŨI NHỌN */}
            <div>
               <h3 className="text-xl font-extrabold text-orange-600 mb-4 flex items-center gap-2 border-b-2 border-orange-100 pb-2">
                 🏆 HOẠT ĐỘNG ĐẶC THÙ
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Link href="/games" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-emerald-500 flex items-center gap-6">
                    <div className="text-5xl">🎮</div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg mb-1">CLB VUI HỌC TOÁN - TBS</h4>
                      <p className="text-sm text-gray-500">Thiết lập tham số đếm ngược, luật chơi và ngân hàng câu hỏi Gamification.</p>
                    </div>
                  </Link>

                  <Link href="/olympic" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group border-l-4 border-l-orange-500 flex items-center gap-6">
                    <div className="text-5xl">🏅</div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg mb-1">Lộ trình Olympic 30/4</h4>
                      <p className="text-sm text-gray-500">Tuyển tập câu hỏi vận dụng cao và chiến lược bồi dưỡng đội tuyển 2026-2027.</p>
                    </div>
                  </Link>
               </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* ================== PHÂN HỆ HỌC SINH ===================== */}
        {/* ========================================================= */}
        {role === 'student' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Trang chủ học sinh */}
              <Link href="/student" className="col-span-1 md:col-span-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Bảng Tiến Độ Cá Nhân</h3>
                  <p className="text-blue-50 text-sm">Xem tổng quan điểm số, nhiệm vụ hàng ngày và xếp hạng của em.</p>
                </div>
                <div className="text-5xl">📊</div>
              </Link>

              {/* Bài giảng */}
              <Link href="/student/lectures" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📖</div>
                <h4 className="font-bold text-gray-800 text-xl mb-2">Vào Lớp Học</h4>
                <p className="text-sm text-gray-500">Xem video bài giảng và tài liệu giáo viên giao.</p>
              </Link>

              {/* Thi cử */}
              <Link href="/student/exams" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📝</div>
                <h4 className="font-bold text-gray-800 text-xl mb-2">Phòng Thi Số</h4>
                <p className="text-sm text-gray-500">Làm bài kiểm tra, bài thi định kỳ tính điểm.</p>
              </Link>

              {/* Hồ sơ */}
              <Link href="/student/profile" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👨‍🎓</div>
                <h4 className="font-bold text-gray-800 text-xl mb-2">Hồ Sơ Của Em</h4>
                <p className="text-sm text-gray-500">Cập nhật thông tin, danh hiệu và lịch sử làm bài.</p>
              </Link>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}