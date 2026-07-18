'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentGuard from '@/components/StudentGuard';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface StudentLeaderboard {
  id: string;
  name: string;
  className: string;
  exp: number;
}

export default function StudentDashboard() {
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<StudentLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Lấy thông tin học sinh hiện tại từ session
    const session = localStorage.getItem('student_session');
    if (session) {
      setCurrentStudent(JSON.parse(session));
    }

    // 2. Fetch danh sách học sinh từ Firebase để làm Bảng xếp hạng (Giả lập tính điểm EXP hoặc lấy từ field exp nếu có)
    const fetchLeaderboard = async () => {
      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        
        let allStudents: StudentLeaderboard[] = [];
        studentsSnap.forEach((doc) => {
          const data = doc.data();
          allStudents.push({
            id: doc.id,
            name: data.fullName || 'Ẩn danh',
            className: data.classroom || 'Chưa rõ',
            exp: data.exp || Math.floor(Math.random() * 500) + 100 // Tạm thời fallback ngẫu nhiên nếu chưa có field exp
          });
        });

        // Sắp xếp theo EXP giảm dần và lấy Top 5
        allStudents.sort((a, b) => b.exp - a.exp);
        setLeaderboard(allStudents.slice(0, 5));
      } catch (error) {
        console.error("Lỗi khi tải bảng xếp hạng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Tính toán level danh hiệu dựa trên EXP của học sinh hiện tại
  const myExp = currentStudent?.exp || (leaderboard.find(s => s.name === currentStudent?.name)?.exp || 120);
  const myLevelName = myExp > 400 ? 'Vua Oxyz' : myExp > 200 ? 'Thợ săn Tích phân' : 'Tân binh Số học';
  const myProgress = Math.min((myExp / 500) * 100, 100);

  return (
    <StudentGuard>
      <div className="min-h-screen bg-[#eaf4fb] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- 1. KHU VỰC THÔNG TIN HỌC SINH (HEADER) --- */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              👨‍🎓
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {currentStudent ? currentStudent.name : 'Đang tải...'}
              </h1>
              <p className="text-blue-500 font-medium mt-1 bg-blue-50 inline-block px-3 py-1 rounded-full text-sm">
                Lớp: {currentStudent ? currentStudent.class : '...'} — Hệ Thống Toán_TBS
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between items-end text-sm font-semibold">
              <span className="text-green-600">Danh hiệu: {myLevelName}</span>
              <span className="text-gray-600">{myExp} / 500 EXP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${myProgress}%` }}></div>
            </div>
          </div>
        </div>

        {/* --- 2. TRẠM ĐIỀU HƯỚNG TRUNG TÂM (HỌC - CHƠI - THI ĐẤU) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <Link href="/games" className="group block bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">🎮</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Giải Trí</span>
            </div>
            <h3 className="text-xl font-bold mb-2">CLB Vui Học Toán</h3>
            <p className="text-blue-50 text-sm opacity-90">Rèn luyện phản xạ với các bài trắc nghiệm tính giờ kịch tính.</p>
          </Link>

          <Link href="/student/lectures" className="group block bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">📚</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Học Tập</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Kho Tài Liệu Số</h3>
            <p className="text-emerald-50 text-sm opacity-90">Truy cập chuyên đề, xem bài giảng và tải đề cương ôn tập.</p>
          </Link>

          <Link href="/student/olympic" className="group block bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">🏆</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Đỉnh Cao</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Đấu Trường Olympic</h3>
            <p className="text-orange-50 text-sm opacity-90">Thử sức với ngân hàng đề thi chọn học sinh giỏi 30/4.</p>
          </Link>

          <Link href="/student/mastery-space" className="group block bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">🌌</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Tương Tác</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Mastery Space</h3>
            <p className="text-indigo-50 text-sm opacity-90">Không gian học tập tương tác mới lạ với công nghệ AI.</p>
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
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full">
              <h3 className="text-xl font-extrabold text-orange-500 mb-6 flex items-center gap-2">
                🌟 Bảng Vàng Bảng Nhãn
              </h3>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-sm font-bold text-gray-400 animate-pulse py-8">
                    Đang nạp danh sách cao thủ...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center text-sm font-bold text-gray-400 py-8">
                    Chưa có học sinh nào trên bảng vàng.
                  </div>
                ) : (
                  leaderboard.map((student, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={student.id} 
                      className={`flex items-center justify-between p-4 border rounded-2xl ${
                        idx === 0 ? 'border-yellow-300 bg-yellow-50' : 
                        idx === 1 ? 'border-slate-300 bg-slate-50' : 
                        idx === 2 ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm text-white ${
                          idx === 0 ? 'bg-yellow-400' : 
                          idx === 1 ? 'bg-slate-400' : 
                          idx === 2 ? 'bg-orange-400' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 line-clamp-1 text-sm">{student.name}</h4>
                          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{student.className}</p>
                        </div>
                      </div>
                      <div className="text-blue-500 font-black text-xs bg-blue-100 px-2 py-1 rounded whitespace-nowrap">
                        {student.exp} EXP
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
        </div>
      </div>
    </StudentGuard>
  );
}