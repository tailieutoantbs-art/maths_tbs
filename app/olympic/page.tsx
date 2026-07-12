'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import AuthGuard from '@/components/AuthGuard';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

function OlympicArenaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'topics' | 'schedule'>('topics');
  const [loading, setLoading] = useState(true);
  
  // Trạng thái danh sách chuyên đề nâng cao kéo từ Firebase
  const [advancedTopics, setAdvancedTopics] = useState<any[]>([]);

  // Lịch trình huấn luyện mũi nhọn năm học mới
  const trainingSchedule = [
    { week: 'Tuần 1 - 4', content: 'Chuyên sâu Bất đẳng thức đại số và phương pháp cực trị', PIC: 'Thầy Hùng', status: 'Đang triển khai' },
    { week: 'Tuần 5 - 8', content: 'Hình học phẳng nâng cao: Cấu trúc đường tròn và hàng điểm điều hòa', PIC: 'Giáo viên Toán 02', status: 'Chưa bắt đầu' },
    { week: 'Tuần 9 - 12', content: 'Số học chuyên sâu: Phương trình Diophante và lý thuyết đồng dư', PIC: 'Giáo viên Toán 03', status: 'Chưa bắt đầu' },
    { week: 'Tuần 13 - 16', content: 'Tổ hợp và lý thuyết đồ thị sơ cấp, nguyên lý Dirichlet biến thể', PIC: 'Thầy Hùng', status: 'Chưa bắt đầu' },
  ];

  useEffect(() => {
    const fetchOlympicTopics = async () => {
      try {
        const q = query(collection(db, 'olympic_chuyende'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        // Nếu Firestore chưa có dữ liệu, tự động nạp danh sách mẫu chuẩn chuyên sâu
        if (list.length === 0) {
          setAdvancedTopics([
            {
              id: 'tp1',
              title: 'Phương pháp dồn biến trong chứng minh Bất đẳng thức ba biến',
              math: '\\sum_{cyc} \\frac{a}{b+c} \\ge \\frac{3}{2} + \\sum_{cyc} \\frac{(a-b)^2}{4(a+b)}',
              description: 'Khai thác kỹ thuật đưa biểu thức về trạng thái hai biến bằng nhau để tìm cực trị biên.',
              author: 'Thầy Hùng'
            },
            {
              id: 'tp2',
              title: 'Ứng dụng định lý Ptolemy trong các bài toán định lượng hình học phẳng',
              math: 'AC \\cdot BD = AB \\cdot CD + AD \\cdot BC',
              description: 'Hệ thống hệ thức lượng trong tứ giác nội tiếp và các bài toán cực trị khoảng cách hình học.',
              author: 'Tổ Toán'
            }
          ]);
        } else {
          setAdvancedTopics(list);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu chuyên đề:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOlympicTopics();
  }, []);

  return (
    <main className="min-h-screen bg-[#E0F2FE] p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        
        {/* THANH HEADER ĐIỀU HƯỚNG MANG PHONG CÁCH HOÀNG GIA */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/80 shadow-lg gap-4 relative overflow-hidden">
          {/* Vòng tròn hiệu ứng màu Amber sang trọng đại diện cho giải thưởng vàng */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-200/40 rounded-full blur-3xl -z-10"></div>
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-white text-slate-600 font-bold py-2.5 px-6 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-sm z-10"
          >
            ← Về Workspace
          </button>
          
          <div className="text-center z-10">
            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-[#0284C7] to-amber-500 uppercase tracking-wide">
              Đội Tuyển Học Sinh Giỏi Olympic 30/4
            </h2>
            <p className="text-slate-600 font-bold mt-1 text-xs md:text-sm uppercase tracking-widest">
              Kế hoạch chiến lược & Tài liệu tinh hoa môn Toán
            </p>
          </div>

          {/* Menu chuyển đổi tab tính năng */}
          <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-300/40 z-10">
            <button
              onClick={() => setActiveTab('topics')}
              className={`py-2 px-5 rounded-xl font-bold text-xs md:text-sm transition-all ${activeTab === 'topics' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📚 Kho Chuyên Đề
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-5 rounded-xl font-bold text-xs md:text-sm transition-all ${activeTab === 'schedule' ? 'bg-white text-[#0284C7] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📅 Lộ Trình Huấn Luyện
            </button>
          </div>
        </div>

        {/* ----------------- TAB 1: KHO CHUYÊN ĐỀ NÂNG CAO ----------------- */}
        {activeTab === 'topics' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <span>🏆</span> Thư viện chuyên đề mũi nhọn
              </h3>
              <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-[0_3px_0_0_#B45309] active:translate-y-1 active:shadow-[0_0px_0_0_#B45309] transition-all">
                + Biên Soạn Chuyên Đề Mới
              </button>
            </div>

            {loading ? (
              <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Đang đồng bộ ma trận tài liệu toán nâng cao...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advancedTopics.map((topic) => (
                  <div key={topic.id} className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 transition-colors">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                    <div>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md uppercase border border-amber-200">
                        Chuyên sâu Cao Cấp
                      </span>
                      <h4 className="font-black text-slate-800 text-base md:text-lg mt-3 leading-snug">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                        {topic.description}
                      </p>

                      {/* Khung hiển thị công thức LaTeX trọng tâm */}
                      <div className="my-5 bg-white p-4 rounded-2xl shadow-inner text-center text-slate-800 overflow-x-auto border border-slate-50">
                        <BlockMath math={topic.math || '\\text{Lỗi cấu trúc công thức}'} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-top border-slate-100 pt-3 mt-2 text-[11px] font-bold text-slate-400">
                      <span>Tác giả: <span className="text-slate-600 font-extrabold">{topic.author}</span></span>
                      <button className="text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
                        Xem chi tiết đề cương ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 2: LỘ TRÌNH HUẤN LUYỆN MŨI NHỌN ----------------- */}
        {activeTab === 'schedule' && (
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-2xl rounded-3xl p-6 md:p-8 animate-fadeIn">
            <h3 className="text-lg font-black text-[#0284C7] uppercase tracking-wider mb-6 flex items-center gap-2">
              <span>📅</span> Kế hoạch phân phối huấn luyện Đội tuyển (2026 - 2027)
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs font-black uppercase tracking-wider">
                    <th className="p-4 text-center">Thời Gian</th>
                    <th className="p-4">Nội Dung Trọng Tâm Ôn Luyện</th>
                    <th className="p-4 text-center">Người Phụ Trách</th>
                    <th className="p-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm font-medium text-slate-700">
                  {trainingSchedule.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-center font-black text-[#0284C7] whitespace-nowrap">{item.week}</td>
                      <td className="p-4 font-bold text-slate-800 max-w-md">{item.content}</td>
                      <td className="p-4 text-center font-extrabold text-slate-600 whitespace-nowrap">{item.PIC}</td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase border ${
                          item.status === 'Đang triển khai' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

// KHÓA CHẶT TRANG ÔN THI ĐỘI TUYỂN BẰNG TƯỜNG LỬA BẢO MẬT
export default function ProtectedOlympicPage() {
  return (
    <AuthGuard>
      <OlympicArenaPage />
    </AuthGuard>
  );
}