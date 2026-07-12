'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AuthGuard from '@/components/AuthGuard';

export default function DepartmentPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const teachers = [
    { id: 1, name: 'Thầy Hùng', role: 'Tổ trưởng chuyên môn', status: 'Đã nộp KH' },
    { id: 2, name: 'Thành viên 02', role: 'Giáo viên Toán', status: 'Chưa nộp KH' },
    { id: 3, name: 'Thành viên 03', role: 'Giáo viên Tin học', status: 'Đã nộp KH' },
  ];

  // ĐÃ CẬP NHẬT ĐƯỜNG LINK WEB APP URL CỦA THẦY
  const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbwlqxlitf4BrjFN2nIYs4ywXmVGi0EtWCSoWJUgwyFXnJFPXWXiVmIgWRf5KKBZDpluug/exec';

 const exportToGoogleSheets = async () => {
    // Chỉ cần kiểm tra xem biến có rỗng hay không
    if (!GOOGLE_SHEET_API_URL) {
      alert("https://script.google.com/macros/library/d/1nDRo1byYkptAo27lXDgq3P7fPPewW6Tgr_9n4fwLwYdD7BBscVqSwkfZ/2");
      return;
    }

    setIsExporting(true);
    try {
      // 1. Kéo dữ liệu bài nộp từ Firebase
      const querySnapshot = await getDocs(collection(db, 'bainop_hocsinh'));
      const exportData: any[] = [];
      let counter = 1;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        exportData.push({
          stt: counter++,
          hoTen: data.studentName || 'N/A',
          lop: data.studentClass || 'N/A',
          nhiemVu: data.missionTitle || 'N/A',
          linkCloudinary: data.imageUrl || 'N/A',
          thoiGian: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString('vi-VN') : 'N/A'
        });
      });

      if (exportData.length === 0) {
        alert("Chưa có dữ liệu bài nộp nào trên hệ thống để xuất!");
        setIsExporting(false);
        return;
      }

      // 2. Bắn dữ liệu thẳng lên Google Sheets qua Apps Script
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        body: JSON.stringify(exportData),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' } // Cần để dạng text/plain tránh lỗi CORS
      });

      const result = await response.json();
      if (result.status === "Thành công") {
        alert(`Đã đồng bộ thành công ${exportData.length} bài nộp lên file Google Sheets của tổ chuyên môn!`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Lỗi xuất Sheets:", error);
      alert("Có lỗi xảy ra trong quá trình đồng bộ dữ liệu. Thầy kiểm tra lại Console nhé.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AuthGuard>
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        
        {/* Header Tổ Chuyên Môn */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/80 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/40 rounded-full blur-3xl -z-10"></div>
          <button onClick={() => router.push('/dashboard')} className="bg-white text-slate-600 font-bold py-2 px-6 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-sm z-10">
            ← Về Workspace
          </button>
          <div className="text-center z-10 mt-4 md:mt-0">
            <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8]">
              Tổ Chuyên Môn Toán & Tin Học
            </h2>
          </div>
          <div className="w-24 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CỘT TRÁI: Quản lý nhân sự */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-6 md:p-8 relative overflow-hidden">
             <h3 className="text-xl font-bold text-[#0284C7] mb-6 flex items-center gap-2"><span>👥</span> Danh Sách Nhân Sự</h3>
             <div className="space-y-3">
              {teachers.map((t) => (
                <div key={t.id} className="bg-white/80 border border-sky-100 p-4 rounded-2xl shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-700">{t.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{t.role}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200">{t.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: Trạm Trích Xuất Dữ Liệu & Hành Chính */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-6 md:p-8 flex flex-col space-y-8">
            
            {/* Module Trích xuất báo cáo Google Sheets */}
            <div>
              <h3 className="text-xl font-bold text-emerald-600 mb-4 flex items-center gap-2"><span>📊</span> Trạm Báo Cáo Dữ Liệu (Real-time)</h3>
              <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
                <p className="text-sm text-slate-600 font-medium mb-4">
                  Đồng bộ toàn bộ danh sách bài nộp Cloudinary và điểm thi trực tiếp sang file Google Sheets dùng chung của tổ.
                </p>
                <button 
                  onClick={exportToGoogleSheets}
                  disabled={isExporting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-4 rounded-xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-[0_0px_0_0_#047857] transition-all disabled:opacity-60"
                >
                  {isExporting ? 'Đang truyền tải dữ liệu...' : 'ĐỒNG BỘ DỮ LIỆU LÊN GOOGLE SHEETS 🚀'}
                </button>
              </div>
            </div>

            {/* Module Trình tạo Kế hoạch (PL1, PL2, PL3) */}
            <div>
              <h3 className="text-xl font-bold text-amber-600 mb-4 flex items-center gap-2"><span>📑</span> Trình Tạo Kế Hoạch (TẠO PROMT)</h3>
              <div className="space-y-3">
                <button className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-sm hover:border-amber-300 transition-all text-sm text-left px-4 flex justify-between">
                  <span>Mẫu PL1 - Kế hoạch dạy học môn học</span> <span>📘</span>
                </button>
                <button className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-sm hover:border-amber-300 transition-all text-sm text-left px-4 flex justify-between">
                  <span>Mẫu PL2 - Kế hoạch giáo dục tổ chức</span> <span>📙</span>
                </button>
                <button className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-sm hover:border-amber-300 transition-all text-sm text-left px-4 flex justify-between">
                  <span>Mẫu PL3 - Kế hoạch của cá nhân</span> <span>📗</span>
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