'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentLoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [classroom, setClassroom] = useState('10A1');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Chiến binh vui lòng nhập đầy đủ Họ và tên nhé!");
      return;
    }

    setIsLoading(false);
    setIsLoading(true);
    
    // Giả lập lưu session học sinh ngầm và điều hướng về trang chủ học sinh
    setTimeout(() => {
      router.push('/student/home');
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-sky-300/30 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border-2 border-white/90 p-8 rounded-[2.5rem] shadow-2xl z-10 text-center space-y-6">
        <div>
          <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full uppercase tracking-widest">
            Hệ Thống Học Tập Toán_TBS
          </span>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-wide mt-3">
            Báo Danh Học Viên
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Trường TH, THCS và THPT Thanh Bình
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Họ và tên học sinh:</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Hải Đăng" 
              className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Mã học sinh (Nếu có):</label>
              <input 
                type="text" 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder="VD: TBS1024" 
                className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm text-center text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Lớp học hiện tại:</label>
              <select 
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm text-center text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
              >
                <option>10A1</option><option>10A2</option>
                <option>11A1</option><option>11A2</option>
                <option>12A1</option><option>12A2</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-gradient-to-b from-sky-400 to-blue-500 text-white font-black text-sm uppercase rounded-2xl tracking-widest shadow-[0_5px_0_0_#0284C7] active:translate-y-1 active:shadow-[0_0px_0_0_#0284C7] transition-all flex justify-center items-center"
          >
            {isLoading ? 'Đang xác thực thông tin... ⏳' : 'VÀO KHÔNG GIAN HỌC TẬP'}
          </button>
        </form>

        <div className="pt-2">
          <button onClick={() => router.push('/')} className="text-xs font-bold text-slate-400 hover:text-sky-600 underline underline-offset-4 transition-colors">
            ⬅ Quay lại Cổng trường chính
          </button>
        </div>
      </div>
    </main>
  );
}