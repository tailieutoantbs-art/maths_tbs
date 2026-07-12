'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function IntegratedLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'teacher' | 'student'>('student'); // Mặc định mở tab học sinh cho tiện
  
  // Trạng thái input form
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  
  // Trạng thái xử lý hệ thống
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwlqxlitf4BrjFN2nIYs4ywXmVGi0EtWCSoWJUgwyFXnJFPXWXiVmIgWRf5KKBZDpluug/exec';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // LUỒNG XỬ LÝ 1: ĐĂNG NHẬP DÀNH CHO GIÁO VIÊN (Sử dụng Firebase Auth)
    if (role === 'teacher') {
      if (!email || !password) {
        setError('Vui lòng điền đầy đủ tài khoản Email giáo viên và mật khẩu!');
        setLoading(false);
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      } catch (err) {
        setError('Tài khoản mật khẩu Giáo viên không chính xác!');
        setLoading(false);
      }
    } 
    // LUỒNG XỬ LÝ 2: ĐĂNG NHẬP DÀNH CHO HỌC SINH (Sử dụng Google Sheets qua ID tối đa 8 ký tự)
    else {
      if (!studentId || !password) {
        setError('Vui lòng điền đầy đủ Mã số học sinh và Mật khẩu!');
        setLoading(false);
        return;
      }
      if (studentId.length > 8) {
        setError('Mã số học sinh nhập sai định dạng (Tối đa không quá 8 ký tự)!');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(GOOGLE_SHEET_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'login_student',
            id: studentId,
            password: password
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();
        
        if (result.success) {
          // XÁC NHẬN ĐÚNG HỌ TÊN HỌC SINH LÊN MÀN HÌNH
          alert(`Xác thực thành công! Hệ thống chào em: ${result.data.name} — Học sinh lớp ${result.data.class}.`);
          
          // Lưu thông tin phiên đăng nhập vào bộ nhớ trình duyệt
          localStorage.setItem('student_session', JSON.stringify(result.data));
          
          // Chuyển thẳng em học sinh vào trang tổng đài nhiệm vụ
          router.push('/student');
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Cổng kết nối dữ liệu Google Sheets gặp sự cố. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] flex items-center justify-center p-4">
      <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/40 rounded-full blur-3xl -z-10"></div>
        
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8]">
            Toán_TBS Platform
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Hệ sinh thái dạy và học thông minh
          </p>
        </div>

        {/* Nút chuyển đổi Tab vai trò 3D */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl mb-6 border border-slate-200/40">
          <button
            type="button"
            onClick={() => { setRole('student'); setError(''); }}
            className={`w-1/2 py-2 text-xs font-black rounded-lg transition-all ${role === 'student' ? 'bg-white text-[#0284C7] shadow-sm' : 'text-slate-500'}`}
          >
            🎓 HỌC SINH ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => { setRole('teacher'); setError(''); }}
            className={`w-1/2 py-2 text-xs font-black rounded-lg transition-all ${role === 'teacher' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
          >
            👨‍🏫 GIÁO VIÊN TRUY CẬP
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3 rounded-xl mb-4 text-center animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {role === 'teacher' ? (
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Email Giáo viên:</label>
              <input
                type="email"
                className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none font-medium text-sm text-slate-700 shadow-inner"
                placeholder="thayhung@thanhbinh.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Mã số học sinh (ID):</label>
              <input
                type="text"
                className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none font-black text-sm text-[#0284C7] shadow-inner tracking-widest"
                placeholder="Ví dụ: HS001"
                maxLength={8}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Mật khẩu bảo mật:</label>
            <input
              type="password"
              className="w-full p-3 bg-white/80 border border-sky-100 rounded-xl focus:outline-none text-sm shadow-inner"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-extrabold py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs disabled:opacity-60 mt-2 ${
              role === 'teacher' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_4px_0_0_#047857] active:shadow-[0_0px_0_0_#047857] active:translate-y-1' 
                : 'bg-gradient-to-r from-[#0284C7] to-[#38BDF8] shadow-[0_4px_0_0_#0369A1] active:shadow-[0_0px_0_0_#0369A1] active:translate-y-1'
            }`}
          >
            {loading ? 'Hệ thống đang xác thực...' : 'Bắt Đầu Vào Trận Đấu 🚀'}
          </button>
        </form>
      </div>
    </main>
  );
}