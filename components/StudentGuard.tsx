'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StudentGuardProps {
  children: React.ReactNode;
}

export default function StudentGuard({ children }: StudentGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [student, setStudent] = useState<any>(null);
  
  // Trạng thái phục vụ luồng đổi mật khẩu lần đầu
  const [isForceChanging, setIsForceChanging] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwlqxlitf4BrjFN2nIYs4ywXmVGi0EtWCSoWJUgwyFXnJFPXWXiVmIgWRf5KKBZDpluug/exec';

  useEffect(() => {
    const session = localStorage.getItem('student_session');
    if (!session) {
      // Nếu không có phiên làm việc, lập tức trục xuất về trang đăng nhập
      router.push('/login');
    } else {
      const studentData = JSON.parse(session);
      setStudent(studentData);
      
      // Nếu là đăng nhập lần đầu (mustChangePass === true), kích hoạt chế độ khóa ép đổi mật khẩu
      if (studentData.mustChangePass) {
        setIsForceChanging(true);
      }
    }
    setChecking(false);
  }, [router]);

  // Luồng xử lý đổi mật khẩu trực tiếp lên Google Sheets
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải chứa ít nhất 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'change_password',
          id: student.id,
          newPassword: newPassword
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      const result = await response.json();
      if (result.success) {
        alert('Đổi mật khẩu thành công! Bản ghi đã được cập nhật trực tuyến vào Google Sheets.');
        
        // Cập nhật lại bộ nhớ tạm của trình duyệt, giải phóng tường lửa khóa
        const updatedStudent = { ...student, mustChangePass: false };
        localStorage.setItem('student_session', JSON.stringify(updatedStudent));
        setStudent(updatedStudent);
        setIsForceChanging(false);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể kết nối với máy chủ Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#E0F2FE] flex items-center justify-center text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
        🔒 Đang rà soát quyền truy cập phòng học...
      </div>
    );
  }

  // DIỆN MẠO ÉP ĐỔI MẬT KHẨU LẦN ĐẦU (Kính mờ 3D)
  if (isForceChanging && student) {
    return (
      <div className="min-h-screen bg-[#E0F2FE] flex items-center justify-center p-4">
        <div className="bg-white/60 backdrop-blur-xl border-2 border-amber-200 p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
          <div className="text-center mb-6">
            <span className="text-4xl">🔑</span>
            <h3 className="text-xl font-black text-slate-800 mt-2">Đổi Mật Khẩu Lần Đầu</h3>
            <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg mt-2 inline-block">
              Chào em: {student.name} ({student.class})
            </p>
            <p className="text-slate-500 text-xs mt-3 font-medium leading-relaxed">
              Để bảo mật tài khoản học tập trên hệ thống Toán_TBS, em bắt buộc phải thiết lập mật khẩu mới thay cho mật khẩu mặc định của trường.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3 rounded-xl mb-4 text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Mật khẩu mới:</label>
              <input
                type="password"
                className="w-full p-3 bg-white border border-sky-100 rounded-xl focus:outline-none text-sm font-medium"
                placeholder="Nhập tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">Xác nhận mật khẩu:</label>
              <input
                type="password"
                className="w-full p-3 bg-white border border-sky-100 rounded-xl focus:outline-none text-sm font-medium"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_0_0_#B45309] active:translate-y-1 active:shadow-[0_0px_0_0_#B45309] transition-all text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Đang mã hóa dữ liệu...' : 'Xác Nhận Đổi Mật Khẩu 🚀'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Nếu hợp lệ, cho phép hiển thị phòng học/đấu trường bình thường
  return student ? <>{children}</> : null;
}