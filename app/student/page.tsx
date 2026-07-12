import React from 'react';
import Link from 'next/link';

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-[#eaf4fb] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- 1. KHU VỰC THÔNG TIN HỌC SINH (HEADER) --- */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              👨‍🎓
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Nguyễn Văn An</h1>
              <p className="text-blue-500 font-medium mt-1 bg-blue-50 inline-block px-3 py-1 rounded-full text-sm">
                Lớp: 12A1 — Hệ Thống Toán_TBS
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between items-end text-sm font-semibold">
              <span className="text-green-600">Danh hiệu: Thợ săn Tích phân</span>
              <span className="text-gray-600">340 / 500 EXP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>

        {/* --- 2. TRẠM ĐIỀU HƯỚNG TRUNG TÂM (HỌC - CHƠI - THI ĐẤU) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Cửa 1: Khu vực Game */}
          <Link href="/game" className="group block bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">🎮</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Giải Trí</span>
            </div>
            <h3 className="text-xl font-bold mb-2">CLB Vui Học Toán</h3>
            <p className="text-blue-50 text-sm opacity-90">Rèn luyện phản xạ với các bài trắc nghiệm tính giờ kịch tính.</p>
          </Link>

          {/* Cửa 2: Khu vực Học Tập & Tài Liệu */}
          <Link href="department/lectures" className="group block bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">📚</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Học Tập</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Kho Tài Liệu Số</h3>
            <p className="text-emerald-50 text-sm opacity-90">Truy cập chuyên đề, xem bài giảng và tải đề cương ôn tập.</p>
          </Link>

          {/* Cửa 3: Khu vực Thi Đấu Olympic */}
          <Link href="olympic" className="group block bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">🏆</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Đỉnh Cao</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Đấu Trường Olympic</h3>
            <p className="text-orange-50 text-sm opacity-90">Thử sức với ngân hàng đề thi chọn học sinh giỏi 30/4.</p>
          </Link>

        </div>

        {/* --- KHU VỰC NỘI DUNG CHÍNH (CHIA CỘT) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (2/3): NHIỆM VỤ HÀNG NGÀY */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-extrabold text-blue-600 mb-4 flex items-center gap-2">
              🎯 Nhiệm Vụ Cần Hoàn Thành
            </h3>
            
            <div className="space-y-4">
              {/* Thẻ nhiệm vụ 1 */}
              <div className="bg-white rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between shadow-sm border border-gray-100 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold">
                    <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded">✍️ TỰ LUẬN</span>
                    <span className="text-gray-400">Thưởng: +40 EXP</span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">
                    Thử thách tự luận: Phương trình mặt phẳng <span className="bg-gray-100 px-1 rounded text-sm font-mono text-gray-600 border">Oxyz</span>
                  </h4>
                </div>
                <button className="w-full md:w-auto bg-[#1ea4e9] text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-blue-600 transition-colors shrink-0">
                  NỘP BÀI TỰ LUẬN 📤
                </button>
              </div>

              {/* Thẻ nhiệm vụ 2 (Đã chấm) */}
              <div className="bg-white rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between shadow-sm border border-gray-100 gap-4 opacity-80">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold">
                    <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded">✍️ TỰ LUẬN</span>
                    <span className="text-gray-400">Thưởng: +50 EXP</span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">
                    Ôn tập chương: Tính nguyên hàm bằng phương pháp từng phầ...
                  </h4>
                </div>
                <button className="w-full md:w-auto bg-green-100 text-green-700 px-6 py-2.5 rounded-xl font-bold shrink-0 pointer-events-none">
                  ✓ Đã chấm
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (1/3): BẢNG XẾP HẠNG */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-extrabold text-orange-500 mb-6 flex items-center gap-2">
                🌟 Bảng Vàng Bảng Nhãn TBS
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-yellow-300 bg-yellow-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">Trần Minh Đức</h4>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">LỚP 12A1 — VUA OXYZ</p>
                    </div>
                  </div>
                  <div className="text-blue-500 font-black text-sm bg-blue-100 px-2 py-1 rounded">
                    520 EXP
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}