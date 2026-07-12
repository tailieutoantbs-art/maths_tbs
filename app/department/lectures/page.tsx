'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface Lecture {
  id: string;
  title: string;
  chapter: string;
  level: string;
  status: string;
  createdAt: any;
}

function LectureManagementPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm tải danh sách bài giảng từ Firebase
  const fetchLectures = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lectures'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: Lecture[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Lecture);
      });
      setLectures(data);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  // Hàm xử lý xóa bài giảng
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn xóa bài giảng "${title}" không? Hành động này không thể hoàn tác.`)) {
      try {
        await deleteDoc(doc(db, 'lectures', id));
        alert('Đã xóa thành công!');
        fetchLectures(); 
      } catch (error) {
        console.error("Lỗi xóa bài giảng:", error);
        alert('Có lỗi xảy ra khi xóa.');
      }
    }
  };

  // Hàm format thời gian (từ Firebase Timestamp sang chuỗi dễ đọc)
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Chưa cập nhật';
    const date = timestamp.toDate();
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-sky-200/50 rounded-full blur-3xl -z-10"></div>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] uppercase tracking-wide">
              Quản Lý Kho Bài Giảng
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
              Trung tâm kiểm soát học liệu Tổ Toán TBS
            </p>
          </div>

          <div className="flex gap-3 z-10">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase"
            >
              ⬅ Về Dashboard
            </button>
            <button 
              onClick={() => router.push('/editor')} 
              className="px-6 py-2.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>+ Thêm Bài Mới</span>
            </button>
          </div>
        </div>

        {/* BẢNG DANH SÁCH BÀI GIẢNG (KÍNH MỜ) */}
        <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl">
          {loading ? (
            <div className="text-center py-10 text-sky-600 font-bold animate-pulse">
              Đang đồng bộ dữ liệu từ đám mây...
            </div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-medium">
              Chưa có bài giảng nào. Thầy hãy tạo bài giảng đầu tiên nhé!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-sky-100">
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tiêu đề bài giảng</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider">Chuyên đề</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider">Cập nhật lúc</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {lectures.map((lec) => (
                    <tr key={lec.id} className="hover:bg-sky-50/50 transition-colors group">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-700 text-sm">{lec.title}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 inline-block bg-white px-2 py-0.5 rounded border border-slate-100">
                          ID: {lec.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600">{lec.chapter}</td>
                      <td className="py-4 px-4 text-center">
                        {lec.status === 'published' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Công Khai
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                            Bản Nháp
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500 font-medium">
                        {formatDate(lec.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-center space-x-2">
                        {/* NÚT XEM THỰC TẾ GIAO DIỆN HỌC SINH */}
                        <button 
                          onClick={() => window.open(`/student/lectures/${lec.id}`, '_blank')}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200 transition-colors text-xs"
                        >
                          Xem
                        </button>
                       <button 
  onClick={() => router.push(`/editor/${lec.id}`)}
  className="px-3 py-1.5 bg-amber-100 text-amber-600 font-bold rounded-lg hover:bg-amber-200 transition-colors text-xs"
>
  Sửa
</button>
                        <button 
                          onClick={() => handleDelete(lec.id, lec.title)}
                          className="px-3 py-1.5 bg-rose-100 text-rose-600 font-bold rounded-lg hover:bg-rose-200 transition-colors text-xs"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default function ProtectedLectureManagement() {
  return (
    <AuthGuard>
      <LectureManagementPage />
    </AuthGuard>
  );
}