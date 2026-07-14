'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastProvider';

export default function UsersManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');

  // Dữ liệu mẫu Học sinh
  const [students, setStudents] = useState([
    { id: 'HS26001', name: 'Nguyễn Hải Đăng', gender: 'Nam', dob: '15/08/2010', class: '10A1', defaultPass: 'Tbs@10a1', passChanged: true, status: 'Đang học', note: 'Lớp phó học tập' },
    { id: 'HS26002', name: 'Trần Thị Thu Hà', gender: 'Nữ', dob: '22/11/2010', class: '10A1', defaultPass: 'Tbs@10a1', passChanged: false, status: 'Đang học', note: '' },
    { id: 'HS25045', name: 'Lê Hoàng Bách', gender: 'Nam', dob: '05/02/2009', class: '11A2', defaultPass: 'Tbs@11a2', passChanged: true, status: 'Đang học', note: 'Đội tuyển HSG' },
  ]);

  // Dữ liệu mẫu Giáo viên (ĐÃ BỔ SUNG EMAIL & DIỆN HỢP ĐỒNG)
  const [teachers, setTeachers] = useState([
    { id: 'GV001', name: 'Thầy Hùng', role: 'Tổ trưởng chuyên môn', contractType: 'Cơ hữu', email: 'hung.tbs@thanhbinh.edu.vn', experience: '15 năm', achievements: 'CSTĐ Cấp Tỉnh, GVG', phone: '090xxxxxxx', status: 'Đang công tác' },
    { id: 'GV002', name: 'Cô Phạm Mai', role: 'Giáo viên Toán', contractType: 'Thỉnh giảng', email: 'mai.pham@thanhbinh.edu.vn', experience: '5 năm', achievements: 'GVG Cấp Trường', phone: '091xxxxxxx', status: 'Đang công tác' },
  ]);

  // Xử lý giả lập Import Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('info', `Đang đọc dữ liệu từ file: ${file.name}...`);
      setTimeout(() => {
        showToast('success', 'Đã nhập danh sách thành công từ file Excel!');
      }, 1500);
    }
  };

  // Xử lý Reset Mật khẩu học sinh
  const handleResetPassword = (studentName: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn khôi phục mật khẩu của học sinh ${studentName} về mặc định không?`)) {
      showToast('success', `Đã reset mật khẩu cho học sinh ${studentName}!`);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
          
          {/* HEADER CHUNG */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                Phòng Giáo Vụ Kỹ Thuật Số
              </span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide mt-2">
                Quản Lý Hồ Sơ & Tài Khoản
              </h1>
            </div>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-xs uppercase shadow-sm transition-colors"
            >
              ⬅ Về Dashboard
            </button>
          </div>

          {/* THANH ĐIỀU HƯỚNG TABS */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
            <button 
              onClick={() => setActiveTab('students')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:text-sky-600'}`}
            >
              🎓 Danh Sách Học Sinh
            </button>
            <button 
              onClick={() => setActiveTab('teachers')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              👨‍🏫 Hồ Sơ Giáo Viên
            </button>
          </div>

          {/* VÙNG NỘI DUNG */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[600px]">
            
            {/* ========================================== */}
            {/* TAB 1: QUẢN LÝ HỌC SINH */}
            {/* ========================================== */}
            {activeTab === 'students' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-sky-700 uppercase tracking-wider">Dữ liệu học viên năm học mới</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Quản lý mã định danh, lớp học và bảo mật tài khoản.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm">
                      + Thêm 1 HS
                    </button>
                    <label className="cursor-pointer px-4 py-2 bg-sky-100 text-sky-700 font-bold text-xs uppercase rounded-xl hover:bg-sky-200 transition-colors border border-sky-200 shadow-sm flex items-center gap-2">
                      📥 Nhập từ Excel
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* BẢNG DỮ LIỆU HỌC SINH */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border-b">Mã HS</th>
                        <th className="px-4 py-3 border-b">Họ và Tên</th>
                        <th className="px-4 py-3 border-b">Giới tính / NS</th>
                        <th className="px-4 py-3 border-b">Lớp</th>
                        <th className="px-4 py-3 border-b">Bảo mật (MK)</th>
                        <th className="px-4 py-3 border-b">Ghi chú</th>
                        <th className="px-4 py-3 border-b text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((hs) => (
                        <tr key={hs.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-sky-600">{hs.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{hs.name}</td>
                          <td className="px-4 py-3 font-medium text-xs">{hs.gender} <br/><span className="text-slate-400">{hs.dob}</span></td>
                          <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-1 rounded-md font-bold">{hs.class}</span></td>
                          <td className="px-4 py-3 text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-500">Mặc định: <code className="bg-slate-100 px-1 rounded">{hs.defaultPass}</code></span>
                              {hs.passChanged ? (
                                <span className="text-emerald-600 font-bold">✓ Đã tự đổi MK</span>
                              ) : (
                                <span className="text-rose-500 font-bold">⚠ Chưa đổi MK</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs italic">{hs.note}</td>
                          <td className="px-4 py-3 text-center space-x-2">
                            <button className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Sửa</button>
                            <button onClick={() => handleResetPassword(hs.name)} className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Reset MK</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 2: QUẢN LÝ GIÁO VIÊN */}
            {/* ========================================== */}
            {activeTab === 'teachers' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-indigo-700 uppercase tracking-wider">Hồ sơ Cán bộ - Giáo viên</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Lưu trữ thâm niên, thành tích, tài khoản và phân công chuyên môn.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm">
                      + Thêm GV mới
                    </button>
                    <label className="cursor-pointer px-4 py-2 bg-indigo-100 text-indigo-700 font-bold text-xs uppercase rounded-xl hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm flex items-center gap-2">
                      📥 Nhập file nhân sự
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* BẢNG DỮ LIỆU GIÁO VIÊN */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {teachers.map((gv) => (
                    <div key={gv.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-shadow bg-slate-50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-bl-full -z-0"></div>
                      <div className="relative z-10 flex flex-col h-full">
                        
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded uppercase tracking-wider">{gv.id}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase border ${gv.contractType === 'Cơ hữu' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}>
                            {gv.contractType}
                          </span>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded uppercase ml-auto">{gv.status}</span>
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800">{gv.name}</h3>
                        <p className="text-xs font-bold text-indigo-600 mb-4">{gv.role}</p>
                        
                        <div className="space-y-2.5 text-xs text-slate-600 font-medium border-t border-slate-200 pt-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">📧</span>
                            <span className="truncate" title={gv.email}>{gv.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">📞</span>
                            <span>{gv.phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-slate-400">⏳</span>
                            <span>{gv.experience} thâm niên</span>
                          </div>
                          <div className="flex gap-2 items-start">
                            <span className="text-slate-400 mt-0.5">🏆</span>
                            <span className="leading-relaxed">{gv.achievements}</span>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2 pt-4 border-t border-slate-100">
                          <button className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm">Sửa hồ sơ</button>
                          <button className="flex-1 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm">Khóa TK</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </AuthGuard>
  );
}