'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Hàm kích hoạt thông báo và tự động ẩn sau 3 giây
  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* KHUNG CHỨA TOAST TRƯỢT Ở GÓC DƯỚI PHẢI */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-3 text-xs font-black uppercase tracking-wide border-white/40 ${
              toast.type === 'success'
                ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-50/90 text-rose-800 border-rose-200 shadow-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-50/90 text-amber-800 border-amber-200 shadow-amber-100'
                : 'bg-sky-50/90 text-sky-800 border-sky-200 shadow-sky-100'
            }`}
          >
            <span className="text-base shrink-0">
              {toast.type === 'success' && '✨'}
              {toast.type === 'error' && '🛑'}
              {toast.type === 'warning' && '⚠️'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <div className="flex-grow leading-relaxed">{toast.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được đặt bên trong ToastProvider');
  }
  return context;
}