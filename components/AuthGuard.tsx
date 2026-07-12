'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Lắng nghe trạng thái đăng nhập thời gian thực từ Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Nếu không có phiên đăng nhập, trục xuất về trang login ngay lập tức
        router.push('/login');
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#E0F2FE] flex items-center justify-center text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
        🔒 Hệ thống đang kiểm tra quyền truy cập nội bộ...
      </div>
    );
  }

  // Nếu đã xác thực hợp lệ, cho phép hiển thị nội dung bên trong trang
  return isAuthenticated ? <>{children}</> : null;
}