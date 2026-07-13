'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/components/ToastProvider';

export default function GameSetupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(''); 
  
  // State lưu trữ dữ liệu thật từ Firebase
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [isFetchingExams, setIsFetchingExams] = useState(true);

  // LẤY DANH SÁCH ĐỀ THI TỪ KHO HỆ THỐNG
  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Quét bảng 'dethi_phongthi' (nơi lưu các đề đã xuất bản từ trang Exams)
        const q = query(collection(db, 'dethi_phongthi'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const examsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAvailableExams(examsData);
        // Tự động chọn đề thi mới nhất làm mặc định
        if (examsData.length > 0) {
          setSelectedExamId(examsData[0].id); 
        }
      } catch (error) {
        console.error("Lỗi tải đề thi:", error);
        showToast('error', 'Không thể tải danh sách đề thi từ hệ thống trung tâm.');
      } finally {
        setIsFetchingExams(false);
      }
    };

    fetchExams();
  }, []);

  const handleCreateGame = async () => {
    if (!selectedExamId) {
      showToast('warning', 'Thầy vui lòng chọn một đề thi trước khi phát hành mã!');
      return;
    }

    setIsCreating(true);
    try {
      // Tìm lấy thông tin chi tiết của đề thi đang được chọn
      const selectedExam = availableExams.find(exam => exam.id === selectedExamId);

      // Sinh mã PIN ngẫu nhiên 6 chữ số
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();

      // Lưu phiên Game này lên Firebase
      await addDoc(collection(db, 'live_games'), {
        pin: newPin,
        examId: selectedExamId,
        examTitle: selectedExam?.title || 'Đề thi Toán học TBS',
        totalQuestions: selectedExam?.totalQuestions || 0,
        hostName: 'Giáo viên Toán TBS',
        status: 'waiting', // waiting (Đang chờ), playing (Đang thi), finished (Đã kết thúc)
        createdAt: serverTimestamp(),
        players: []
      });

      showToast('success', `Đã khởi tạo thành công phòng thi: ${newPin}`);
      router.push(`/games/host/${newPin}`);
    } catch (error) {
      showToast('error', 'Lỗi khi tạo phòng thi. Vui lòng thử lại!');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="max-w-md w-full z-10">
          
          <div className="text-center mb-8 space-y-2">
            <div className="inline-block px-4 py-1.5 bg-indigo-100 rounded-full mb-2">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                Trung Tâm Điều Hành - TBS
              </span>
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 drop-shadow-sm uppercase tracking-wide">
              Thiết Lập
              <br />
              Đấu Trường
            </h1>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-xl relative">
            <div className="space-y-6">
              
              <div className="space-y-2 text-center">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Chọn Bộ Đề Từ Ngân Hàng
                </label>
                
                {/* HIỂN THỊ TRẠNG THÁI TẢI DỮ LIỆU */}
                {isFetchingExams ? (
                  <div className="w-full text-center text-sm font-bold text-slate-500 p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl">
                    <span className="animate-pulse">Đang tải kho đề thi... ⏳</span>
                  </div>
                ) : availableExams.length === 0 ? (
                  <div className="w-full text-center text-sm font-bold text-rose-500 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl">
                    Chưa có đề thi nào! Thầy hãy vào trang "Ngân hàng đề thi" để xuất bản đề trước nhé.
                  </div>
                ) : (
                  <select 
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full text-center text-sm font-bold text-slate-700 p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner truncate"
                  >
                    {/* ĐỔ DỮ LIỆU THẬT VÀO DROPDOWN */}
                    {availableExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title || 'Đề thi không tên'} ({exam.totalQuestions} câu)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCreateGame}
                  disabled={isCreating || isFetchingExams || availableExams.length === 0}
                  className="w-full py-4 bg-gradient-to-b from-indigo-500 to-purple-600 text-white text-lg font-black rounded-2xl shadow-[0_6px_0_0_#4338CA] active:translate-y-1.5 active:shadow-[0_0px_0_0_#4338CA] transition-all uppercase tracking-widest flex justify-center items-center gap-2 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? <span className="animate-spin">⚙️</span> : 'Phát Hành Mã Game'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8 space-y-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline underline-offset-4 transition-colors"
            >
              ⬅ Về trang Dashboard quản trị
            </button>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}