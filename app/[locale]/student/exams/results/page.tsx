'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface ExamResult {
  id: string;
  studentName: string;
  studentClass: string;
  score: number;
  submittedAt: any;
}

function ScoreboardPage() {
  const router = useRouter();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: ExamResult[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ExamResult);
      });
      setResults(data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu điểm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Hàm định dạng thời gian nộp bài
  const formatSubmissionTime = (timestamp: any) => {
    if (!timestamp) return 'Chưa ghi nhận';
    const date = timestamp.toDate();
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // LUỒNG XỬ LÝ XUẤT FILE CSV ĐỂ MỞ BẰNG GOOGLE SHEETS
  const handleExportToCSV = () => {
    if (results.length === 0) {
      alert("Không có dữ liệu điểm để xuất báo cáo!");
      return;
    }

    // Thiết lập BOM để Excel/Google Sheets đọc được tiếng Việt có dấu chuẩn xác
    let csvContent = "\uFEFF"; 
    csvContent += "STT,Họ và Tên,Lớp,Điểm Số,Thời Gian Nộp Bài\n";

    const dataToExport = results.filter(r => {
      const matchClass = classFilter === 'ALL' || r.studentClass === classFilter;
      const matchSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });

    dataToExport.forEach((r, index) => {
      csvContent += `${index + 1},"${r.studentName}",${r.studentClass},${r.score},${formatSubmissionTime(r.submittedAt)}\n`;
    });

    // Tạo file blob và kích hoạt cơ chế tải về tự động
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bang_Diem_Khao_Sat_${classFilter === 'ALL' ? 'Toan_Bo' : classFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = results.filter(r => {
    const matchClass = classFilter === 'ALL' || r.studentClass === classFilter;
    const matchSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER QUAN SÁT */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] to-[#38BDF8] uppercase tracking-wide">
              Bảng Điểm Khảo Sát
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
              Trung tâm lưu trữ dữ liệu Tổ Toán TBS
            </p>
          </div>

          <div className="flex gap-3 z-10">
            <button 
              onClick={() => router.push('/exams')}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase"
            >
              ⬅ Trở Lại Ngân Hàng
            </button>
            <button 
              onClick={handleExportToCSV}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold rounded-xl shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-[0_0px_0_0_#059669] transition-all text-xs uppercase tracking-wider flex items-center gap-2"
            >
              🟢 Xuất File Excel / Google Sheets
            </button>
          </div>
        </div>

        {/* BỘ LỌC VÀ TÌM KIẾM ĐIỀU HƯỚNG NHANH */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm w-full md:w-auto justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Tìm Kiếm:</span>
            <input 
              type="text"
              placeholder="Nhập tên học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 w-full md:w-64 bg-white border border-sky-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-300"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Lọc Theo Lớp:</span>
            <select 
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
              className="p-2 w-full md:w-auto bg-white border border-sky-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tất cả các lớp</option>
              <option value="10A1">Lớp 10A1</option>
              <option value="10A2">Lớp 10A2</option>
              <option value="11A1">Lớp 11A1</option>
              <option value="11A2">Lớp 11A2</option>
              <option value="12A1">Lớp 12A1</option>
              <option value="12A2">Lớp 12A2</option>
            </select>
          </div>
        </div>

        {/* BẢNG ĐIỂM CHI TIẾT */}
        <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl">
          {loading ? (
            <div className="text-center py-10 text-sky-600 font-bold animate-pulse text-xs uppercase tracking-widest">Đang tải bảng điểm kết quả...</div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-medium text-sm">Chưa có học sinh nào nộp bài thuộc danh mục này.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-sky-100">
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">STT</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider">Họ và Tên Học Sinh</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Lớp Học</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Điểm Số</th>
                    <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-wider">Thời Gian Nộp Bài</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {filteredResults.map((r, index) => (
                    <tr key={r.id} className="hover:bg-sky-50/50 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-700">{r.studentName}</td>
                      <td className="py-4 px-4 text-center text-xs font-black text-slate-500 uppercase bg-white/40 border border-slate-100 rounded-lg">{r.studentClass}</td>
                      <td className={`py-4 px-4 text-center text-sm font-black font-mono ${r.score >= 8 ? 'text-emerald-600' : r.score >= 5 ? 'text-sky-600' : 'text-rose-500'}`}>{r.score} / 10</td>
                      <td className="py-4 px-4 text-xs text-slate-500 font-medium">{formatSubmissionTime(r.submittedAt)}</td>
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

export default function ProtectedScoreboard() {
  return (
    <AuthGuard>
      <ScoreboardPage />
    </AuthGuard>
  );
}