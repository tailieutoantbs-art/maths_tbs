'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

interface ExamHistory {
  id: string;
  score: number;
  totalQuestions: number;
  submittedAt: any;
}

function StudentProfilePage() {
  const router = useRouter();
  
  // Tự động lấy tên đã lưu dưới máy học sinh nếu có
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('10A1');
  const [history, setHistory] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Gamification States
  const [arenaPoints, setArenaPoints] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  // Thống kê phân tích
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
  });

  // Luồng truy vấn lịch sử điểm số từ bộ sưu tập exam_results
  const fetchStudentHistory = async (name: string, sClass: string) => {
    if (!name.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const q = query(
        collection(db, 'exam_results'),
        where('studentName', '==', name.trim()),
        where('studentClass', '==', sClass),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data: ExamHistory[] = [];
      let totalScore = 0;
      let maxScore = 0;

      querySnapshot.forEach((doc) => {
        const res = doc.data() as ExamHistory;
       data.push({ ...res, id: doc.id });
        totalScore += res.score;
        if (res.score > maxScore) maxScore = res.score;
      });

      // Get Gamification stats from students collection
      const studentQuery = query(collection(db, 'students'), where('fullName', '==', name.trim()), where('classroom', '==', sClass));
      const studentSnap = await getDocs(studentQuery);
      if (!studentSnap.empty) {
        const studentData = studentSnap.docs[0].data();
        setArenaPoints(studentData.arenaPoints || 0);
        setBadges(studentData.badges || []);
      } else {
        setArenaPoints(0);
        setBadges([]);
      }

      setHistory(data);
      setStats({
        totalExams: data.length,
        averageScore: data.length > 0 ? Number((totalScore / data.length).toFixed(2)) : 0,
        highestScore: maxScore,
      });

      // Lưu lại thông tin định danh vào trình duyệt để lần sau không phải nhập lại
      localStorage.setItem('studentName', name.trim());
      localStorage.setItem('studentClass', sClass);

    } catch (error) {
      console.error("Lỗi tra cứu lịch sử học tập:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('studentName') || '';
      const savedClass = localStorage.getItem('studentClass') || '10A1';
      if (savedName) {
        setStudentName(savedName);
        setStudentClass(savedClass);
        fetchStudentHistory(savedName, savedClass);
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudentHistory(studentName, studentClass);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '---';
    const date = timestamp.toDate();
    return date.toLocaleDateString('vi-VN') + ' - ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getLevel = (points: number) => Math.floor(points / 100) + 1;
  const getRank = (level: number) => {
    if (level < 5) return 'Tân Binh';
    if (level < 10) return 'Chiến Binh';
    if (level < 20) return 'Cao Thủ';
    return 'Đại Cao Thủ';
  };

  const BADGE_MAP: Record<string, { icon: string, label: string, color: string }> = {
    'FIRST_BLOOD': { icon: '🔥', label: 'Lần Đầu Ra Trận', color: 'bg-rose-100 text-rose-600 border-rose-200' },
    'PERFECT_SCORE': { icon: '👑', label: 'Điểm Tuyệt Đối', color: 'bg-amber-100 text-amber-600 border-amber-200' },
    'EXCELLENT': { icon: '⭐', label: 'Xuất Sắc', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  };

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 text-slate-700 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        
        {/* THANH ĐIỀU HƯỚNG QUAY VỀ */}
        <div className="w-full flex justify-between items-center bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-sm">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
          >
            ⬅ Về Trang Chủ
          </button>
          <span className="text-xs font-black text-[#0284C7] uppercase tracking-widest">
            Học viên không gian số
          </span>
        </div>

        {/* BỘ LỌC ĐỊNH DANH TRA CỨU HỒ SƠ */}
        <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-lg">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-grow w-full space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wide">Nhập Họ và Tên của em để tra cứu:</label>
              <input 
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full p-3 bg-white border border-sky-100 rounded-xl font-bold text-slate-700 focus:outline-none shadow-sm text-sm"
              />
            </div>
            <div className="w-full md:w-48 space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wide">Chọn Lớp học:</label>
              <select 
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full p-3 bg-white border border-sky-100 rounded-xl font-bold text-slate-700 focus:outline-none shadow-sm text-sm"
              >
                <option value="10A1">Lớp 10A1</option>
                <option value="10A2">Lớp 10A2</option>
                <option value="11A1">Lớp 11A1</option>
                <option value="11A2">Lớp 11A2</option>
                <option value="12A1">Lớp 12A1</option>
                <option value="12A2">Lớp 12A2</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_0_0_#0369A1] active:translate-y-1 active:shadow-[0_0px_0_0_#0369A1] transition-all"
            >
              Khai Thác Hồ Sơ 🔎
            </button>
          </form>
        </div>

        {/* NẾU ĐANG TẢI */}
        {loading && (
          <div className="text-center py-12 text-sky-600 font-bold animate-pulse text-xs uppercase tracking-widest">
            Đang bóc tách dữ liệu nhật ký học tập...
          </div>
        )}

        {/* HIỂN THỊ KẾT QUẢ THỐNG KÊ VÀ LỊCH SỬ KHI ĐÃ TRA CỨU XONG */}
        {!loading && hasSearched && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* GAMIFICATION PANEL */}
            <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-6 items-center md:items-stretch">
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg w-full md:w-1/3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[100px] group-hover:bg-white/20 transition-colors"></div>
                <div className="text-5xl mb-2">{getRank(getLevel(arenaPoints)) === 'Đại Cao Thủ' ? '💎' : getRank(getLevel(arenaPoints)) === 'Cao Thủ' ? '🥇' : getRank(getLevel(arenaPoints)) === 'Chiến Binh' ? '🥈' : '🥉'}</div>
                <h3 className="text-xl font-black uppercase tracking-wider">{getRank(getLevel(arenaPoints))}</h3>
                <p className="text-sm font-medium opacity-80 mt-1">Level {getLevel(arenaPoints)}</p>
                <div className="mt-4 bg-black/20 px-4 py-2 rounded-full border border-white/20 font-mono font-bold text-lg">
                  {arenaPoints} EXP
                </div>
              </div>
              
              <div className="flex-1 w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-5">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Bộ Sưu Tập Huy Hiệu</h3>
                {badges.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm font-medium">
                    Em chưa có huy hiệu nào. Hãy tham gia Đấu trường để thu thập nhé!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {badges.map((badgeId, idx) => {
                      const badgeInfo = BADGE_MAP[badgeId] || { icon: '🎖️', label: badgeId, color: 'bg-slate-100 text-slate-600 border-slate-200' };
                      return (
                        <div key={idx} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${badgeInfo.color} font-bold text-sm shadow-sm hover:scale-105 transition-transform cursor-default`}>
                          <span className="text-xl">{badgeInfo.icon}</span>
                          <span>{badgeInfo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* THẺ PANELS THỐNG KÊ TỔNG HỢP (3 CỘT) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/60 backdrop-blur-md border border-white p-5 rounded-2xl text-center space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chiến dịch đã tham gia</span>
                <span className="text-2xl font-mono font-black text-[#0284C7]">{stats.totalExams} bài thi</span>
              </div>
              <div className="bg-white/60 backdrop-blur-md border border-white p-5 rounded-2xl text-center space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Điểm số trung bình</span>
                <span className={`text-2xl font-mono font-black ${stats.averageScore >= 8 ? 'text-emerald-600' : stats.averageScore >= 5 ? 'text-sky-600' : 'text-rose-500'}`}>
                  {stats.averageScore} / 10
                </span>
              </div>
              <div className="bg-white/60 backdrop-blur-md border border-white p-5 rounded-2xl text-center space-y-1 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kỷ lục cao nhất</span>
                <span className="text-2xl font-mono font-black text-amber-500">{stats.highestScore} / 10</span>
              </div>
            </div>

            {/* BẢNG LIÊN KẾT NHẬT KÝ CHI TIẾT */}
            <div className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-sky-100 pb-3">
                Nhật Ký Khảo Sát Chi Tiết
              </h3>

              {history.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400 font-medium">
                  Em chưa tham gia bài kiểm tra khảo sát nào trên hệ thống.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sky-100">
                        <th className="py-3 px-2 text-xs font-black text-slate-400 uppercase tracking-wider">STT</th>
                        <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Thời Gian Nộp Bài</th>
                        <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Quy Mô Đề</th>
                        <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Kết Quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50 text-sm font-semibold">
                      {history.map((item, index) => (
                        <tr key={item.id} className="hover:bg-sky-50/40 transition-colors">
                          <td className="py-3 px-2 text-slate-400 font-mono text-xs">{index + 1}</td>
                          <td className="py-3 px-4 text-slate-600 text-xs">{formatTime(item.submittedAt)}</td>
                          <td className="py-3 px-4 text-center text-xs text-slate-500">{item.totalQuestions} câu hỏi</td>
                          <td className={`py-3 px-4 text-center font-mono font-black ${item.score >= 8 ? 'text-emerald-600' : item.score >= 5 ? 'text-sky-600' : 'text-rose-500'}`}>
                            {item.score} / 10
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* NẾU CHƯA NHẬP TÊN TÌM KIẾM LẦN ĐẦU */}
        {!hasSearched && !loading && (
          <div className="bg-white/40 p-8 rounded-3xl border border-white/60 text-center text-slate-400 font-medium text-sm">
            💡 Hệ thống sẽ tự động ghi nhớ thông tin của em sau lần tra cứu đầu tiên để tối ưu hóa lộ trình học tập!
          </div>
        )}

      </div>
    </main>
  );
}

export default function ProtectedProfileView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#E0F2FE]"></div>}>
      <StudentProfilePage />
    </Suspense>
  );
}