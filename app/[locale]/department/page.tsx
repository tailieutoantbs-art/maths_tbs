'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function DepartmentPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // 1. Quản lý trạng thái danh sách nhân sự (Có thể click để đổi trạng thái)
  const [personnel, setPersonnel] = useState([
    { id: 1, name: 'Thầy Hùng', role: 'Tổ trưởng chuyên môn', isSubmitted: true },
    { id: 2, name: 'Thành viên 02', role: 'Giáo viên Toán', isSubmitted: false },
    { id: 3, name: 'Thành viên 03', role: 'Giáo viên Toán - Tin học', isSubmitted: true },
  ]);

  // 2. Quản lý trạng thái nút Đồng bộ
  const [isSyncing, setIsSyncing] = useState(false);

  // Xử lý đổi trạng thái nộp Kế hoạch
  const toggleSubmissionStatus = (id: number) => {
    setPersonnel(prev => prev.map(p => 
      p.id === id ? { ...p, isSubmitted: !p.isSubmitted } : p
    ));
    showToast('info', 'Đã cập nhật trạng thái nộp hồ sơ!');
  };

  const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwlqxlitf4BrjFN2nIYs4ywXmVGi0EtWCSoWJUgwyFXnJFPXWXiVmIgWRf5KKBZDpluug/exec';

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    try {
      // 1. Kéo toàn bộ dữ liệu điểm từ Firebase
      const q = query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const results: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          studentName: data.studentName || '',
          studentClass: data.studentClass || '',
          score: data.score || 0,
          submittedAt: data.submittedAt ? data.submittedAt.toDate().toLocaleString('vi-VN') : ''
        });
      });

      // 2. Đẩy dữ liệu qua Google Apps Script (Webhook)
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'sync_results',
          data: results
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      const result = await response.json();
      
      if (result.success) {
        showToast('success', 'Đã đồng bộ điểm số lên Google Sheets thành công! 🚀');
      } else {
        showToast('error', result.message || 'Hệ thống báo lỗi khi đồng bộ.');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Cổng kết nối Google Sheets hiện đang bận. Vui lòng thử lại!');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#F0F9FF] p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-sky-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-5 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 text-xs uppercase border border-slate-200 transition-colors"
            >
              ⬅ Về Workspace
            </button>
            <h1 className="text-2xl font-black text-sky-600 uppercase tracking-wide">
              Tổ Chuyên Môn Toán & Tin Học
            </h1>
            <div className="w-24 hidden md:block"></div> {/* Spacer để cân bằng Header */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CỘT TRÁI: DANH SÁCH NHÂN SỰ */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-black text-sky-700 flex items-center gap-2 mb-6 uppercase tracking-wider">
                👥 Danh Sách Nhân Sự
              </h2>
              
              <div className="space-y-4">
                {personnel.map(person => (
                  <div key={person.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl hover:shadow-md transition-all group bg-slate-50/50">
                    <div>
                      <h3 className="font-black text-slate-800 text-base">{person.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">{person.role}</p>
                    </div>
                    <button 
                      onClick={() => toggleSubmissionStatus(person.id)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        person.isSubmitted 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {person.isSubmitted ? 'Đã nộp KH' : 'Chưa nộp KH'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT PHẢI: TRẠM BÁO CÁO & TRÌNH TẠO KẾ HOẠCH */}
            <div className="space-y-6">
              
              {/* BLOCK 1: TRẠM BÁO CÁO */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none -z-0"></div>
                <h2 className="text-lg font-black text-emerald-600 flex items-center gap-2 mb-4 uppercase tracking-wider relative z-10">
                  📊 Trạm Báo Cáo Dữ Liệu (Real-time)
                </h2>
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 relative z-10">
                  <p className="text-sm font-medium text-slate-600 mb-5 leading-relaxed">
                    Đồng bộ toàn bộ danh sách bài nộp Cloudinary và điểm thi trực tiếp sang file Google Sheets dùng chung của tổ.
                  </p>
                  <button 
                    onClick={handleSyncToSheets}
                    disabled={isSyncing}
                    className="w-full py-4 bg-[#059669] hover:bg-[#047857] text-white font-black text-sm uppercase rounded-xl tracking-widest shadow-[0_4px_0_0_#065F46] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? (
                      <span className="animate-pulse">Đang đồng bộ dữ liệu... ⏳</span>
                    ) : (
                      'ĐỒNG BỘ DỮ LIỆU LÊN GOOGLE SHEETS 🚀'
                    )}
                  </button>
                </div>
              </div>

              {/* BLOCK 2: TRÌNH TẠO KẾ HOẠCH */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full pointer-events-none -z-0"></div>
                <h2 className="text-lg font-black text-orange-600 flex items-center gap-2 mb-6 uppercase tracking-wider relative z-10">
                  📑 Trình Tạo Kế Hoạch (TẠO PROMPT)
                </h2>
                
                <div className="space-y-3 relative z-10">
                  <button onClick={() => router.push('/plan-assistant')} className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group">
                    <span className="font-bold text-slate-700 text-sm group-hover:text-blue-600">Mẫu PL1 - Kế hoạch dạy học môn học</span>
                    <div className="w-4 h-4 rounded-sm bg-blue-400"></div>
                  </button>
                  
                  <button onClick={() => router.push('/plan-assistant')} className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-xl hover:border-rose-400 hover:shadow-sm transition-all group">
                    <span className="font-bold text-slate-700 text-sm group-hover:text-rose-600">Mẫu PL2 - Kế hoạch giáo dục tổ chức</span>
                    <div className="w-4 h-4 rounded-sm bg-rose-400"></div>
                  </button>
                  
                  <button onClick={() => router.push('/plan-assistant')} className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-sm transition-all group">
                    <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-600">Mẫu PL3 - Kế hoạch của cá nhân (Ma trận)</span>
                    <div className="w-4 h-4 rounded-sm bg-emerald-400"></div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}