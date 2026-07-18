"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

const colorThemes = {
  cosmic: {
    name: "🌌 Cosmic Dark",
    isDark: true,
    bgClass: "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900",
    headerBg: "bg-white/10 border-white/20",
    cardBg: "bg-white/5 border-white/10 hover:bg-white/10",
    textMain: "text-white",
    textSub: "text-purple-200",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400",
    sectionBorder: "border-purple-500/30",
    btnLogout: "bg-red-500/20 text-red-300 hover:bg-red-500/40 border-red-500/30",
    iconGlow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]"
  },
  oceanic: {
    name: "🌊 Oceanic Blue",
    isDark: false,
    bgClass: "bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100",
    headerBg: "bg-white/60 border-white/40",
    cardBg: "bg-white/60 border-white/40 hover:bg-white/80",
    textMain: "text-slate-800",
    textSub: "text-slate-600",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600",
    sectionBorder: "border-blue-200",
    btnLogout: "bg-rose-100 text-rose-600 hover:bg-rose-200 border-rose-200",
    iconGlow: "shadow-[0_0_20px_rgba(56,189,248,0.5)]"
  },
  sunset: {
    name: "🌅 Sunset Warm",
    isDark: false,
    bgClass: "bg-gradient-to-br from-orange-100 via-rose-50 to-amber-100",
    headerBg: "bg-white/60 border-white/40",
    cardBg: "bg-white/60 border-white/40 hover:bg-white/80",
    textMain: "text-slate-800",
    textSub: "text-rose-600",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600",
    sectionBorder: "border-orange-200",
    btnLogout: "bg-red-100 text-red-600 hover:bg-red-200 border-red-200",
    iconGlow: "shadow-[0_0_20px_rgba(251,146,60,0.5)]"
  },
  emerald: {
    name: "🌲 Emerald Dark",
    isDark: true,
    bgClass: "bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900",
    headerBg: "bg-white/10 border-white/20",
    cardBg: "bg-white/5 border-white/10 hover:bg-white/10",
    textMain: "text-white",
    textSub: "text-emerald-200",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400",
    sectionBorder: "border-emerald-500/30",
    btnLogout: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 border-rose-500/30",
    iconGlow: "shadow-[0_0_20px_rgba(52,211,153,0.5)]"
  },
  minimal: {
    name: "⚪ Minimal Glass",
    isDark: false,
    bgClass: "bg-slate-100",
    headerBg: "bg-white/80 border-slate-200",
    cardBg: "bg-white/80 border-slate-200 hover:bg-white",
    textMain: "text-slate-800",
    textSub: "text-slate-500",
    accentText: "text-slate-800",
    sectionBorder: "border-slate-300",
    btnLogout: "bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300",
    iconGlow: "shadow-sm"
  }
};

type ThemeKey = keyof typeof colorThemes;

function TeacherDashboard() {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('oceanic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('dashboard_theme') as ThemeKey;
    if (saved && colorThemes[saved]) {
      setActiveTheme(saved);
    }
  }, []);

  const handleThemeChange = (key: ThemeKey) => {
    setActiveTheme(key);
    localStorage.setItem('dashboard_theme', key);
  };

  const theme = colorThemes[activeTheme];

  if (!mounted) return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <div className={`min-h-screen ${theme.bgClass} p-4 md:p-8 font-sans transition-all duration-700 relative overflow-hidden`}>
      {/* Background ambient orbs for dark mode */}
      {theme.isDark && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-[128px] opacity-50 animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-[128px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </>
      )}

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 animate-fadeIn">
        
        {/* --- KHU VỰC HEADER --- */}
        <div className={`flex flex-col md:flex-row justify-between items-center ${theme.headerBg} backdrop-blur-2xl p-8 rounded-3xl shadow-lg border gap-6 transition-all duration-500`}>
          <div>
            <h1 className={`text-2xl md:text-3xl font-black uppercase tracking-wide ${theme.accentText}`}>
              CỔNG CÔNG NGHỆ THÔNG TIN - THẦY HÙNG TBS
            </h1>
            <h2 className={`text-sm md:text-base font-bold uppercase tracking-widest mt-1 ${theme.textSub}`}>
              Trung Tâm Điều Hành Chuyên Môn Tổ Toán
            </h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Theme Selector */}
            <div className={`flex gap-2 p-1.5 rounded-full ${theme.isDark ? 'bg-white/10' : 'bg-black/5'} backdrop-blur-md`}>
              {(Object.keys(colorThemes) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  title={colorThemes[key].name}
                  className={`w-8 h-8 rounded-full transition-all flex items-center justify-center text-sm
                    ${activeTheme === key ? 'scale-110 ring-2 ring-white/50 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}
                  `}
                  style={{
                    background: key === 'cosmic' ? 'linear-gradient(135deg, #312e81, #701a75)' :
                               key === 'oceanic' ? 'linear-gradient(135deg, #0ea5e9, #3b82f6)' :
                               key === 'sunset' ? 'linear-gradient(135deg, #f97316, #e11d48)' :
                               key === 'emerald' ? 'linear-gradient(135deg, #14b8a6, #10b981)' :
                               '#f1f5f9'
                  }}
                >
                  {activeTheme === key && <span className="text-white drop-shadow-md">✓</span>}
                </button>
              ))}
            </div>

            <button 
              onClick={() => router.push('/')}
              className={`px-6 py-2.5 font-bold text-sm uppercase rounded-xl transition-all border backdrop-blur-md ${theme.btnLogout}`}
            >
              Đăng xuất 🚪
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ============ PHÂN HỆ QUẢN TRỊ / GIÁO VIÊN =============== */}
        {/* ========================================================= */}
        <div className="space-y-10">
          
          {/* NHÓM 1: CÔNG CỤ TRỢ LÝ AI */}
          <div>
             <h3 className={`text-lg font-black ${theme.textMain} mb-5 flex items-center gap-3 border-b-2 ${theme.sectionBorder} pb-3`}>
               🤖 TRUNG TÂM TRỢ LÝ AI & BIÊN SOẠN
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Link href="/ai-assistant" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>🧠</div>
                  <h4 className={`font-black ${theme.textMain} text-xl mb-2`}>Trợ lý AI Năng Lực Số</h4>
                  <p className={`text-sm ${theme.textSub} font-medium leading-relaxed`}>Tích hợp AI thiết kế giáo án bài giảng mang định hướng phát triển năng lực số.</p>
                </Link>

                <Link href="/plan-assistant" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>📅</div>
                  <h4 className={`font-black ${theme.textMain} text-xl mb-2`}>Trợ lý Kế Hoạch</h4>
                  <p className={`text-sm ${theme.textSub} font-medium leading-relaxed`}>Xử lý Phụ lục 1, 2, 3: Lập kế hoạch dạy học, phân phối chương trình và ma trận đề.</p>
                </Link>

                <Link href="/editor" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>✍️</div>
                  <h4 className={`font-black ${theme.textMain} text-xl mb-2`}>Trình Biên Soạn TBS</h4>
                  <p className={`text-sm ${theme.textSub} font-medium leading-relaxed`}>Không gian soạn thảo văn bản Toán học độc lập, kết xuất file chuẩn Word và LaTeX.</p>
                </Link>
             </div>
          </div>

          {/* NHÓM 2: QUẢN LÝ CHUYÊN MÔN & NGÂN HÀNG ĐỀ */}
          <div>
             <h3 className={`text-lg font-black ${theme.textMain} mb-5 flex items-center gap-3 border-b-2 ${theme.sectionBorder} pb-3 mt-10`}>
               📚 QUẢN LÝ CHUYÊN MÔN & NGÂN HÀNG ĐỀ
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <Link href="/teacher/news-editor" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>📢</div>
                  <h4 className={`font-black ${theme.textMain} text-lg mb-2`}>Cổng Thông Tin</h4>
                  <p className={`text-xs ${theme.textSub} font-medium leading-relaxed`}>Soạn thảo và đăng tải các bản tin, sự kiện, thông báo mới nhất.</p>
                </Link>

                <Link href="/users" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>🗂️</div>
                  <h4 className={`font-black ${theme.textMain} text-lg mb-2`}>Hồ Sơ & Nhân Sự</h4>
                  <p className={`text-xs ${theme.textSub} font-medium leading-relaxed`}>Quản lý tài khoản học sinh, reset mật khẩu và danh sách cán bộ giáo viên.</p>
                </Link>

                <Link href="/department" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>🏢</div>
                  <h4 className={`font-black ${theme.textMain} text-lg mb-2`}>Tổ Chuyên Môn</h4>
                  <p className={`text-xs ${theme.textSub} font-medium leading-relaxed`}>Quản lý tiến độ nộp kế hoạch và đồng bộ dữ liệu điểm số lên Google Sheets.</p>
                </Link>

                <Link href="/exams" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>📝</div>
                  <h4 className={`font-black ${theme.textMain} text-lg mb-2`}>Ngân Hàng Đề V2</h4>
                  <p className={`text-xs ${theme.textSub} font-medium leading-relaxed`}>Tạo câu hỏi chuẩn JSON, quản lý đồ thị và đóng gói phôi đề kiểm tra.</p>
                </Link>

                <Link href="/documents" className={`${theme.cardBg} backdrop-blur-xl p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group`}>
                  <div className={`text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-1`}>📁</div>
                  <h4 className={`font-black ${theme.textMain} text-lg mb-2`}>Kho Tài Liệu</h4>
                  <p className={`text-xs ${theme.textSub} font-medium leading-relaxed`}>Hệ thống lưu trữ chuyên đề, đề cương dùng chung cho toàn bộ giáo viên.</p>
                </Link>
             </div>
          </div>

          {/* NHÓM 3: HOẠT ĐỘNG NGOẠI KHÓA & MŨI NHỌN */}
          <div>
             <h3 className={`text-lg font-black ${theme.textMain} mb-5 flex items-center gap-3 border-b-2 ${theme.sectionBorder} pb-3 mt-10`}>
               🏆 HOẠT ĐỘNG ĐẶC THÙ & MŨI NHỌN
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <Link href="/games/setup" className={`${theme.cardBg} backdrop-blur-xl p-8 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group flex items-center gap-8`}>
                  <div className={`text-6xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-2`}>🎮</div>
                  <div>
                    <h4 className={`font-black ${theme.accentText} text-2xl mb-2 uppercase tracking-wide`}>CLB VUI HỌC TOÁN</h4>
                    <p className={`text-sm ${theme.textSub} font-medium leading-relaxed`}>Xưởng điều hành Game: Mở phòng thi đấu trực tiếp (Live) và xuất bản mã Game Tự Luyện.</p>
                  </div>
                </Link>

                <Link href="/olympic" className={`${theme.cardBg} backdrop-blur-xl p-8 rounded-3xl shadow-lg border transition-all duration-300 hover:-translate-y-2 group flex items-center gap-8`}>
                  <div className={`text-6xl transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110 ${theme.iconGlow} inline-block rounded-full p-2`}>🏅</div>
                  <div>
                    <h4 className={`font-black ${theme.accentText} text-2xl mb-2 uppercase tracking-wide`}>Lộ trình Olympic 30/4</h4>
                    <p className={`text-sm ${theme.textSub} font-medium leading-relaxed`}>Quản lý kho tài nguyên VDC chuyên sâu (Đại số, Hình học, Số học, Tổ hợp) và sinh đề AI.</p>
                  </div>
                </Link>

             </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function ProtectedTeacherDashboard() {
  return (
    <AuthGuard>
      <TeacherDashboard />
    </AuthGuard>
  );
}