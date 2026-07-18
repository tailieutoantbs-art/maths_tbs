'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Lắng nghe trạng thái đăng nhập thời gian thực từ Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Nếu không có phiên đăng nhập hợp lệ, đẩy ngay ra trang login giáo viên
        router.push(`/${locale}/teacher/login`);
      }
      setIsLoading(false);
    });

    // Hủy lắng nghe khi component unmount để tránh rò rỉ bộ nhớ
    return () => unsubscribe();
  }, [router]);

  // GIAO DIỆN CHỜ TRONG KHI KIỂM TRA QUYỀN TRUY CẬP
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black window-title uppercase tracking-widest text-indigo-400 animate-pulse">
            Đang kiểm tra quyền truy cập quản trị... 🔒
          </p>
        </div>
      </div>
    );
  }

  // Nếu đã xác thực thành công, cho phép hiển thị nội dung trang (children)
  return isAuthenticated ? <>{children}</> : null;
}