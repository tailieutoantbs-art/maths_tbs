'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Giả lập kiểm tra tài khoản quản trị chuyên môn Tổ Toán
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/60 p-8 md:p-10 rounded-[2.5rem] shadow-2xl z-10 text-center space-y-6">
        <div>
          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
            Hệ Thống Học Tập Toán_TBS
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-wide mt-3">
            Cổng Đăng Nhập Quản Trị
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Dành riêng cho Hội đồng Chuyên môn TBS
          </p>
        </div>

        <form onSubmit={handleTeacherLogin} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Email công vụ:</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="giao-vien@thanhbinh.edu.vn" 
              className="w-full p-3.5 bg-slate-900 border-2 border-slate-700 rounded-2xl font-bold text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Mật mã xác thực:</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-3.5 bg-slate-900 border-2 border-slate-700 rounded-2xl font-bold text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase rounded-2xl tracking-widest shadow-lg transition-all flex justify-center items-center"
          >
            {isLoading ? 'Đang thiết lập phiên làm việc... ⚙️' : 'XÁC THỰC QUẢN TRỊ'}
          </button>
        </form>

        <div className="pt-2">
          <button onClick={() => router.push('/')} className="text-xs font-bold text-slate-500 hover:text-indigo-400 underline underline-offset-4 transition-colors">
            ⬅ Quay lại Cổng trường chính
          </button>
        </div>
      </div>
    </main>
  );
}