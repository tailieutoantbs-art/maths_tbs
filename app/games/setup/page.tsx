'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';

export default function GameSetupWorkshop() {
  const router = useRouter();
  const { showToast } = useToast();

  const [gameName, setGameName] = useState('');
  const [gameMode, setGameMode] = useState('Thi đấu Trực tiếp (Live)');
  const [targetClass, setTargetClass] = useState('10A1');
  const [countdownTimer, setCountdownTimer] = useState('15'); // Custom timer in minutes
  const [selectedQuestions, setSelectedQuestions] = useState<number>(0);
  
  const [generatedPin, setGeneratedPin] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Xử lý xuất bản Game và sinh Mã PIN
  const handlePublishGame = () => {
    if (!gameName.trim()) {
      showToast('warning', 'Thầy cô vui lòng đặt tên cho trận đấu!');
      return;
    }
    if (selectedQuestions === 0) {
      showToast('warning', 'Vui lòng chọn ít nhất 1 câu hỏi từ Ngân hàng đề!');
      return;
    }

    setIsPublishing(true);

    // Giả lập xử lý đóng gói Game
    setTimeout(() => {
      // Sinh mã PIN ngẫu nhiên 6 chữ số
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPin(`TBS-${pin}`);
      setIsPublishing(false);
      showToast('success', 'Đã khởi tạo phòng thi đấu thành công!');
    }, 1500);
  };

  const handleCopyPin = () => {
    if (!generatedPin) return;
    navigator.clipboard.writeText(generatedPin);
    showToast('info', 'Đã sao chép Mã PIN. Sẵn sàng gửi cho học sinh!');
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#F0FDF4] p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER XƯỞNG GAME */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-200">
                Phân hệ Gamification
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2 flex items-center gap-2">
                🎮 Xưởng Điều Hành: CLB VUI HỌC TOÁN - TBS
              </h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-5 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 border border-slate-200 text-xs uppercase shadow-sm transition-colors"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT TRÁI: CẤU HÌNH TRẬN ĐẤU */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-emerald-100 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[4rem] pointer-events-none -z-0"></div>
                
                <h2 className="text-lg font-black text-emerald-700 uppercase tracking-wider relative z-10 border-b border-emerald-50 pb-2">
                  Thiết lập thông số trận đấu
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Tên nhiệm vụ / Chủ đề trận đấu:</label>
                    <input 
                      type="text"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      placeholder="VD: Chinh phục Đỉnh cao Đạo hàm..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Chế độ chơi:</label>
                    <select 
                      value={gameMode} 
                      onChange={(e) => setGameMode(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400 transition-all"
                    >
                      <option>Thi đấu Trực tiếp (Live)</option>
                      <option>Nhiệm vụ Tự luyện (Homework)</option>
                      <option>Kiểm tra 15 phút (Tính điểm)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Đối tượng tham gia:</label>
                    <select 
                      value={targetClass} 
                      onChange={(e) => setTargetClass(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400 transition-all"
                    >
                      <option>Lớp 10A1</option><option>Lớp 10A2</option>
                      <option>Lớp 11A1</option><option>Toàn khối 12</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pl-1">Bộ đếm ngược thời gian (Phút):</label>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="range" 
                        min="5" max="90" step="5"
                        value={countdownTimer}
                        onChange={(e) => setCountdownTimer(e.target.value)}
                        className="flex-1 accent-emerald-500"
                      />
                      <span className="font-black text-2xl text-emerald-600 w-16 text-center">{countdownTimer}'</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 relative z-10">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Nguồn câu hỏi (Từ Ngân hàng V2):</label>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      Đã chọn: {selectedQuestions} câu
                    </span>
                  </div>
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-3 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => setSelectedQuestions(prev => prev + 10)}>
                    <span className="text-3xl">🗂️</span>
                    <p className="text-sm font-bold text-slate-500">Bấm để trích xuất ngẫu nhiên 10 câu từ Kho dữ liệu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: TRẠM ĐIỀU KHIỂN & MÃ PIN */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-xl text-white text-center relative overflow-hidden flex-1 flex flex-col justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                <div className="relative z-10 space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-100 mb-2">Trạm Phát Sóng Nhiệm Vụ</h3>
                    {generatedPin ? (
                      <div className="space-y-4 animate-fadeIn">
                        <p className="text-sm font-medium text-emerald-50">Mã PIN tham gia trận đấu của học sinh:</p>
                        <div 
                          onClick={handleCopyPin}
                          className="bg-white/20 backdrop-blur-md border-2 border-white/40 p-4 rounded-2xl cursor-pointer hover:bg-white/30 transition-all group"
                          title="Bấm để sao chép"
                        >
                          <span className="text-4xl md:text-5xl font-black tracking-widest text-white drop-shadow-md">{generatedPin}</span>
                          <p className="text-[10px] uppercase font-bold text-emerald-100 mt-2 group-hover:text-white">📋 Bấm để sao chép</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 opacity-80">
                        <span className="text-6xl mb-4 block">🚀</span>
                        <p className="text-sm font-medium">Hoàn tất cấu hình bên trái để sinh mã PIN</p>
                      </div>
                    )}
                  </div>

                  {!generatedPin && (
                    <button 
                      onClick={handlePublishGame}
                      disabled={isPublishing}
                      className="w-full py-4 bg-white text-emerald-700 font-black text-sm uppercase rounded-xl tracking-widest shadow-[0_5px_0_0_#065F46] hover:bg-emerald-50 active:translate-y-1.5 active:shadow-none transition-all flex justify-center items-center gap-2"
                    >
                      {isPublishing ? 'Đang mã hóa... ⏳' : 'PHÁT SÓNG TRẬN ĐẤU'}
                    </button>
                  )}

                  {generatedPin && (
                    <button 
                      onClick={() => setGeneratedPin('')}
                      className="text-xs font-bold text-emerald-100 hover:text-white underline underline-offset-4"
                    >
                      🔄 Hủy và tạo trận đấu mới
                    </button>
                  )}
                </div>
              </div>

              {/* BẢNG ĐIỀU KHIỂN LIVE THU NHỎ */}
              {generatedPin && (
                <div className="bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800 animate-fadeIn relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/20 rounded-bl-full pointer-events-none"></div>
                  <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Live Dashboard
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Đang chờ</p>
                      <p className="text-2xl font-black text-white">0 <span className="text-xs font-normal text-slate-500">HS</span></p>
                    </div>
                    <button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl p-4 text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-rose-900/50">
                      BẮT ĐẦU <br/> GAME ⏭️
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}